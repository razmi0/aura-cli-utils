import type { Branch, Repo, TargetUrl } from "../constants";
import { REPOS } from "../constants";
import { ProgramPort } from "../program.port";

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

    // without branch for now
    public getUrls(reposPaths: string[]): string[] {
        return this.repos.filter((repo) => reposPaths.includes(repo.path)).map((repo) => repo.url);
    }
}
