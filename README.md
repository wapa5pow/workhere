# workhere

A simple git worktree management tool that creates worktrees in the `.git/worktree` directory of your current Git repository.

## Installation

```bash
npm install -g workhere
```

Or run directly with npx:

```bash
npx workhere@latest
```

## Usage

### Commands

#### Create a worktree

```bash
workhere create [branch-name]
```

If no branch name is specified, it will automatically create one with a random name like `alice-smith-a1b2` or `bob-jones-c3d4`.

#### List worktrees

```bash
workhere list
```

Shows all worktrees managed by workhere in the current repository.

#### Delete a specific worktree

```bash
workhere delete <branch-name>
```

Removes the specified worktree and its associated branch.

#### Reset (delete all worktrees)

```bash
workhere reset
```

Removes all worktrees in the `.git/worktree` directory.

### Options

#### Running Scripts (create command)

To execute a script after creating the worktree:

```bash
workhere create -s "npm install && npm run dev" feature-branch
```

This will:
1. Create a worktree named `feature-branch`  
2. Change to the created worktree directory
3. Execute the specified script (in this example: `npm install && npm run dev`)

#### Force Deletion

To force delete worktrees even if they have uncommitted changes:

```bash
workhere delete -f <branch-name>
workhere reset -f
```

## Features

- Creates worktrees in the `.git/worktree` directory of the current repository
- Supports post-creation script execution (`-s` option)
- Checks for existing worktree conflicts
- Verifies if the current directory is a Git repository
- Enforces execution from the repository root

## Examples

### Create a new feature branch

```bash
workhere create feature/new-feature
```

### Install dependencies after creating worktree

```bash
workhere create -s "pnpm install" bugfix/issue-123
```

### Start development server

```bash
workhere create -s "npm install && npm run dev" develop
```

### List all worktrees

```bash
workhere list
```

### Delete a specific worktree

```bash
workhere delete feature/old-feature
```

### Remove all worktrees at once

```bash
workhere reset
```

### Force delete worktrees with uncommitted changes

```bash
workhere reset --force
```

## Requirements

- Node.js >= 14.0.0
- Git

## License

MIT

## Contributing

Please report bugs and feature requests to [GitHub Issues](https://github.com/wapa5pow/workhere/issues).
