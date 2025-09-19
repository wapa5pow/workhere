import { execSync } from 'child_process';
import * as path from 'path';
import * as crypto from 'crypto';

export interface CreateOptions {
  script?: string;
  prefix?: boolean;
  dir?: string;
}

export function generateBranchName(): string {
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

export function checkGitRepository(): void {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
  } catch (error) {
    console.error('Error: Current directory is not a git repository');
    process.exit(1);
  }
}

export function checkRepositoryRoot(): string {
  const repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  const currentDir = process.cwd();

  if (repoRoot !== currentDir) {
    console.error('Error: workhere must be run from the repository root');
    process.exit(1);
  }

  return currentDir;
}

export function getWorktreeDir(currentDir: string, customDir?: string): string {
  if (customDir) {
    // If customDir is absolute, use it directly. Otherwise, make it relative to currentDir
    return path.isAbsolute(customDir) ? customDir : path.join(currentDir, customDir);
  }
  return path.join(currentDir, '.git', 'worktree');
}

export function listWorktrees(): { path: string; branch: string }[] {
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