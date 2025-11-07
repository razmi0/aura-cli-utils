import { exec } from "child_process";
import { open, writeFile } from "fs/promises";
import { promisify } from "util";
import type { Branch, Repo, TargetUrl } from "../constants";
import { REPOS } from "../constants";
import { ProgramPort } from "../program.port";

const execAsync = promisify(exec);

export default class GitRepositoryService implements ProgramPort<"repoService"> {
    public repos: Repo[] = [];
    public patcherConfig = {
        linesToComment: 8,
        rootConfigPath: "./1t21-aura-orchestrator/src/root-config.js",
        startMarker: "AuthenticationManager.on('login",
        permissionLine: '  permissionManager.addPermissions("coreelec-esd-admin)',
    };

    constructor(repoUrls: TargetUrl[] = REPOS, public readonly name: "repoService" = "repoService" as const) {
        this.repos = repoUrls.map((repoUrl) => {
            const [url, branch] = repoUrl.split("@");
            const path = url.split("/").pop()?.split(".")[0];
            if (!path) {
                throw new Error(`Could not infer path for ${repoUrl}`);
            }
            return {
                path,
                url,
                branch: branch as Branch,
            };
        });
    }

    // without branch for now
    public getUrls(reposPaths: string[]): string[] {
        return this.repos.filter((repo) => reposPaths.includes(repo.path)).map((repo) => repo.url);
    }

    public setCwd(path: string): void {
        console.log(`From ${process.cwd()}`);
        process.chdir(path);
        console.log(`To ${process.cwd()}`);
    }

    private outputResults(results: PromiseSettledResult<unknown>[]): void {
        results.forEach((result) => {
            if (result.status === "rejected") {
                console.error(result.reason);
                console.log("\n");
            }
        });
    }

    private async executeCommand(commands: string[]): Promise<void> {
        const results = await Promise.allSettled(
            commands.map(async (command) => {
                await execAsync(command);
            })
        );
        this.outputResults(results);
    }

    public async clone(urls: string[]): Promise<void> {
        await this.executeCommand(urls.map((url) => `git clone ${url}`));
    }

    public async pull(urls: string[]): Promise<void> {
        await this.executeCommand(urls.map((url) => `git pull ${url}`));
    }

    public async fetch(urls: string[]): Promise<void> {
        await this.executeCommand(urls.map((url) => `git fetch ${url}`));
    }

    private async mapLines(cb: (line: string, index: number) => void): Promise<void> {
        const fileHandle = await open(this.patcherConfig.rootConfigPath, "r");
        let i = 0;
        for await (const line of fileHandle.readLines()) {
            await cb(line, i);
            i++;
        }
        fileHandle.close();
    }

    public async patchAuth(): Promise<void> {
        let modified = 0;
        let isTargetBlock = false;
        let found = [false, 0];
        let buffer: string[] = [];

        await this.mapLines((line, i) => {
            if (isTargetBlock) {
                if (modified < this.patcherConfig.linesToComment) {
                    modified++;
                    if (line.startsWith("//")) line = line.slice(2);
                    buffer.push("//" + line);
                    return;
                }
                buffer.push(this.patcherConfig.permissionLine);
                isTargetBlock = false;
            }
            if (line.startsWith(this.patcherConfig.startMarker)) {
                isTargetBlock = true;
                found = [true, i];
            }
            buffer.push(line);
        });

        if (found[0]) {
            console.log(`Found ${found[1]} lines to comment`);
            await writeFile(this.patcherConfig.rootConfigPath, buffer.join("\n"), { encoding: "utf-8" });
        } else {
            console.log("No target block found");
        }
    }
}
