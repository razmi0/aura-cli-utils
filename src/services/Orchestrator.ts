import { access, open, readFile, unlink, writeFile } from "fs/promises";
import type { ProgramPort } from "../program.port";

interface ImportMap {
    imports: Record<string, string>;
}

interface PackageJson {
    scripts?: Record<string, string>;
    [key: string]: unknown;
}

interface MfeConfig {
    getImportMapPath: (product: string) => string;
    getPackageJsonPath: (name: string) => string;
}

interface PatchConfig {
    linesToComment: number;
    rootConfigPath: string;
    startMarker: string;
    permissionLine: string;
    indent: string;
}

export type OperationResult = {
    success: boolean;
    message: string;
};

const DEFAULT_MFE_CONFIG: MfeConfig = {
    getImportMapPath: (product: string) =>
        `./1t21-aura-orchestrator/products/${product}/importmaps/importmap.local.json`,
    getPackageJsonPath: (name: string) => `./1t21-aura-module-${name}/package.json`,
};

const DEFAULT_PATCH_CONFIG: PatchConfig = {
    linesToComment: 8,
    rootConfigPath: "./1t21-aura-orchestrator/src/root-config.js",
    startMarker: "AuthenticationManager.on('login",
    permissionLine: 'permissionManager.addPermissions("coreelec-esd-admin", "coreelec-esd-read")',
    indent: " ".repeat(2),
};

export default class OrchestratorService implements ProgramPort<"orchestrator"> {
    public readonly name: "orchestrator" = "orchestrator" as const;

    constructor(private readonly mfeConfig?: MfeConfig, private readonly patchConfig?: PatchConfig) {
        this.mfeConfig = mfeConfig ?? DEFAULT_MFE_CONFIG;
        this.patchConfig = patchConfig ?? DEFAULT_PATCH_CONFIG;
    }

    private async fileExists(path: string): Promise<boolean> {
        try {
            await access(path);
            return true;
        } catch {
            return false;
        }
    }

    private async readJsonFile<T>(path: string): Promise<T> {
        if (!(await this.fileExists(path))) {
            throw new Error(`File not found: ${path}`);
        }
        const content = await readFile(path, "utf-8");
        return JSON.parse(content) as T;
    }

    private async withBackup<T>(filePath: string, operation: () => Promise<T>): Promise<T> {
        const backupPath = `${filePath}.backup`;
        try {
            // Create backup
            const original = await readFile(filePath, "utf-8");
            await writeFile(backupPath, original, "utf-8");

            // Perform operation
            const result = await operation();

            // Clean up backup on success
            await unlink(backupPath).catch(() => {});

            return result;
        } catch (error) {
            // Restore from backup on failure
            try {
                const backup = await readFile(backupPath, "utf-8");
                await writeFile(filePath, backup, "utf-8");
                await unlink(backupPath).catch(() => {});
            } catch (restoreError) {
                // Backup restoration failed - log or handle
            }
            throw error;
        }
    }

    private async writeJsonFile<T>(path: string, data: T): Promise<void> {
        const content = JSON.stringify(data, null, 4) + "\n";
        await writeFile(path, content, "utf-8");
    }

    private async mapLines(path: string, cb: (line: string, index: number) => void | Promise<void>): Promise<void> {
        if (!(await this.fileExists(path))) {
            throw new Error(`File not found: ${path}`);
        }
        const fileHandle = await open(path, "r");
        let i = 0;
        try {
            for await (const line of fileHandle.readLines()) {
                await cb(line, i++);
            }
        } finally {
            await fileHandle.close();
        }
    }

    private async safeWriteFile(path: string, content: string): Promise<void> {
        await writeFile(path, content, { encoding: "utf-8" });
    }

    public async patchAuth(): Promise<OperationResult> {
        let modified = 0;
        let isTargetBlock = false;
        let found = false;
        const buffer: string[] = [];

        const { indent, linesToComment, permissionLine, rootConfigPath, startMarker } = this.patchConfig!;

        try {
            await this.mapLines(rootConfigPath, (line) => {
                if (isTargetBlock) {
                    if (modified < linesToComment) {
                        modified++;
                        buffer.push(indent + "//" + line);
                        return;
                    }
                    buffer.push(indent + permissionLine);
                    isTargetBlock = false;
                }
                if (line.startsWith(startMarker)) {
                    isTargetBlock = true;
                    found = true;
                }
                buffer.push(line);
            });

            if (!found) {
                return { success: false, message: "No target block found in root-config.js" };
            }

            await this.safeWriteFile(rootConfigPath, buffer.join("\n"));
            return { success: true, message: `Patched ${modified} lines in root-config.js` };
        } catch (e) {
            return { success: false, message: `Failed to patch auth: ${e instanceof Error ? e.message : String(e)}` };
        }
    }

    public async unpatchAuth(): Promise<OperationResult> {
        let modified = 0;
        let isTargetBlock = false;
        let found = false;
        const buffer: string[] = [];

        const { indent, linesToComment, permissionLine, rootConfigPath, startMarker } = this.patchConfig!;

        try {
            await this.mapLines(rootConfigPath, (line) => {
                if (line.startsWith(indent + "permissionManager.addPermissions(")) {
                    isTargetBlock = false;
                    return;
                }
                if (isTargetBlock) {
                    if (line.startsWith(indent + "//")) {
                        modified++;
                        buffer.push(line.replace("//", "").slice(2));
                        return;
                    }
                }
                if (line.startsWith(startMarker)) {
                    isTargetBlock = true;
                    found = true;
                }
                buffer.push(line);
            });

            if (!found) {
                return { success: false, message: "No target block found in root-config.js" };
            }

            await this.safeWriteFile(rootConfigPath, buffer.join("\n"));
            return { success: true, message: `Unpatched ${modified} lines in root-config.js` };
        } catch (e) {
            return { success: false, message: `Failed to unpatch auth: ${e instanceof Error ? e.message : String(e)}` };
        }
    }

    public async connectMfeModule(port: number, name: string): Promise<OperationResult> {
        const { getImportMapPath, getPackageJsonPath } = this.mfeConfig!;
        // Validation
        if (!name || typeof name !== "string") {
            return { success: false, message: "MFE name must be a non-empty string" };
        }
        if (!Number.isInteger(port) || port < 1024 || port > 65535) {
            return { success: false, message: `Invalid port: ${port}` };
        }

        const moduleKey = `@CoreElec/aura-module-${name}`;
        const moduleUrl = `http://localhost:${port}/CoreElec-aura-module-${name}.js`;
        const product = "a320";
        const importMapPath = getImportMapPath(product);
        const packageJsonPath = getPackageJsonPath(name);

        try {
            // Update both files with backup protection
            await this.withBackup(importMapPath, async () => {
                const importMap = await this.readJsonFile<ImportMap>(importMapPath);

                if (!importMap.imports || !(moduleKey in importMap.imports)) {
                    throw new Error(`Module "${name}" not found in import map`);
                }

                importMap.imports[moduleKey] = moduleUrl;
                await this.writeJsonFile(importMapPath, importMap);
            });

            await this.withBackup(packageJsonPath, async () => {
                const packageJson = await this.readJsonFile<PackageJson>(packageJsonPath);

                if (!packageJson.scripts || !packageJson.scripts["start:dev"]) {
                    throw new Error(`No "start:dev" script found in ${name}/package.json`);
                }

                packageJson.scripts["start:dev"] = `webpack serve --port ${port}`;
                await this.writeJsonFile(packageJsonPath, packageJson);
            });

            return { success: true, message: `Connected ${name} on port ${port}` };
        } catch (e) {
            if (e instanceof SyntaxError) {
                return { success: false, message: `Invalid JSON: ${e.message}` };
            }
            return {
                success: false,
                message: `Failed to connect module: ${e instanceof Error ? e.message : String(e)}`,
            };
        }
    }
}
