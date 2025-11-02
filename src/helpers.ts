import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

export const showHelp = () => {
    console.log(`
\x1b[33;1mMFS Scripts - Repository Management CLI\x1b[0m

A command-line tool for managing and cloning multiple 1t21-aura GitHub repositories efficiently.

\x1b[1mUsage:\x1b[0m
  node ./bin/utils.js [options] [repo-commands]

\x1b[1mOptions:\x1b[0m
  --outPath <directory>    Specify the directory where repositories will be cloned
  --help                   Show this help message
  --version                Show version information

\x1b[1mRepository Commands:\x1b[0m
  --repo-include <repo1> <repo2> ...    Include only the specified repositories
  --repo-exclude <repo1> <repo2> ...    Exclude the specified repositories

\x1b[1mExamples:\x1b[0m
  # Clone all repositories to a specific directory
  node ./bin/utils.js --outPath ../aura

  # Clone only specific repositories
  node ./bin/utils.js --outPath ../aura --repo-include esd orchestrator

  # Clone all repositories except certain ones
  node ./bin/utils.js --outPath ../aura --repo-exclude default-content sidebar

\x1b[33mNote:\x1b[0m Repositories are identified by their \`asArg\` value (the part after the type prefix).
For example: \`module-esd\` → \`esd\`, \`module-orchestrator\` → \`orchestrator\`
`);
    process.exit(0);
};
export const showVersion = () => {
    console.log(
        JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf-8")).version
    );
    process.exit(0);
};

export const logInfo = (prefix: string, message: string) => {
    console.log(`\x1b[2;30m[info]\x1b[0m \x1b[33;1m${prefix}\x1b[0m \x1b[90;1m${message}\x1b[0m`);
};
