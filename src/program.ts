import { parse } from "./parser";

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

type Route<Deps> = {
    pattern: string;
    handler: (ctx: { args: CLIArg[]; deps: Deps; routes: Route<Deps>[] }) => void;
};

type DependencyRecord<Arr extends readonly Dependency<any>[]> = {
    [D in Arr[number] as D["name"]]: D;
};

type ProgramState<Deps extends Record<string, Dependency<any>>> = {
    args: CLIArg[];
    routes: Route<Deps>[];
    deps: Deps;
};

class Program<Deps extends Record<string, Dependency<any>>> {
    /**
     *
     * Constructor is set to private => static factory method Program.create() (sorry....)
     * This maintain type inference for dependencies and routes (no explicit return type in constructor)
     *
     */
    private constructor(public state: ProgramState<Deps>) {}

    private isMatch(pattern: string): boolean {
        const normalized = pattern.replace(/^--+/, "");
        return this.state.args.some((arg) => arg.name === normalized);
    }

    /**
     *
     * Create a new Program instance with optional routes
     *
     */
    public static create<const InitializedDeps extends readonly Dependency<any>[]>(
        deps: InitializedDeps,
        routes: Route<DependencyRecord<InitializedDeps>>[] = []
    ) {
        const rawArgs = process.argv.slice(2).join(" ");

        if (!rawArgs) {
            console.error("No arguments provided <3");
            process.exit(1);
        }

        type CreatedDeps = DependencyRecord<InitializedDeps>;
        const depsRecord = deps.reduce((acc, dep) => {
            acc[dep.name as keyof CreatedDeps] = dep as CreatedDeps[keyof CreatedDeps];
            return acc;
        }, {} as CreatedDeps);

        return new Program<CreatedDeps>({
            args: parse(rawArgs, {}) as CLIArg[],
            routes: routes,
            deps: depsRecord,
        });
    }

    /**
     *
     * Merge Two Programs (merge the two states and return a new updated Program instance)
     *
     */

    public merge<const NewDeps extends readonly Dependency<any>[]>(
        instance: Program<DependencyRecord<NewDeps>>
    ): Program<Deps & DependencyRecord<NewDeps>> {
        return new Program<Deps & DependencyRecord<NewDeps>>({
            args: this.state.args,
            routes: [...this.state.routes, ...instance.state.routes] as unknown as Route<
                Deps & DependencyRecord<NewDeps>
            >[],
            deps: { ...this.state.deps, ...instance.state.deps } as Deps & DependencyRecord<NewDeps>,
        });
    }

    /**
     *
     * Add a route to the program
     *
     */
    public when(pattern: string, handler: (ctx: { args: CLIArg[]; deps: Deps; routes: Route<Deps>[] }) => void): this {
        this.state.routes.push({ pattern, handler });
        return this;
    }

    /**
     *
     * Run the program
     *
     */
    public run(): void {
        for (const route of this.state.routes) {
            if (this.isMatch(route.pattern)) {
                const ctx = {
                    args: this.state.args,
                    deps: this.state.deps,
                    routes: this.state.routes,
                };
                route.handler(ctx);
            }
        }
    }
}

export default Program;
