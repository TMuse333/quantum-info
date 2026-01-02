/**
 * Git Push Operations
 * 
 * Functions for pushing to remote:
 * - Pushing branches
 * - Pushing tags
 */

import { execGit } from './git-utils';

export interface GitOperationResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Push to remote repository
 *
 * @param branch - Branch to push (default: main)
 * @param tag - Tag to push (optional)
 * @returns GitOperationResult with push status
 */
export async function pushToRemote(
  branch: string = 'main',
  tag?: string,
  force: boolean = false
): Promise<GitOperationResult> {
  try {
    console.log(`📤 Pushing to remote${force ? ' (force)' : ''}...`);

    // Push branch
    console.log(`  - Pushing branch: ${branch}`);
    const pushCommand = force ? `push --force origin ${branch}` : `push origin ${branch}`;
    execGit(pushCommand, 60000, true, force); // Longer timeout for push

    // Push tag if provided
    if (tag) {
      console.log(`  - Pushing tag: ${tag}`);
      const tagCommand = force ? `push --force origin ${tag}` : `push origin ${tag}`;
      execGit(tagCommand, 60000, true, force);
    }

    console.log('✅ Successfully pushed to remote');
    return {
      success: true,
      message: 'Pushed to remote',
      details: { branch, tag },
    };
  } catch (error: any) {
    console.error('❌ Failed to push:', error.message);
    return {
      success: false,
      message: `Failed to push: ${error.message}`,
    };
  }
}

