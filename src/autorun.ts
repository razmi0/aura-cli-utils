import Program from "./program";
import Basics from "./services";

/**
 *
 * Default program with some utility in from the Basics service (log,version and help)
 *
 */

const program = Program.create([new Basics()])
    .when("version", ({ deps }) => {
        deps.$.log(deps.$.version());
        process.exit(0);
    })
    .when("help", ({ deps }) => {
        deps.$.log(deps.$.help());
        process.exit(0);
    });

program.run();
