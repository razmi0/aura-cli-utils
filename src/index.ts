import Program from "./program";
import { BasicsService, GitRepositoryService } from "./services";

/**
 * Creates the base Aura CLI program with default routes and dependencies.
 * This is the main export for library users who want to extend the program.
 *
 * @example
 * ```ts
 * import { createAuraProgram } from 'aura-cli';
 *
 * const program = createAuraProgram()
 *   .when('--custom', ({ args, deps, routes }) => {
 *     const { $ , repoService } = deps;
 *     // $.log(repoService.find("1t21-aura-module-esd"));
 *   });
 *
 * program.run();
 * ```
 */
export function createAuraProgram() {
    return (
        Program.create([new BasicsService(), new GitRepositoryService()])
            /**
             *
             * Basics Service
             *
             */
            .when("--version", ({ deps }) => {
                const { log, version } = deps.$;
                log(version());
                process.exit(0);
            })
            .when("--help", ({ deps, routes }) => {
                const { log } = deps.$;
                log("Usage: aura-cli <command>");
                log("Available commands:");
                routes.forEach((route) => {
                    log(`  ${route.pattern}`);
                });
                process.exit(0);
            })
            /**
             *
             *
             * Git Repository Service
             *
             *
             */
            .when("cwd", ({ deps, params }) => {
                const { repoService } = deps;
                const path = params.cwd;
                repoService.setCwd(path);
            })
            .when("repos", ({ deps, params }) => {
                const { repoService } = deps;
                const paths = params.repos;
                const urls = repoService.getUrls(paths);
                return urls;
            })
            .when("--clone", async ({ kv, deps }) => {
                const { repoService } = deps;
                const urls = kv.repos;
                await repoService.clone(urls);
                process.exit(0);
            })
            .when("--pull", async ({ kv, deps }) => {
                const { repoService } = deps;
                const urls = kv.repos;
                await repoService.pull(urls);
                process.exit(0);
            })
            .when("--patch-auth", async ({ deps }) => {
                const { repoService } = deps;
                await repoService.patchAuth();
                process.exit(0);
            })
    );
}

// Also export the Program class and services for advanced use cases
export { default as Program } from "./program";
export type { ProgramPort } from "./program.port";
export { BasicsService, GitRepositoryService } from "./services";

// aura-cli repo:"[1t21-aura-module-esd,1t21-aura-orchestrator]"
