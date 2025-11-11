import Program from "./program";
import { BasicsService, GitRepositoryService } from "./services";
import OrchestratorService from "./services/Orchestrator";

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === "string");
}

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
        Program.create([new BasicsService(), new GitRepositoryService(), new OrchestratorService()])
            /**
             *
             * Basics Service
             *
             */
            .when(
                "--version",
                ({ deps }) => {
                    const { log, version } = deps.$;
                    log(version());
                },
                "Prints aura-cli version"
            )
            .when(
                "--help",
                ({ deps, routes }) => {
                    const { log } = deps.$;

                    let sorted = routes.reduce((acc, { pattern, description }) => {
                        const formated = `<${pattern}> /**/ ${description || ""}`;
                        pattern.startsWith("--") ? acc.unshift(formated) : acc.push(formated);
                        return acc;
                    }, [] as string[]);

                    log("Usage: aura-cli <command>");
                    log("Available commands:");
                    sorted.forEach((str) => log(str));
                },
                "Prints the list of available routes in this program"
            )
            .when(
                "cwd",
                ({ deps, params }) => {
                    const { $ } = deps;
                    const path = params.cwd as string;

                    if (typeof path !== "string") {
                        throw new Error("cwd parameter must be a string");
                    }

                    $.setCwd(path);
                },
                "Changes the current working directory of the Node.js process"
            )
            /**
             *
             *
             * Git Repository Service
             *
             *
             */
            .when(
                "repos",
                ({ deps, params }) => {
                    const { repoService } = deps;
                    const paths = params.repos as string[];

                    if (!isStringArray(paths)) {
                        throw new Error("repos parameter must be an array of strings. Usage: repos:[repo-1,repo-2]");
                    }

                    const urls = repoService.getUrls(paths);
                    // Returning value is conveniently stored in kv space {"repos" : [...urls]} and accessible later in an handler context
                    return urls;
                },
                "Selects the repos where further modification will apply and store them in the kv space. Usage : repos:[path-1, path-2, ...]"
            )

            .when(
                "--repo-list",
                ({ deps }) => {
                    const { repoService, $ } = deps;
                    const repos = repoService.list();

                    if (repos.length === 0) {
                        $.log("No repositories configured");
                        return;
                    }
                    repos.forEach((str) => $.log(str));
                },
                "List all the repos available in the program"
            )

            .when(
                "--clone",
                async ({ kv, deps }) => {
                    const { repoService, $ } = deps;
                    const urls = kv.repos;

                    if (!urls || !isStringArray(urls)) {
                        throw new Error("No repos selected. Use repos:[repo1,repo2] before --clone");
                    }

                    $.log(`Cloning ${urls.length} repository(ies)...`);
                    const results = await repoService.clone(urls);

                    if (results.failed.length > 0) {
                        $.log(`Failed to clone ${results.failed.length} repo(s)`);
                        throw new Error("Some clones failed. Check errors above.");
                    }

                    $.log(`Successfully cloned ${results.succeeded.length} repository(ies)`);
                },
                "Git clone the selected repos"
            )

            .when(
                "--pull",
                async ({ kv, deps }) => {
                    const { repoService, $ } = deps;
                    let urls = kv.repos;
                    if (!urls) urls = repoService.getUrls();
                    $.log(`Pulling ${urls.length} repository(ies)...`);
                    const results = await repoService.pull(urls);

                    if (results.failed.length > 0) {
                        $.log(`Failed to pull ${results.failed.length} repo(s)`);
                        throw new Error("Some pulls failed. Check errors above.");
                    }

                    $.log(`Successfully pulled ${results.succeeded.length} repository(ies)`);
                },
                "Git pull the selected repos"
            )
            /**
             *
             * Orchestrator Service
             *
             */
            .when(
                "--patch-auth",
                async ({ deps }) => {
                    const { orchestrator, $ } = deps;
                    $.log("Patching root-config of the orchestrator...");
                    const result = await orchestrator.patchAuth();
                    if (result.success) {
                        $.log("Successfully patched root-config");
                    } else {
                        $.log(`Failed to patch root-config: ${result.message}`);
                        throw new Error("Failed to patch root-config");
                    }
                },
                "TEMPORARY scripts -- Patch root-config of the orchestrator in order to bypass auth and receive ESD data"
            )
            .when(
                "--unpatch-auth",
                async ({ deps }) => {
                    const { orchestrator, $ } = deps;
                    $.log("Unpatching root-config of the orchestrator...");
                    const result = await orchestrator.unpatchAuth();
                    if (result.success) {
                        $.log("Successfully unpatched root-config");
                    } else {
                        $.log(`Failed to unpatch root-config: ${result.message}`);
                        throw new Error("Failed to unpatch root-config");
                    }
                },
                "Undo what the --patch-auth command does"
            )
            .when(
                "local-mfe",
                async ({ deps, params }) => {
                    const { orchestrator, $ } = deps;
                    $.log("Attempting to connect a local mfe...");
                    const targets = params["local-mfe"] as [number, string][];
                    if (!targets) $.log("No target found. Command format is : connect-mfe:[[<port>,<mfe-name>]]");
                    for await (const [port, name] of targets) {
                        $.log(`Connecting ${name} on port ${port}...`);
                        const result = await orchestrator.connectMfeModule(port, name);
                        if (result.success) {
                            $.log("Done !");
                        } else {
                            $.log(`Failed to connect ${name} on port ${port}: ${result.message}`);
                            throw new Error(`Failed to connect ${name} on port ${port}`);
                        }
                    }
                },
                "Connect an MFE locally by changing important fields in relevant files"
            )
    );
}

export { default as Program } from "./program";
export type { ProgramPort } from "./program.port";
export { BasicsService, GitRepositoryService } from "./services";

// aura-cli repo:"[1t21-aura-module-esd,1t21-aura-orchestrator]"
