import { execSync } from "child_process";
import REPOS from "../REPOS";
import Program from "./Program";
import RepoManager from "./Repo";

/**
 * Add your 1t21-aura repository names here in the form "<type>-<name>".
 *
 */
const program = new Program(new RepoManager(REPOS));

// Apply repo filtering operations (chain in order)
program
    .option("--outPath", (value) => {
        program.setCloneDir(value);
    })
    /**
     * Include repositories (filter by targeted repositories)
     */
    .add("--repo-include", ({ repos, targeted }) => repos.filter((repo) => targeted.some((t) => t.name === repo.name)))
    /**
     * Exclude repositories (filter by targeted repositories)
     */
    .add("--repo-exclude", ({ repos, targeted }) => repos.filter((repo) => !targeted.some((t) => t.name === repo.name)))
    /**
     * Default behavior (all repositories) - only applies when no repo commands are present
     */
    .add(null, ({ repos }) => repos)
    /**
     * Operate on selected repositories
     */
    .operate(({ repo }) => {
        // repository operations
        console.log(`\x1b[33;1mCloning repository : \x1b[0m${repo.name}`);
        execSync(`mkdir -p ${program.cloneDir}/${repo.name}`);
    });
