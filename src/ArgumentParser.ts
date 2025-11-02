export default class ArgumentParser {
    public options: Record<string, string> = {};
    public repoCommands: Record<string, string[]> = {};
    private flags: Set<string> = new Set();

    constructor(args: string[] = process.argv.slice(2)) {
        this.parse(args);
    }

    private parse(args: string[]) {
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];

            // Handle flags (--help, --version)
            if (arg === "--help" || arg === "--version") {
                this.flags.add(arg);
                continue;
            }

            // Handle repository commands (--repo-*)
            if (arg.startsWith("--repo-")) {
                const command = arg.replace("--repo-", "");
                this.repoCommands[command] = [];

                // Collect arguments until next flag
                let j = i + 1;
                while (j < args.length && !args[j].startsWith("--")) {
                    this.repoCommands[command].push(args[j]);
                    j++;
                }
                i = j - 1;
                continue;
            }

            // Handle regular options (--option value)
            if (arg.startsWith("--")) {
                const optionKey = arg.replace(/^--/, "");
                if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
                    this.options[optionKey] = args[i + 1];
                    i++; // Skip the next argument as it's the value
                } else {
                    // Flag without value
                    this.flags.add(arg);
                }
            }
        }
    }

    hasFlag(flag: string): boolean {
        return this.flags.has(flag);
    }

    getOption(key: string): string | undefined {
        return this.options[key];
    }

    isEmpty(): boolean {
        return (
            Object.keys(this.options).length === 0 &&
            Object.keys(this.repoCommands).length === 0 &&
            this.flags.size === 0
        );
    }

    hasRepoCommands(): boolean {
        return Object.keys(this.repoCommands).length > 0;
    }
}
