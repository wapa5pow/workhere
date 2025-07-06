#!/usr/bin/env node

import { Command } from 'commander';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

interface Options {
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

const program = new Command();

program
  .version('1.0.0')
  .description('Create git worktrees in the current directory')
  .option('-s, --script <name>', 'Script to execute after creating worktree')
  .argument('[branch]', 'Branch name for the worktree', generateBranchName())
  .action((branch: string, options: Options) => {
    try {
      // Check if current directory is a git repository
      try {
        execSync('git rev-parse --git-dir', { stdio: 'pipe' });
      } catch (error) {
        console.error('Error: Current directory is not a git repository');
        process.exit(1);
      }

      // Get the repository root
      const repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
      const currentDir = process.cwd();

      // Check if we're in the repo root
      if (repoRoot !== currentDir) {
        console.error('Error: workhere must be run from the repository root');
        process.exit(1);
      }

      // Create .git/worktrees directory if it doesn't exist
      const worktreesDir = path.join(currentDir, '.git', 'worktrees');
      if (!fs.existsSync(worktreesDir)) {
        fs.mkdirSync(worktreesDir, { recursive: true });
      }

      // Create worktree path
      const worktreePath = path.join(currentDir, '.git', 'worktrees', branch);

      // Check if worktree already exists
      try {
        const existingWorktrees = execSync('git worktree list --porcelain', { encoding: 'utf-8' });
        if (existingWorktrees.includes(worktreePath)) {
          console.error(`Error: Worktree '${branch}' already exists at ${worktreePath}`);
          process.exit(1);
        }
      } catch (error) {
        // Ignore errors from git worktree list
      }

      // Create the worktree
      console.log(`Creating worktree '${branch}' at ${worktreePath}...`);
      try {
        execSync(`git worktree add "${worktreePath}" -b "${branch}"`, { stdio: 'inherit' });
      } catch (error) {
        console.error('Error creating worktree:', (error as Error).message);
        process.exit(1);
      }

      console.log(`Worktree '${branch}' created successfully at ${worktreePath}`);

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

program.parse();