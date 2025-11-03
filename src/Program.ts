import path from "path";
import REPOS from "../REPOS";
import ArgumentParser from "./ArgumentParser";
import { logInfo, showHelp, showVersion } from "./helpers";
import RepoManager, { type Repo } from "./Repo";

type Context = {
    repos: Repo[];
    targeted: RepoManager["targeted"][string];
    args: string[];
};

export type RepoHandler = (context: Context) => void | Repo[];
export type OptionHandler = (value: string) => void;
export type HelpHandler = () => void;
export type VersionHandler = () => void;

type OperateParams = {
    repo: Repo;
    args: string[];
};

/**
 *
 */
class Program {
    private context: Context = { repos: [], targeted: [], args: [] };
    public cloneDir: string = process.cwd();

    constructor(private repoManager: RepoManager, private parser: ArgumentParser) {
        this.context.repos = this.repoManager.repos;
        this.context.args = process.argv.slice(2);
    }

    when(cmd: string, handler: RepoHandler | OptionHandler): this {
        // Repository command (starts with --repo-)
        if (cmd.startsWith("--repo-")) {
            const commandKey = cmd.replace("--repo-", "");
            const targeted = this.repoManager.targeted[commandKey];
            if (targeted && targeted.length > 0) {
                this.context.targeted = targeted;

                const result = handler as RepoHandler;
                const updatedRepos = result(this.context) ?? this.context.repos;
                this.context.repos = updatedRepos;
            }
            return this;
        }

        // Regular option (other -- flags)
        if (cmd.startsWith("--")) {
            const optionKey = cmd.replace(/^--/, "");
            const value = this.parser.getOption(optionKey);
            if (value !== undefined) {
                const result = handler as OptionHandler;
                result(value);
            }
            return this;
        }

        return this;
    }

    setCloneDir(cloneDir: string) {
        this.cloneDir = path.resolve(process.cwd(), cloneDir);
        logInfo("Setting outDir", this.cloneDir);
        return this;
    }

    operate(cb: (params: OperateParams) => void): this {
        // Check for help/version flags first - these should exit immediately
        if (this.parser.hasFlag("--help")) {
            showHelp();
            return this;
        }

        if (this.parser.hasFlag("--version")) {
            showVersion();
            return this;
        }

        // If no repo commands are provided, show help and exit
        if (!this.parser.hasRepoCommands()) {
            showHelp();
            return this;
        }

        logInfo("Operating", `${this.context.repos.length} repositories`);
        this.context.repos.forEach((repo) => cb({ repo, args: this.context.args }));
        return this;
    }
}

const parser = new ArgumentParser();
if (parser.isEmpty()) showHelp();

const repoManager = new RepoManager(REPOS, parser.repoCommands);
/**
 * singleton instance of Program
 */
export default new Program(repoManager, parser)
    /**
     * help and version handlers
     */
    .when("--help", showHelp)
    .when("--version", showVersion);
