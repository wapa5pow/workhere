import { execSync } from 'child_process';
import * as path from 'path';
import {
  generateBranchName,
  checkGitRepository,
  checkRepositoryRoot,
  getWorktreeDir,
  listWorktrees
} from '../workhere-core';

// Mock modules
jest.mock('child_process');

const mockedExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('workhere-core', () => {
  let originalExit: typeof process.exit;
  let originalConsoleError: typeof console.error;
  let consoleErrorMock: jest.Mock;
  let processExitMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Save original values
    originalExit = process.exit;
    originalConsoleError = console.error;
    
    // Create mocks
    consoleErrorMock = jest.fn();
    processExitMock = jest.fn();
    
    // Apply mocks
    console.error = consoleErrorMock;
    process.exit = processExitMock as any;
  });

  afterEach(() => {
    // Restore original values
    process.exit = originalExit;
    console.error = originalConsoleError;
  });

  describe('generateBranchName', () => {
    it('should generate a branch name with correct format', () => {
      const branchName = generateBranchName();
      expect(branchName).toMatch(/^[a-z]+-[a-z]+-[a-f0-9]{4}$/);
    });

    it('should generate unique branch names', () => {
      const names = new Set();
      for (let i = 0; i < 10; i++) {
        names.add(generateBranchName());
      }
      expect(names.size).toBe(10);
    });
  });

  describe('checkGitRepository', () => {
    it('should pass when in a git repository', () => {
      mockedExecSync.mockReturnValue(Buffer.from('.git'));
      
      expect(() => checkGitRepository()).not.toThrow();
      expect(mockedExecSync).toHaveBeenCalledWith('git rev-parse --git-dir', { stdio: 'pipe' });
    });

    it('should exit with error when not in a git repository', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });
      
      checkGitRepository();
      
      expect(consoleErrorMock).toHaveBeenCalledWith('Error: Current directory is not a git repository');
      expect(processExitMock).toHaveBeenCalledWith(1);
    });
  });

  describe('checkRepositoryRoot', () => {
    it('should return current directory when at repository root', () => {
      const mockCwd = '/path/to/repo';
      jest.spyOn(process, 'cwd').mockReturnValue(mockCwd);
      mockedExecSync.mockReturnValue((mockCwd + '\n') as any);
      
      const result = checkRepositoryRoot();
      
      expect(result).toBe(mockCwd);
      expect(mockedExecSync).toHaveBeenCalledWith('git rev-parse --show-toplevel', { encoding: 'utf-8' });
    });

    it('should exit with error when not at repository root', () => {
      const mockCwd = '/path/to/repo/subdir';
      const mockRoot = '/path/to/repo';
      jest.spyOn(process, 'cwd').mockReturnValue(mockCwd);
      mockedExecSync.mockReturnValue((mockRoot + '\n') as any);
      
      checkRepositoryRoot();
      
      expect(consoleErrorMock).toHaveBeenCalledWith('Error: workhere must be run from the repository root');
      expect(processExitMock).toHaveBeenCalledWith(1);
    });
  });

  describe('getWorktreeDir', () => {
    it('should return correct worktree directory path', () => {
      const currentDir = '/path/to/repo';
      const result = getWorktreeDir(currentDir);
      
      expect(result).toBe(path.join(currentDir, '.git', 'worktree'));
    });
  });

  describe('listWorktrees', () => {
    it('should parse worktree list correctly', () => {
      const mockOutput = `worktree /path/to/repo
HEAD abcdef123456
branch refs/heads/main

worktree /path/to/repo/.git/worktree/feature-branch
HEAD fedcba654321
branch refs/heads/feature-branch

worktree /path/to/repo/.git/worktree/bugfix
HEAD 123456abcdef
branch refs/heads/bugfix
`;
      
      mockedExecSync.mockReturnValue(mockOutput as any);
      
      const result = listWorktrees();
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ path: '/path/to/repo', branch: 'main' });
      expect(result[1]).toEqual({ path: '/path/to/repo/.git/worktree/feature-branch', branch: 'feature-branch' });
      expect(result[2]).toEqual({ path: '/path/to/repo/.git/worktree/bugfix', branch: 'bugfix' });
    });

    it('should return empty array on error', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('Command failed');
      });
      
      const result = listWorktrees();
      
      expect(result).toEqual([]);
    });

    it('should handle empty output', () => {
      mockedExecSync.mockReturnValue('' as any);
      
      const result = listWorktrees();
      
      expect(result).toEqual([]);
    });

    it('should skip entries without branch information', () => {
      const mockOutput = `worktree /path/to/repo
HEAD abcdef123456

worktree /path/to/repo/.git/worktree/feature
HEAD fedcba654321
branch refs/heads/feature
`;
      
      mockedExecSync.mockReturnValue(mockOutput as any);
      
      const result = listWorktrees();
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ path: '/path/to/repo/.git/worktree/feature', branch: 'feature' });
    });
  });
});