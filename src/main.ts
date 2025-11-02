import { execSync } from "child_process";
import program, { type OptionHandler, type RepoHandler } from "./Program";
import { type Repo } from "./Repo";

program
    /**
     * setting clone directory path
     */
    .when("--outPath", ((value: string) => program.setCloneDir(value)) as OptionHandler)
    /**
     * Include repositories (filter by targeted repositories)
     */
    .when("--repo-include", (({ repos, targeted }) =>
        repos.filter((repo: Repo) => targeted.some((t: Repo) => t.name === repo.name))) as RepoHandler)
    /**
     * Exclude repositories (filter by targeted repositories)
     */
    .when("--repo-exclude", (({ repos, targeted }) =>
        repos.filter((repo: Repo) => !targeted.some((t: Repo) => t.name === repo.name))) as RepoHandler)
    /**
     * include all repositories
     */
    .when("--repo-all", (({ repos }) => repos) as RepoHandler)
    /**
     * Operate on filtered repositories
     */
    .operate(({ repo }: { repo: Repo }) => {
        // repository operations
        execSync(`mkdir -p ${program.cloneDir}/${repo.name}`);
    });
