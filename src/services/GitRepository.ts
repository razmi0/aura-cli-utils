import { exec } from "child_process";
import { chmod, open, writeFile } from "fs/promises";
import { promisify } from "util";
import type { Branch, Repo, TargetUrl } from "../constants";
import { REPOS } from "../constants";
import { ProgramPort } from "../program.port";

const execAsync = promisify(exec);

/**
 * Git repository service adapter for cloning and patching repos.
 */
export default class GitRepositoryService implements ProgramPort<"repoService"> {
    public repos: Repo[] = [];
    public patcherConfig = {
        linesToComment: 8,
        rootConfigPath: "./1t21-aura-orchestrator/src/root-config.js",
        startMarker: "AuthenticationManager.on('login",
        permissionLine: '  permissionManager.addPermissions("coreelec-esd-admin)',
    };

    /** Initializes repos from URLs and branches. */
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

    /** Returns repository URLs for given paths. */
    public getUrls(reposPaths: string[]): string[] {
        return this.repos.filter((repo) => reposPaths.includes(repo.path)).map((repo) => repo.url);
    }

    /** Changes current working directory to specified path. */
    public setCwd(path: string): void {
        console.log(`From ${process.cwd()}`);
        process.chdir(path);
        console.log(`To ${process.cwd()}`);
    }

    /** Logs rejected promise results to console. */
    private outputResults(results: PromiseSettledResult<unknown>[]): void {
        results.forEach((result) => {
            if (result.status === "rejected") {
                console.error(result.reason);
                console.log("\n");
            }
        });
    }

    /** Executes multiple git commands in parallel. */
    private async executeCommand(commands: string[]): Promise<void> {
        const results = await Promise.allSettled(
            commands.map(async (command) => {
                await execAsync(command);
            })
        );
        this.outputResults(results);
    }

    /** Clones git repositories from provided URLs. */
    public async clone(urls: string[]): Promise<void> {
        await this.executeCommand(urls.map((url) => `git clone ${url}`));
    }

    /** Pulls latest changes from git repositories. */
    public async pull(urls: string[]): Promise<void> {
        await this.executeCommand(urls.map((url) => `git pull ${url}`));
    }

    /** Fetches updates from git repositories. */
    public async fetch(urls: string[]): Promise<void> {
        await this.executeCommand(urls.map((url) => `git fetch ${url}`));
    }

    /** Maps over file lines with callback function. */
    private async mapLines(cb: (line: string, index: number) => void): Promise<void> {
        const fileHandle = await open(this.patcherConfig.rootConfigPath, "r");
        let i = 0;
        for await (const line of fileHandle.readLines()) {
            await cb(line, i);
            i++;
        }
        fileHandle.close();
    }

    /** Patches authentication configuration in root config. */
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

    /** Write a prepare-commit-msg hook that generates checkpoint:DD/MM/YYYY, only runs on main and on given path */
    public async addCommitMessageHook(path: string): Promise<void> {
        const hookPath = `${path}/.git/hooks/prepare-commit-msg`;
        console.log(`Writing commit message hook to ${hookPath}`);
        const hookContent = `#!/bin/bash
        # .git/hooks/prepare-commit-msg

        # Get current branch name
        BRANCH_NAME=$(git symbolic-ref --short HEAD 2>/dev/null)

        # Only auto-generate commit message on main branch
        if [ "$BRANCH_NAME" = "main" ]; then
        # Get current date in DD/MM/YYYY format
        DATE=$(date +"%d/%m/%Y")
        
        # Overwrite commit message with checkpoint format
        echo "checkpoint:$DATE" > "$1"
        fi
        `;
        try {
            await writeFile(hookPath, hookContent, { encoding: "utf-8" });
            await chmod(hookPath, 0o755);
            console.log(`Success`);
            process.exit(0);
        } catch (error) {
            console.error(`Error writing commit message hook to ${hookPath}: ${error}`);
            process.exit(1);
        }
    }
}
