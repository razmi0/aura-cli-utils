const ARGS = process.argv.slice(2);

export type Repo = {
    name: string;
    url: string;
    branch: string;
    type: "module" | "library" | "orchestrator" | "template";
    asArg: string;
};

class RepoManager {
    private prefix: string = "https://github.com/1t21-aura-";
    public repos: Repo[] = [];
    public targeted: Record<string, Repo[]> = {};

    constructor(repoNames: string[], args: string[] = ARGS) {
        this.repos = repoNames.map((repoName) => this.createRepo(repoName));
        this.setup(args);
    }

    setup(args: string[]) {
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (arg.startsWith("--repo-")) {
                const command = arg.split("--repo-")[1];
                this.targeted[command] = [];
                let j = i + 1;
                while (j < args.length && !args[j].startsWith("--")) {
                    const repo = this.repos.find((repo) => repo.asArg === args[j]);
                    if (repo) {
                        this.targeted[command].push(repo);
                    }
                    j++;
                }
                i = j - 1;
            }
        }
    }

    createRepo(packageName: string, branch?: string): Repo {
        const newRepo = {
            name: packageName,
            url: `${this.prefix}${packageName}.git`,
            branch: branch || "main",
        } as Repo;

        const parts = packageName.split("-");

        const type = parts.find((part) => ["module", "library", "template"].includes(part));

        if (!type) {
            throw new Error(`Could not infer type and asArg for ${packageName}`);
        }

        newRepo.type = type as Repo["type"];
        const rest = parts.slice(parts.indexOf(type) + 1);

        if (type === "module" && rest.length === 1 && rest[0] === "orchestrator") {
            newRepo.type = "orchestrator";
            newRepo.asArg = "orchestrator";
        }
        newRepo.asArg = rest.join("-");

        return newRepo;
    }
}

export default RepoManager;
