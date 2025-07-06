# workhere

A simple git worktree management tool that creates worktrees in the `.git/worktrees` directory of your current Git repository.

## Installation

```bash
npm install -g workhere
```

Or run directly with npx:

```bash
npx workhere
```

## Usage

### Basic Usage

Run in the current directory (must be the Git repository root):

```bash
workhere [branch-name]
```

If no branch name is specified, it will automatically create one with a random name like `alice-smith-a1b2` or `bob-jones-c3d4`.

### Running Scripts

To execute a script after creating the worktree:

```bash
workhere -s "npm install && npm run dev" feature-branch
```

This will:
1. Create a worktree named `feature-branch`
2. Change to the created worktree directory
3. Execute the specified script (in this example: `npm install && npm run dev`)

## Features

- Creates worktrees in the `.git/worktrees` directory of the current repository
- Supports post-creation script execution (`-s` option)
- Checks for existing worktree conflicts
- Verifies if the current directory is a Git repository
- Enforces execution from the repository root

## Examples

### Create a new feature branch

```bash
workhere feature/new-feature
```

### Install dependencies after creating worktree

```bash
workhere -s "pnpm install" bugfix/issue-123
```

### Start development server

```bash
workhere -s "npm install && npm run dev" develop
```

## Requirements

- Node.js >= 14.0.0
- Git

## License

MIT

## Contributing

Please report bugs and feature requests to [GitHub Issues](https://github.com/wapa5pow/workhere/issues).