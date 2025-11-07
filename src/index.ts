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
    return Program.create([new BasicsService(), new GitRepositoryService()])
        .when("--version", ({ deps }) => {
            deps.$.log(deps.$.version());
            process.exit(0);
        })
        .when("help", ({ deps, routes }) => {
            deps.$.log("Usage: aura-cli <command>");
            deps.$.log("Available commands:");
            routes.forEach((route) => {
                deps.$.log(`  ${route.pattern}`);
            });
            process.exit(0);
        });
}

// Also export the Program class and services for advanced use cases
export { default as Program } from "./program";
export type { ProgramPort } from "./program.port";
export { BasicsService, GitRepositoryService } from "./services";
