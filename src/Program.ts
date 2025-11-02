import path from "path";
import RepoManager, { type Repo } from "./Repo";

const ARGS = process.argv.slice(2);
const COMMANDS = ARGS.filter((arg) => arg.startsWith("--"));
const REPO_COMMANDS = ARGS.filter((arg) => arg.startsWith("--repo-"));

type Context = {
    repos: Repo[];
    targeted: RepoManager["targeted"][string];
    commands: string[];
    args: string[];
};

type RepoSetter = (context: Context) => void | Repo[];

type OperateParams = {
    repo: Repo;
    commands: string[];
    args: string[];
};

export default class Program {
    private context: Context = { repos: [], targeted: [], commands: COMMANDS, args: ARGS };
    public cloneDir: string = process.cwd();
    public options: Record<string, string> = {};

    constructor(private repoManager: RepoManager) {
        this.context.repos = this.repoManager.repos;
        this.parseOptions();
    }

    private parseOptions() {
        for (let i = 0; i < ARGS.length; i++) {
            const arg = ARGS[i];
            if (arg.startsWith("--") && !arg.startsWith("--repo-")) {
                const command = arg.split("--")[1];
                if (i + 1 < ARGS.length) {
                    this.options[command] = ARGS[i + 1];
                    i++; // Skip the next argument as it's the value
                }
            }
        }
    }

    setCloneDir(cloneDir: string) {
        this.cloneDir = path.resolve(process.cwd(), cloneDir);
        console.log(`\x1b[33;1mSetting clone directory to : \x1b[0m${this.cloneDir}`);
        return this;
    }

    add(cmd: string | null, repoSetter: RepoSetter): this {
        const shouldApplyDefault = cmd === null && REPO_COMMANDS.length === 0;
        const shouldApplyCommand = cmd && COMMANDS.includes(cmd);

        if (!shouldApplyDefault && !shouldApplyCommand) return this;

        const targeted = shouldApplyDefault
            ? this.repoManager.repos
            : this.repoManager.targeted[cmd!.replace("--repo-", "")] ?? [];
        this.context.targeted = targeted;

        const updatedRepos = repoSetter(this.context) ?? this.context.repos;
        this.context.repos = updatedRepos;

        return this;
    }

    option(cmd: string, cb: (value: string) => void) {
        // Extract option key from command (remove -- prefix)
        const optionKey = cmd.replace(/^--/, "");
        const value = this.options[optionKey];
        if (value !== undefined) {
            cb(value);
        }
        return this;
    }

    operate(cb: (params: OperateParams) => void): this {
        this.context.repos.forEach((repo) => cb({ repo, commands: this.context.commands, args: this.context.args }));
        return this;
    }
}
