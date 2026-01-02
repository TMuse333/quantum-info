/**
 * Git Branch Operations
 * 
 * Functions for managing git branches:
 * - Checking out branches
 * - Checking if branches exist
 * - Getting current branch
 */

import { execGit } from './git-utils';

export interface GitOperationResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Check if main branch exists
 */
export function productionBranchExists(): boolean {
  try {
    const branches = execGit('branch --list main');
    return branches.includes('main');
  } catch {
    return false;
  }
}

/**
 * Get current branch name
 */
export function getCurrentBranch(): string {
  try {
    return execGit('rev-parse --abbrev-ref HEAD');
  } catch (error: any) {
    throw new Error(`Failed to get current branch: ${error.message}`);
  }
}

/**
 * Checkout main branch (creates if doesn't exist)
 *
 * @returns GitOperationResult with success status
 */
export async function checkoutProductionBranch(): Promise<GitOperationResult> {
  try {
    const currentBranch = getCurrentBranch();
    console.log(`📍 Current branch: ${currentBranch}`);

    if (currentBranch === 'main') {
      console.log('✅ Already on main branch');
      return {
        success: true,
        message: 'Already on main branch',
      };
    }

    // Check if main branch exists
    const exists = productionBranchExists();

    if (exists) {
      // Checkout existing main branch
      console.log('🔀 Checking out existing main branch...');
      execGit('checkout main');
    } else {
      // Create new main branch
      console.log('🌿 Creating new main branch...');
      execGit('checkout -b main');
    }

    console.log('✅ Successfully checked out main branch');
    return {
      success: true,
      message: 'Checked out main branch',
      details: { existed: exists },
    };
  } catch (error: any) {
    console.error('❌ Failed to checkout main branch:', error.message);
    return {
      success: false,
      message: `Failed to checkout main branch: ${error.message}`,
    };
  }
}

/**
 * Return to original branch
 *
 * @param branch - Branch to checkout
 * @returns GitOperationResult
 */
export async function returnToBranch(branch: string): Promise<GitOperationResult> {
  try {
    console.log(`🔙 Returning to ${branch} branch...`);
    execGit(`checkout ${branch}`);
    console.log(`✅ Returned to ${branch} branch`);
    return {
      success: true,
      message: `Returned to ${branch} branch`,
    };
  } catch (error: any) {
    console.error(`❌ Failed to return to ${branch}:`, error.message);
    return {
      success: false,
      message: `Failed to return to ${branch}: ${error.message}`,
    };
  }
}

