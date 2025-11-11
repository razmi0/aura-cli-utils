# Aura CLI

> A command-line interface for managing Aura micro-frontend repositories and orchestrator configurations.

## Overview

Aura CLI is a developer tool designed to streamline the management of micro-frontend (MFE) modules in the Aura orchestrator ecosystem. It provides utilities for repository management, local development configuration, and authentication patching.

## Features

- **Repository Management**: Clone and pull multiple git repositories with a single command
- **Local MFE Connection**: Configure micro-frontends to run locally with custom ports
- **Authentication Patching**: Temporarily bypass authentication for development purposes
- **Extensible Architecture**: Plugin-based service system for easy customization
- **Custom DSL**: Intuitive command syntax with parameter support

## Installation

### From Source

```bash
# Clone the repository
git clone <repository-url>
cd scripts

# Install dependencies
npm install

# Build the CLI
npm run build

# Link globally (optional)
npm link
```

## Usage

### Basic Syntax

```bash
aura-cli <command> [params]
```

The CLI uses a custom DSL parsed with PEG.js that supports:

- **Flags**: Commands starting with `--` (e.g., `--help`, `--version`)
- **Parameters**: Named parameters with values (e.g., `repos:[repo1,repo2]`)
- **Arrays**: Multi-value parameters using bracket notation `[item1,item2]`
- **Tuples**: Nested arrays for complex parameters `[[port,name]]`

### Available Commands

#### Help & Information

```bash
# Show version
aura-cli --version

# Show all available commands
aura-cli --help

# List all configured repositories
aura-cli --repo-list
```

#### Working Directory

```bash
# Change working directory
aura-cli cwd:/path/to/directory
```

#### Repository Management

```bash
# Clone specific repositories
aura-cli repos:[1t21-aura-module-esd,1t21-aura-orchestrator] --clone

# Pull updates for specific repositories
aura-cli repos:[1t21-aura-module-esd] --pull

# Pull all configured repositories
aura-cli --pull
```

#### Local MFE Development

```bash
# Connect a local MFE module on a specific port
# Format: local-mfe:[[port,module-name]]
aura-cli local-mfe:[[9018,esd]]

# Connect multiple modules
aura-cli local-mfe:[[9018,esd],[9019,flight-plan]]
```

This command:

- Updates the import map to point to `http://localhost:<port>`
- Modifies the module's `package.json` to use the specified port
- Validates module existence and configuration

#### Authentication Patching (Development)

```bash
# Patch orchestrator to bypass authentication
aura-cli --patch-auth

# Restore original authentication
aura-cli --unpatch-auth
```

⚠️ **Warning**: These commands modify the orchestrator's `root-config.js`. Only use in development environments.

### Chaining Commands

Commands can be chained together:

```bash
# Clone repos and connect a local MFE
aura-cli repos:[1t21-aura-orchestrator,1t21-aura-module-esd] --clone local-mfe:[[9018,esd]] --patch-auth
```

## Architecture

### Services

The CLI is built on a service-based architecture:

#### BasicsService

- Version management
- Help documentation
- Working directory control

#### GitRepositoryService

- Repository discovery and URL management
- Git clone operations
- Git pull operations
- Batch operations with error handling

#### OrchestratorService

- Import map manipulation
- Package.json port configuration
- Authentication patching

### Program System

The `Program` class provides:

- Command routing with pattern matching
- Dependency injection for services
- Key-value store for state sharing
- Route composition and extensibility

### Parser

Uses PEG.js grammar (`rules.peggy`) to parse command syntax into structured AST:

- Flags: `--command`
- Parameters: `name:value`
- Arrays: `name:[val1,val2]`
- Nested structures: `name:[[a,b],[c,d]]`

## Development

### Scripts

```bash
# Development mode with watch
npm run dev

# Build all (parser, library, CLI)
npm run build

# Build individual components
npm run build:peg      # Build PEG parser
npm run build:lib      # Build library
npm run build:cli      # Build CLI executable
```

### Project Structure

```
src/
├── cli.ts                 # CLI entry point
├── index.ts              # Main program factory
├── program.ts            # Program orchestration
├── program.port.ts       # Service interface
├── constants.ts          # Configuration constants
├── parser/
│   ├── rules.peggy      # PEG grammar definition
│   └── index.ts         # Generated parser
└── services/
    ├── index.ts         # Service exports
    ├── Basic.ts         # Core utilities
    ├── GitRepository.ts # Git operations
    └── Orchestrator.ts  # MFE configuration
```

### Extending the CLI

```typescript
import { createAuraProgram } from './index';

const program = createAuraProgram()
  .when('--custom', ({ deps, params }) => {
    const { $, repoService } = deps;
    // Your custom logic here
  }, 'Description of your command');

program.run();
```

### Creating a Custom Service

```typescript
import type { ProgramPort } from './program.port';

export default class MyService implements ProgramPort<"myService"> {
  public readonly name: "myService" = "myService" as const;
  
  // Your service methods
  public async doSomething(): Promise<void> {
    // Implementation
  }
}
```

## Configuration

### Repository Management

Repositories are discovered from a metadata configuration file (`meta.json`). The file should contain repository definitions with URLs and paths.

### Orchestrator Paths

Default paths (configured in `OrchestratorService`):

- Import map: `./1t21-aura-orchestrator/products/a320/importmaps/importmap.local.json`
- Root config: `./1t21-aura-orchestrator/src/root-config.js`
- Module pattern: `./1t21-aura-module-{name}/package.json`

## Technical Details

### Built With

- **TypeScript**: Type-safe development
- **PEG.js**: Parser generator for custom DSL
- **esbuild**: Fast bundling and compilation
- **Node.js**: Runtime environment (v20+)

### Requirements

- Node.js >= 20
- npm or pnpm

## Best Practices

1. **Always pull before starting work**: `aura-cli --pull`
2. **Use specific port ranges**: Avoid conflicts with system ports (< 1024)
3. **Unpatch auth when done**: Don't leave auth bypassed
4. **Chain operations**: More efficient than multiple calls
5. **Check repo list**: Verify available repos with `--repo-list`

## Troubleshooting

### Command Not Found

```bash
npm link  # Link the CLI globally
```

### Invalid JSON Errors

The orchestrator now uses proper JSON parsing. If you see JSON errors:

- Verify the import map is valid JSON
- Check package.json syntax
- Ensure no manual edits broke the structure

### Module Not Found

- Verify the module name matches the import map key
- Check that the module directory exists
- Ensure meta.json contains the module definition

### Port Conflicts

- Use `lsof -i :PORT` to check if port is in use
- Choose a different port in the range 1024-65535

## Contributing

1. Follow TypeScript best practices
2. Add JSDoc comments for public APIs
3. Update this README for new features
4. Test commands before committing

## License

Internal use only.

## Author

razmiO
