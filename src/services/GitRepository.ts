import type { Branch, Repo, TargetUrl } from "../constants";
import { ProgramPort } from "../program.port";
import { REPOS } from "../constants";

export default class GitRepositoryService implements ProgramPort<"repoService"> {
    public repos: Repo[] = [];

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

    public find(path: string): Repo {
        const repo = this.repos.find((repo) => repo.path === path);
        if (!repo) {
            throw new Error(`Repository ${path} not found`);
        }
        return repo;
    }

    public remove(path: string): void {
        this.repos = this.repos.filter((repo) => repo.path !== path);
    }
}
