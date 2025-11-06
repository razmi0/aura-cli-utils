import assert from "node:assert";
import program from "../src";
import GitRepositoryService from "./GitRepositoryService";
import REPOS from "./REPOS";

program
    .add(new GitRepositoryService(REPOS))
    .when("intro", (args, { $ }) => {
        $.log(`args: ${args.map(({ type, name, value }) => `{ ${name}: ${value} }`).join(", ")}`);
    })
    .when("repos", (args, { $, repoService }) => {
        assert(repoService, "Repo service not found");
        assert(repoService.repos.length > 0, "No repositories found");
        $.log(`repos: ${repoService.repos.map((repo) => repo.path).join(", ")}`);
        // $.
        // repoService.
    })
    .run();

console.log(program);
