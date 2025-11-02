# MFS Scripts - Repository Management CLI

A command-line tool for managing and cloning multiple 1t21-aura GitHub repositories efficiently.

## Overview

This CLI application provides a streamlined way to manage multiple repositories from the `1t21-aura-*` GitHub organization. It supports filtering, targeting, and batch operations on repositories that follow the naming convention `<type>-<name>`.

## Installation

### Prerequisites

- Node.js 20 or higher
- npm or yarn

### Setup

1. Install dependencies:

```bash
npm install
```

2. Build the application:

```bash
npm run prod:build
```

This will compile the TypeScript source and create the bundled executable at `./bin/utils.js`.

## Usage

### Basic Syntax

```bash
node ./bin/utils.js [options] [repo-commands]
```

### Options

#### `--outPath <directory>`

Specifies the directory where repositories will be cloned. If not provided, repositories are cloned to the current working directory.

```bash
node ./bin/utils.js --outPath ../aura
```

### Repository Commands

#### `--repo-include <repo1> <repo2> ...`

Includes only the specified repositories. All other repositories will be ignored.

Repositories are identified by their `asArg` value, which is derived from the repository name after the type prefix. For example:

- `module-esd` → `esd`
- `module-orchestrator` → `orchestrator`
- `library-permission-manager` → `permission-manager`

```bash
node ./bin/utils.js --repo-include esd orchestrator
```

#### `--repo-exclude <repo1> <repo2> ...`

Excludes the specified repositories. All other repositories will be processed.

```bash
node ./bin/utils.js --repo-exclude default-content sidebar
```

### Examples

**Clone all repositories to a specific directory:**

```bash
node ./bin/utils.js --outPath ../aura
```

**Clone only specific repositories:**

```bash
node ./bin/utils.js --outPath ../aura --repo-include esd orchestrator topbar
```

**Clone all repositories except certain ones:**

```bash
node ./bin/utils.js --outPath ../aura --repo-exclude default-content sidebar
```

**Clone to current directory with filtering:**

```bash
node ./bin/utils.js --repo-include esd orchestrator
```

## Repository Configuration

To modify the repository list, edit `REPOS.ts`.

### Repository Types

Repositories follow a naming convention: `<type>-<name>`

Supported types:

- `module` - Application modules
- `library` - Shared libraries
- `template` - Project templates
- `orchestrator` - Special module type (identified as `module-orchestrator`)

### Repository Naming

The CLI automatically:

- Constructs GitHub URLs using the pattern: `https://github.com/1t21-aura-<package-name>.git`
- Extracts the type from the repository name
- Generates an `asArg` identifier for command-line usage (the part after the type)

## Development

### Development Scripts

**Watch mode** (auto-rebuild on changes):

```bash
npm run dev:watch
```

**Build for production** (minified):

```bash
npm run prod:build
```

**Development start** (with auto-reload):

```bash
npm run dev:start
```

### Project Structure

```
scripts/
├── bin/
│   └── utils.js          # Compiled executable
├── src/
│   ├── main.ts           # Main entry point and repository operations
│   ├── Program.ts        # CLI program class and argument parsing
│   └── Repo.ts           # Repository management and configuration
├── package.json
├── tsconfig.json
└── README.md
```

### Architecture

- **RepoManager**: Handles repository configuration, creation, and targeting based on CLI arguments
- **Program**: Provides a fluent API for defining CLI behavior, including options, filters, and operations
- **main.ts**: Entry point that configures the program with repository definitions and operations

## How It Works

1. **Argument Parsing**: The program parses command-line arguments to identify options and repository commands
2. **Repository Targeting**: `--repo-include` and `--repo-exclude` commands filter the repository list
3. **Option Processing**: Options like `--outPath` are processed and applied
4. **Operation Execution**: The `.operate()` method executes the specified operation on each selected repository
