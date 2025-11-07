# aura-cli

CLI for managing Aura repositories.

## Architecture

It is more a system of plugins where Domain can directly be used and Adapters are injected inside so no dependency inversion. The thing is that the Domain works without any Adapter/Plugins.
There's a lot of Composition/Overloading (.when and .run methods ) too (over Inheritence). Domain can be merged with other Domain.
There's also factory (createAuraProgram) and builder (chaining methods) patterns.
Domain is the core of the system and it is the only one that knows about the CLI arguments and commands.
Ports are the interfaces that are implemented by the Adapters/Plugins.
Adapters/Plugins are the implementations of the Ports.

Only one Port :

```ts
export abstract class ProgramPort<Name extends string> {
    public abstract readonly name: Name;
}
```

That's it.

| Domain | Port | Adapter/Plugin |
|------|------|---------|
| [Program](./src/program.ts) | [ProgramPort](./src/program.port.ts) | [createAuraProgram](./src/index.ts) |

## Installation

```bash
git clone https://github.com/razmi0/aura-cli-utils.git
cd aura-cli-utils
npm install
npm run build
npm link  # Link the package to the global npm registry
# OR
npm install -g aura-cli-utils
```

## Usage

```bash
aura-cli --help
```

### Examples

```bash
aura-cli repos:"[1t21-aura-module-esd,1t21-aura-orchestrator]"
aura-cli repos:"[1t21-aura-module-esd]" --clone
aura-cli --patch-auth
```

## Development

To import the cleaniest Domain you ever seen ( without any commands registered) :

```ts
import program from 'aura-cli';

program.when('--custom', ({ args, deps, routes }) => {
  // Custom handler
});

program.run();
```

ELSE extend the basic program :

```ts
import { createAuraProgram } from 'aura-cli';

const program = createAuraProgram()
  .when('--custom', ({ args, deps, routes, kv, params }) => {
    // Custom handler
  });

program.run();
```

```bash
npm run dev    # Watch mode
```

## External dependencies

Only dev dependencies :

```json
"devDependencies": {
        "@types/node": "^20.10.6",
        "esbuild": "^0.19.11",
        "peggy": "^5.0.6",
        "typescript": "^5.3.3"
    }
```
