import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { ProgramPort } from "../program.port";

function findPackageJson(startPath: string): string {
    let currentPath = startPath;

    // Traverse up the directory tree until we find package.json
    while (currentPath !== dirname(currentPath)) {
        const packageJsonPath = join(currentPath, "package.json");
        if (existsSync(packageJsonPath)) {
            return packageJsonPath;
        }
        const parentPath = dirname(currentPath);
        // Stop if we've reached the filesystem root
        if (parentPath === currentPath) {
            break;
        }
        currentPath = parentPath;
    }

    throw new Error("Could not find package.json");
}

const getVersion = () => {
    const currentFileDir = dirname(fileURLToPath(import.meta.url));
    const packageJsonPath = findPackageJson(currentFileDir);
    return "v" + JSON.parse(readFileSync(packageJsonPath, "utf-8")).version;
};

const version = getVersion();

export default class BasicsService implements ProgramPort<"$"> {
    constructor(public readonly name: "$" = "$" as const) {}
    public readonly version: () => string = () => version;

    public readonly log: (message: string, origin?: string) => void = (message: string, origin?: string) => {
        console.log(`\x1b[92m[${origin ? origin : "AURA"}]\x1b[0m\x1b[90m[${version}]\x1b[0m ${message}`);
        // darkgrey : \x1b[90m
    };
}
