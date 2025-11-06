import { parse } from "./parser";
import Basics from "./services";

/**
 * The only interface you will need to implement :
 */

export abstract class Service {
    public abstract name: string;
}

type ClassMethods<T> = {
    [K in keyof T as T[K] extends Function ? K : never]: T[K];
};

type Dependency<T extends object> = {
    name: string;
} & ClassMethods<T>;

type CLIArg = {
    type: "flag" | "param";
    name: string;
    value: string | string[] | null;
};

type Context<Deps> = {
    args: CLIArg[];
    deps: Deps;
};

type Route<Deps> = {
    pattern: string;
    callback: (args: CLIArg[], deps: Deps) => void;
};

type DependencyRecord<Arr extends readonly Dependency<any>[]> = {
    [D in Arr[number] as D["name"]]: D;
};

type ProgramState<Deps> = {
    args: CLIArg[];
    routes: Route<Deps>[];
    deps: Deps;
};

class Program<Deps extends Record<string, Dependency<any>>> {
    private readonly routes: Route<Deps>[] = [];
    private readonly ctx: Context<Deps>;

    public state: ProgramState<Deps> = {
        args: [] as CLIArg[],
        routes: [] as Route<Deps>[],
        deps: {} as Deps,
    };

    private constructor(
        dependencies: readonly Dependency<any>[],
        existingState?: { args: CLIArg[]; routes: Route<any>[] },
        newState?: ProgramState<Deps>
    ) {
        if (existingState) {
            // Used when extending a Program instance with new dependencies via .with()
            const mergedDeps = dependencies.reduce((acc, dep) => {
                acc[dep.name] = dep;
                return acc;
            }, {} as Record<string, Dependency<any>>);

            this.ctx = {
                args: existingState.args, // Reuse existing parsed args
                deps: mergedDeps as Deps,
            };

            for (const route of existingState.routes) {
                this.routes.push({
                    pattern: route.pattern,
                    callback: route.callback as (args: CLIArg[], deps: Deps) => void,
                });
            }
        } else {
            const rawArgs = process.argv.slice(2).join(" ");
            if (!rawArgs) {
                console.error("No arguments provided");
                process.exit(1);
            }
            const deps = dependencies.reduce((acc, dep) => {
                acc[dep.name] = dep;
                return acc;
            }, {} as Record<string, Dependency<any>>);
            this.ctx = {
                args: parse(rawArgs, {}) as CLIArg[],
                deps: deps as Deps,
            };
        }
    }

    private initializeFromScratch() {}

    private mergeDeps() {}

    public static create<const D extends readonly Dependency<any>[]>(...deps: D) {
        return new Program<DependencyRecord<D>>(deps);
    }

    public add<const NewDeps extends readonly Dependency<any>[]>(
        ...newDeps: NewDeps
    ): Program<Deps & DependencyRecord<NewDeps>> {
        const allDeps = [...Object.values(this.ctx.deps), ...newDeps] as readonly Dependency<any>[];

        return new Program<Deps & DependencyRecord<NewDeps>>(allDeps, {
            args: this.ctx.args,
            routes: this.routes,
        });
    }

    public when(pattern: string, handler: (args: CLIArg[], deps: Deps) => void): this {
        this.routes.push({ pattern, callback: handler });
        return this;
    }

    public run(): void {
        for (const route of this.routes) {
            if (this.matches(route.pattern)) {
                route.callback(this.ctx.args, this.ctx.deps);
            }
        }
    }

    private matches(pattern: string): boolean {
        const normalized = pattern.replace(/^--+/, "");
        return this.ctx.args.some((arg) => arg.name === normalized);
    }
}

export default Program.create(new Basics())
    .when("version", (_, { $ }) => {
        $.log($.version());
        process.exit(0);
    })
    .when("help", (_, { $ }) => {
        $.log($.help());
        process.exit(0);
    });
