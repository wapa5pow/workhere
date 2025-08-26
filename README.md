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
workhere add [branch-name]  # Alias for create
```

If no branch name is specified, it will automatically create one with a random name like `alice-smith-a1b2` or `bob-jones-c3d4`.

#### List worktrees

```bash
workhere list
workhere ls  # Short alias for list
```

Shows all worktrees managed by workhere in the current repository.

#### Delete a specific worktree

```bash
workhere delete <branch-name>
workhere remove <branch-name>  # Alias for delete
workhere rm <branch-name>      # Short alias for delete
```

Removes the specified worktree and its associated branch.

#### Reset (delete all worktrees)

```bash
workhere reset
```

Removes all worktrees in the `.git/worktree` directory.

### Options

#### Folder Name Prefix (create/add command)

To automatically add the current folder name as a prefix to the worktree folder name (branch name stays unchanged):

```bash
workhere create -p [branch-name]
workhere add --prefix [branch-name]
```

Examples (if current folder is "workhere"):
- `workhere add -p feature` → folder: `workhere-feature`, branch: `feature`
- `workhere add -p` → folder: `workhere-alice-smith-a1b2`, branch: `alice-smith-a1b2` (auto-generated)
- `workhere add feature` → folder: `feature`, branch: `feature` (no prefix)

#### Running Scripts (create/add command)

To execute a script after creating the worktree:

```bash
workhere create -s "npm install && npm run dev" feature-branch
workhere add --script "pnpm install" feature-branch
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
workhere add feature/new-feature  # Using alias
```

### Create worktree with folder prefix

```bash
workhere add -p feature
# Creates folder: yourproject-feature, branch: feature (if current folder is "yourproject")
```

### Install dependencies after creating worktree

```bash
workhere create -s "pnpm install" bugfix/issue-123
```

### Start development server with folder prefix

```bash
workhere add -p -s "npm install && npm run dev" develop
# Creates folder: yourproject-develop, branch: develop, and runs the script
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
