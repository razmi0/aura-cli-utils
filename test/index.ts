import Program from "../src/program";
import BasicsService from "../src/services";
import GitRepositoryService from "./GitRepositoryService";
import REPOS from "./REPOS";

const basicsProgram = Program.create([new BasicsService()]).when("--intro", ({ deps }) => {
    deps.$.log("intro");
});

const repoProgram = Program.create([new GitRepositoryService(REPOS)]).when("--repos", ({ deps }) => {
    console.log(deps.repoService.find("1t21-aura-module-esd"));
});

const mainProgram = basicsProgram.merge(repoProgram).when("--merged", ({ deps }) => {
    deps.$.log("merged");
    console.log(deps.repoService.repos.map((repo) => repo.path));
});

mainProgram.run();
