/**
 * The only interface ( abstract class ) you will need to implement.
 * It is verbose but it is necessary to get the auto-complete magic to work <3.
 *
 * @example
 * ```ts
 * class MyService implements ProgramPort<"myService"> {
 *     constructor(public readonly name: "myService" = "myService" as const) {}
 * }
 * ```
 *
 * You can inject it like this :
 * ```ts
 * // create the program with the new service
 * const myProgram = Program.create([new MyService()])
 *     // add a route to the program
 *   .when('--my-command', (context) => {
 *     // context.deps exposes your dependencies ( services, etc )
 *     const { myService } = context.deps;
 *     // myService.doSomething()
 *   })
 *
 * // create the default program ( not necessary but recommended )
 * const main = createAuraProgram()
 *
 * // merge the two programs and run the program
 * main.merge(myProgram).run();
 *
 * ```
 *
 * The default program is created with the following dependencies:
 * - BasicsService
 * - GitRepositoryService
 *
 * Those services are accessible through the "$" namespace :
 * ```ts
 * const main = createAuraProgram()
 *
 * main.when('--my-command', ({ deps }) => {
 *     const { $ } = deps;
 *     $.log('Currently at version ${$.version()}');
 * });
 *
 * main.run();
 * ```
 */

export abstract class ProgramPort<Name extends string> {
    public abstract readonly name: Name;
}
