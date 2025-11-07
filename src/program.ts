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

type Route<Dependencies extends Record<string, Dependency<any>>, Key extends string> = {
    pattern: string;
    handler: (ctx: Context<Dependencies, Key>) => void | any;
};

type DependencyRecord<Arr extends readonly Dependency<any>[]> = {
    [D in Arr[number] as D["name"]]: D;
};

type ProgramState<Dependencies extends Record<string, Dependency<any>>> = {
    args: CLIArg[];
    routes: Route<Dependencies, string>[];
    deps: Dependencies;
};

type Context<Dependencies extends Record<string, Dependency<any>>, Key extends string> = {
    args: CLIArg[];
    deps: Dependencies;
    routes: Route<Dependencies, string>[];
    kv: Record<string, any>;
    params: Record<Key, any>;
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
        return this.state.args.some((arg) => arg.name === pattern);
    }

    /**
     *
     * Create a new Program instance with optional routes
     *
     */
    public static create<const InitializedDeps extends readonly Dependency<any>[]>(
        deps: InitializedDeps,
        routes: Route<DependencyRecord<InitializedDeps>, string>[] = []
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
                Deps & DependencyRecord<NewDeps>,
                string
            >[],
            deps: { ...this.state.deps, ...instance.state.deps } as Deps & DependencyRecord<NewDeps>,
        });
    }

    /**
     *
     * Add a route to the program
     *
     */
    public when<T extends string>(pattern: T, handler: (ctx: Context<Deps, T>) => void | any): this {
        this.state.routes.push({ pattern, handler });
        return this;
    }

    /**
     *
     * Run the program
     *
     */
    public run(): void {
        let kv = {};
        for (const route of this.state.routes) {
            if (this.isMatch(route.pattern)) {
                const params = this.state.args.reduce((acc, arg) => {
                    if (arg.type === "param" && arg.value) {
                        acc[arg.name] = arg.value;
                    }
                    return acc;
                }, {} as Record<string, any>);

                const ctx: Context<Deps, typeof route.pattern> = {
                    args: this.state.args,
                    deps: this.state.deps,
                    routes: this.state.routes,
                    kv: kv,
                    params: params as unknown as Record<typeof route.pattern, any>,
                };
                const result: ReturnType<typeof route.handler> = route.handler(ctx);
                if (result) kv = { ...kv, [route.pattern]: result };
            }
        }
    }
}

export default Program;
