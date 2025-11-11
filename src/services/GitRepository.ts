import { exec } from "child_process";
import { access, chmod, writeFile } from "fs/promises";
import { promisify } from "util";
import { REPOS } from "../constants";
import { ProgramPort } from "../program.port";

export type TargetUrl = AsUrl<Name, Branch>;
export type Repo = {
    path: string;
    url: string;
    branch: Branch;
};

type Prefix = "https://github.airbus.corp/Airbus/1t21-aura-";
type Feature = "module" | "library" | "template";
type Name = `${Feature}-${string}` | `orchestrator`;
type Extension = "git";
type Branch = `@${string}`;
type AsUrl<N extends Name, B extends Branch> = `${Prefix}${N}.${Extension}${B}`;

export type OperationResult = {
    succeeded: string[];
    failed: Array<{ url: string; error: string }>;
};

const execAsync = promisify(exec);

/**
 * Git repository service adapter for cloning and patching repos.
 */
export default class GitRepositoryService implements ProgramPort<"repoService"> {
    public readonly name: "repoService" = "repoService" as const;
    public repos: Repo[] = [];

    /** Initializes repos from URLs and branches. */
    constructor(repoUrls: TargetUrl[] = REPOS) {
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

    /** Print registered repos */
    public list(): string[] {
        return this.repos.map((repo, i) => `\x1b[90m${i}\x1b[0m : ${repo.path}@${repo.branch}`);
    }

    /** Returns repository URLs for given paths. */
    public getUrls(reposPaths?: string[]): string[] {
        if (!reposPaths) return this.repos.map((r) => r.url);
        return this.repos.filter((repo) => reposPaths.includes(repo.path)).map((repo) => repo.url);
    }

    /** Executes multiple git commands with proper error handling. */
    private async executeCommand(urls: string[], mk: (url: string) => string): Promise<OperationResult> {
        const commands = urls.map(mk);

        const results = await Promise.allSettled(
            commands.map(async (command) => {
                try {
                    const { stderr } = await execAsync(command);
                    if (stderr && !/^(Cloning into|Already up to date)/.test(stderr)) {
                        // Non-fatal warnings logged
                        console.warn(stderr);
                    }
                    return;
                } catch (error) {
                    throw new Error(error instanceof Error ? error.message : String(error));
                }
            })
        );

        const succeeded: string[] = [];
        const failed: Array<{ url: string; error: string }> = [];

        results.forEach((r, i) => {
            if (r.status === "fulfilled") {
                succeeded.push(urls[i]);
            } else {
                failed.push({ url: urls[i], error: r.reason instanceof Error ? r.reason.message : String(r.reason) });
            }
        });

        return { succeeded, failed };
    }

    /**
     * __important__ : Working directory should be at aura hub
     */
    public async clone(urls: string[]): Promise<OperationResult> {
        if (!Array.isArray(urls) || urls.length === 0) {
            throw new Error("No URLs provided to clone");
        }
        return this.executeCommand(urls, (u) => `git clone ${u}`);
    }

    /**
     * __important__ : Working directory should be at aura hub
     */
    public async pull(urls: string[]): Promise<OperationResult> {
        if (!Array.isArray(urls) || urls.length === 0) {
            throw new Error("No URLs provided to pull");
        }
        return this.executeCommand(urls, (u) => `git pull ${u}`);
    }

    /**
     * __important__ : Working directory should be at aura hub
     */
    public async fetch(urls: string[]): Promise<OperationResult> {
        if (!Array.isArray(urls) || urls.length === 0) {
            throw new Error("No URLs provided to fetch");
        }
        return this.executeCommand(urls, (u) => `git fetch ${u}`);
    }

    public async addCommitMessageHook(path: string): Promise<void> {
        const hookPath = `${path}/.git/hooks/prepare-commit-msg`;

        try {
            await access(`${path}/.git`);
        } catch {
            throw new Error(`Not a git repository: ${path}`);
        }

        const hookContent = `#!/bin/bash
# .git/hooks/prepare-commit-msg

# Get current branch name
BRANCH_NAME=$(git symbolic-ref --short HEAD 2>/dev/null)

# Only auto-generate commit message on main branch
if [ "$BRANCH_NAME" = "main" ]; then
  # Get current date in DD/MM/YYYY format
  DATE=$(date +"%d/%m/%Y")
  echo "checkpoint:$DATE" > "$1"
fi
`;

        await writeFile(hookPath, hookContent, { encoding: "utf-8" });
        await chmod(hookPath, 0o755);
        console.log(`Prepared commit message hook at ${hookPath}`);
    }
}
