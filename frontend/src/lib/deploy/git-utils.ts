/**
 * Git Utility Functions
 * 
 * Core utilities for git operations:
 * - Finding project root
 * - Executing git commands
 * - Lock file management
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Get the project root directory (where .git folder is located)
 * Next.js runs from frontend/ directory, but git operations need to run from project root
 */
export function getProjectRoot(): string {
  let currentDir = process.cwd();
  
  // Walk up the directory tree until we find .git folder
  while (currentDir !== path.dirname(currentDir)) {
    const gitPath = path.join(currentDir, '.git');
    if (fs.existsSync(gitPath)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  
  // Fallback to process.cwd() if .git not found (shouldn't happen)
  return process.cwd();
}

/**
 * Remove git lock file if it exists (stale lock from crashed process)
 * More aggressive: tries multiple times with small delays
 */
export function removeLockFileIfExists(force: boolean = false): void {
  const projectRoot = getProjectRoot();
  const lockFilePath = path.join(projectRoot, '.git', 'index.lock');
  
  if (!fs.existsSync(lockFilePath)) {
    return;
  }

  console.warn('⚠️  Found git lock file, force removing...');
  
  // Try multiple times with small delays
  const maxAttempts = force ? 5 : 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // On later attempts, wait a bit in case another process is finishing
      if (attempt > 1) {
        const delay = attempt * 100; // 100ms, 200ms, 300ms...
        console.log(`   Attempt ${attempt}/${maxAttempts}, waiting ${delay}ms...`);
        const start = Date.now();
        while (Date.now() - start < delay) {
          // Busy wait (simple approach)
        }
      }
      
      fs.unlinkSync(lockFilePath);
      console.log(`✅ Lock file removed (attempt ${attempt})`);
      return;
    } catch (error: any) {
      if (attempt === maxAttempts) {
        console.error(`❌ Failed to remove lock file after ${maxAttempts} attempts: ${error.message}`);
        if (force) {
          // In force mode, try one more time with chmod first
          try {
            fs.chmodSync(lockFilePath, 0o666);
            fs.unlinkSync(lockFilePath);
            console.log('✅ Lock file force removed after chmod');
            return;
          } catch {
            throw new Error(`Cannot remove git lock file. Please manually delete: ${lockFilePath}`);
          }
        }
        throw new Error(`Cannot remove git lock file: ${error.message}. Please remove .git/index.lock manually.`);
      }
    }
  }
}

/**
 * Execute a git command with timeout protection and lock file handling
 */
export function execGit(
  command: string,
  timeout: number = 30000,
  retryOnLock: boolean = true,
  force: boolean = false
): string {
  // Remove stale lock file before first attempt (force mode for aggressive removal)
  if (retryOnLock) {
    removeLockFileIfExists(force);
  }

  try {
    console.log(`[GIT] Running: git ${command}`);
    const projectRoot = getProjectRoot();
    const result = execSync(`git ${command}`, {
      encoding: 'utf-8',
      cwd: projectRoot, // Git operations must run from project root where .git is
      timeout: timeout, // 30 second default timeout
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: '0', // Prevent git from prompting for input
      },
    });
    const output = result.trim();
    if (output) {
      console.log(`[GIT] Output: ${output.substring(0, 200)}${output.length > 200 ? '...' : ''}`);
    }
    return output;
  } catch (error: any) {
    // Check if error is due to lock file
    if (error.message && error.message.includes('index.lock')) {
      if (retryOnLock) {
        console.warn('⚠️  Lock file detected during command, force removing and retrying...');
        removeLockFileIfExists(true); // Force mode
        // Retry once after removing lock
        return execGit(command, timeout, false, force);
      } else {
        throw new Error(`Git lock file persists. Another git process may be running. Please wait and try again.`);
      }
    }
    
    if (error.killed) {
      throw new Error(`Git command timed out after ${timeout}ms: ${command}`);
    }
    console.error(`[GIT] Error: ${error.message}`);
    throw new Error(`Git command failed: ${error.message}`);
  }
}

