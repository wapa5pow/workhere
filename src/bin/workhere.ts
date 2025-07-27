#!/usr/bin/env node

import { Command } from 'commander';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

interface CreateOptions {
  script?: string;
}

// Generate a default branch name with random first and last names
function generateBranchName(): string {
  const firstNames = [
    'alice', 'bob', 'charlie', 'david', 'emma', 'frank', 'grace', 'henry',
    'iris', 'jack', 'kate', 'liam', 'mia', 'noah', 'olivia', 'peter',
    'quinn', 'ruby', 'sam', 'tara', 'uma', 'victor', 'wendy', 'xavier',
    'yuki', 'zoe', 'alex', 'ben', 'claire', 'dan', 'eva', 'finn',
    'gina', 'hugo', 'ivy', 'jake', 'kim', 'leo', 'maya', 'nick',
    'oscar', 'paul', 'quin', 'rose', 'steve', 'tom', 'uri', 'vera',
    'will', 'xena', 'yan', 'zara'
  ];
  
  const lastNames = [
    'smith', 'jones', 'brown', 'davis', 'miller', 'wilson', 'moore', 'taylor',
    'anderson', 'thomas', 'jackson', 'white', 'harris', 'martin', 'garcia', 'martinez',
    'robinson', 'clark', 'rodriguez', 'lewis', 'lee', 'walker', 'hall', 'allen',
    'young', 'king', 'wright', 'lopez', 'hill', 'scott', 'green', 'adams',
    'baker', 'nelson', 'carter', 'mitchell', 'perez', 'roberts', 'turner', 'phillips',
    'campbell', 'parker', 'evans', 'edwards', 'collins', 'stewart', 'sanchez', 'morris',
    'rogers', 'reed', 'cook', 'morgan'
  ];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const shortHash = crypto.randomBytes(2).toString('hex');
  
  return `${firstName}-${lastName}-${shortHash}`;
}

// Check if current directory is a git repository
function checkGitRepository(): void {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
  } catch (error) {
    console.error('Error: Current directory is not a git repository');
    process.exit(1);
  }
}

// Get repository root and check if we're in it
function checkRepositoryRoot(): string {
  const repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  const currentDir = process.cwd();

  if (repoRoot !== currentDir) {
    console.error('Error: workhere must be run from the repository root');
    process.exit(1);
  }

  return currentDir;
}

// Get worktree directory path
function getWorktreeDir(currentDir: string): string {
  return path.join(currentDir, '.git', 'worktree');
}

// List all worktrees
function listWorktrees(): { path: string; branch: string }[] {
  try {
    const output = execSync('git worktree list --porcelain', { encoding: 'utf-8' });
    const lines = output.trim().split('\n');
    const worktrees: { path: string; branch: string }[] = [];
    
    let i = 0;
    while (i < lines.length) {
      if (lines[i].startsWith('worktree ')) {
        const worktreePath = lines[i].substring(9);
        let branch = '';
        
        // Look for the branch line in the next few lines
        for (let j = i + 1; j < lines.length && j < i + 5; j++) {
          if (lines[j].startsWith('branch ')) {
            branch = lines[j].substring(7).replace('refs/heads/', '');
            break;
          }
        }
        
        if (branch) {
          worktrees.push({ path: worktreePath, branch });
        }
        
        // Skip to next worktree entry
        while (i < lines.length && lines[i] !== '') {
          i++;
        }
      }
      i++;
    }
    
    return worktrees;
  } catch (error) {
    return [];
  }
}

const program = new Command();

program
  .version('1.0.0')
  .description('Manage git worktrees');

// Add command
program
  .command('add [branch]')
  .description('Create a new git worktree')
  .option('-s, --script <name>', 'Script to execute after creating worktree')
  .action((branch: string | undefined, options: CreateOptions) => {
    try {
      checkGitRepository();
      const currentDir = checkRepositoryRoot();
      
      // Generate branch name if not provided
      const branchName = branch || generateBranchName();
      
      // Create .git/worktree directory if it doesn't exist
      const worktreeDir = getWorktreeDir(currentDir);
      if (!fs.existsSync(worktreeDir)) {
        fs.mkdirSync(worktreeDir, { recursive: true });
      }

      // Create worktree path
      const worktreePath = path.join(worktreeDir, branchName);

      // Check if worktree already exists
      const existingWorktrees = listWorktrees();
      if (existingWorktrees.some(wt => wt.path === worktreePath)) {
        console.error(`Error: Worktree '${branchName}' already exists at ${worktreePath}`);
        process.exit(1);
      }

      // Create the worktree
      console.log(`Creating worktree '${branchName}' at ${worktreePath}...`);
      try {
        execSync(`git worktree add "${worktreePath}" -b "${branchName}"`, { stdio: 'inherit' });
      } catch (error) {
        console.error('Error creating worktree:', (error as Error).message);
        process.exit(1);
      }

      console.log(`Worktree '${branchName}' created successfully at ${worktreePath}`);

      // Execute script if specified
      if (options.script) {
        console.log(`Executing script: ${options.script}`);
        try {
          execSync(options.script, { 
            cwd: worktreePath,
            stdio: 'inherit'
          });
        } catch (error) {
          console.error(`Error executing script: ${(error as Error).message}`);
          process.exit(1);
        }
      }

      // Print next steps
      console.log('\nNext steps:');
      console.log(`cd ${worktreePath}`);
      
    } catch (error) {
      console.error('Unexpected error:', (error as Error).message);
      process.exit(1);
    }
  });

// Reset command - remove all worktrees
program
  .command('reset')
  .description('Remove all git worktrees')
  .option('-f, --force', 'Force removal even if worktree is dirty')
  .action((options: { force?: boolean }) => {
    try {
      checkGitRepository();
      const currentDir = checkRepositoryRoot();
      const worktreeDir = getWorktreeDir(currentDir);
      
      const worktrees = listWorktrees();
      const worktreesInProject = worktrees.filter(wt => 
        wt.path.startsWith(worktreeDir) && wt.path !== currentDir
      );

      if (worktreesInProject.length === 0) {
        console.log('No worktrees found to remove.');
        return;
      }

      console.log(`Found ${worktreesInProject.length} worktree(s) to remove:`);
      worktreesInProject.forEach(wt => {
        console.log(`  - ${wt.branch} at ${wt.path}`);
      });

      // Remove each worktree
      for (const wt of worktreesInProject) {
        try {
          console.log(`\nRemoving worktree '${wt.branch}'...`);
          const forceFlag = options.force ? ' --force' : '';
          execSync(`git worktree remove "${wt.path}"${forceFlag}`, { stdio: 'inherit' });
          
          // Also delete the branch if it exists
          try {
            execSync(`git branch -d "${wt.branch}"`, { stdio: 'pipe' });
            console.log(`Deleted branch '${wt.branch}'`);
          } catch (error) {
            // If branch deletion fails, try force delete if --force is specified
            if (options.force) {
              try {
                execSync(`git branch -D "${wt.branch}"`, { stdio: 'pipe' });
                console.log(`Force deleted branch '${wt.branch}'`);
              } catch (e) {
                console.log(`Could not delete branch '${wt.branch}': ${(e as Error).message}`);
              }
            } else {
              console.log(`Could not delete branch '${wt.branch}' (use --force to force delete)`);
            }
          }
        } catch (error) {
          console.error(`Error removing worktree '${wt.branch}':`, (error as Error).message);
          if (!options.force) {
            console.log('Use --force to force removal');
          }
        }
      }

      console.log('\nAll worktrees removed successfully.');
      
    } catch (error) {
      console.error('Unexpected error:', (error as Error).message);
      process.exit(1);
    }
  });

// Remove command - remove specific worktree
program
  .command('remove <branch>')
  .alias('rm')
  .description('Remove a specific git worktree')
  .option('-f, --force', 'Force removal even if worktree is dirty')
  .action((branch: string, options: { force?: boolean }) => {
    try {
      checkGitRepository();
      const currentDir = checkRepositoryRoot();
      const worktreeDir = getWorktreeDir(currentDir);
      
      const worktrees = listWorktrees();
      const targetWorktree = worktrees.find(wt => 
        wt.branch === branch && wt.path.startsWith(worktreeDir)
      );

      if (!targetWorktree) {
        console.error(`Error: Worktree '${branch}' not found`);
        process.exit(1);
      }

      console.log(`Removing worktree '${branch}' at ${targetWorktree.path}...`);
      
      try {
        const forceFlag = options.force ? ' --force' : '';
        execSync(`git worktree remove "${targetWorktree.path}"${forceFlag}`, { stdio: 'inherit' });
        console.log(`Worktree '${branch}' removed successfully.`);
        
        // Also delete the branch if it exists
        try {
          execSync(`git branch -d "${branch}"`, { stdio: 'pipe' });
          console.log(`Deleted branch '${branch}'`);
        } catch (error) {
          // If branch deletion fails, try force delete if --force is specified
          if (options.force) {
            try {
              execSync(`git branch -D "${branch}"`, { stdio: 'pipe' });
              console.log(`Force deleted branch '${branch}'`);
            } catch (e) {
              console.log(`Could not delete branch '${branch}': ${(e as Error).message}`);
            }
          } else {
            console.log(`Could not delete branch '${branch}' (use --force to force delete)`);
          }
        }
      } catch (error) {
        console.error(`Error removing worktree:`, (error as Error).message);
        if (!options.force) {
          console.log('Use --force to force removal');
        }
        process.exit(1);
      }
      
    } catch (error) {
      console.error('Unexpected error:', (error as Error).message);
      process.exit(1);
    }
  });

// List command (bonus)
program
  .command('list')
  .alias('ls')
  .description('List all git worktrees')
  .action(() => {
    try {
      checkGitRepository();
      const currentDir = checkRepositoryRoot();
      const worktreeDir = getWorktreeDir(currentDir);
      
      const worktrees = listWorktrees();
      const worktreesInProject = worktrees.filter(wt => 
        wt.path.startsWith(worktreeDir) && wt.path !== currentDir
      );

      if (worktreesInProject.length === 0) {
        console.log('No worktrees found.');
        return;
      }

      console.log('Current worktrees:');
      worktreesInProject.forEach(wt => {
        console.log(`  ${wt.branch} -> ${wt.path}`);
      });
      
    } catch (error) {
      console.error('Unexpected error:', (error as Error).message);
      process.exit(1);
    }
  });

program.parse();