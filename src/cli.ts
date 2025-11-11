import { createAuraProgram } from "./index";

const program = createAuraProgram();

program.run().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
