import { Service } from "../src";
import type { Branch, Repo, TargetUrl } from "./REPOS";

class GitRepositoryService implements Service {
    public repos: Repo[] = [];

    constructor(repoUrls: TargetUrl[], public readonly name: string = "repoService") {
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

    public get(path: string): Repo {
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

export default GitRepositoryService;
