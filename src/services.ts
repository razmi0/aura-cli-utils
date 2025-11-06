import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { type Service } from ".";

export default class Basics implements Service {
    public readonly name: "$" = "$";
    public readonly version: () => string = () =>
        JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf-8")).version;

    public readonly help: () => string = () => `The pre je sais plus c'est juste les noms ;`;
    public readonly log: (message: string, origin?: string) => void = (message: string, origin?: string) => {
        console.log(`\x1b[92m[${origin ? origin : "AURA"}]\x1b[0m ${message}`);
    };
}
