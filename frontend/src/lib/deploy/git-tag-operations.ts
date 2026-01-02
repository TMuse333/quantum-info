/**
 * Git Tag Operations
 * 
 * Functions for managing git tags:
 * - Creating tags
 * - Getting version numbers
 */

import { execGit } from './git-utils';

export interface GitOperationResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Get next version number based on existing tags
 *
 * @returns Next version number
 */
export function getNextVersion(): number {
  try {
    // Get all production tags
    const tags = execGit('tag -l "production-v*"');

    if (!tags) {
      return 1; // First version
    }

    // Extract version numbers
    const versions = tags
      .split('\n')
      .map((tag) => {
        const match = tag.match(/production-v(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((v) => v > 0);

    if (versions.length === 0) {
      return 1;
    }

    // Return max + 1
    return Math.max(...versions) + 1;
  } catch {
    return 1;
  }
}

/**
 * Create production tag
 *
 * @param version - Version number
 * @returns GitOperationResult with tag name
 */
export async function createProductionTag(version: number): Promise<GitOperationResult> {
  try {
    const tagName = `production-v${version}`;
    console.log(`🏷️  Creating tag: ${tagName}...`);

    // Check if tag already exists using git tag -l (doesn't error if tag doesn't exist)
    const existingTag = execGit(`tag -l ${tagName}`);
    if (existingTag) {
      console.log(`⚠️  Tag ${tagName} already exists, skipping...`);
      return {
        success: true,
        message: 'Tag already exists',
        details: { tagName, existed: true },
      };
    }

    // Create annotated tag
    execGit(`tag -a ${tagName} -m "Production release v${version}"`);

    console.log(`✅ Created tag: ${tagName}`);
    return {
      success: true,
      message: `Created tag ${tagName}`,
      details: { tagName, existed: false },
    };
  } catch (error: any) {
    console.error('❌ Failed to create tag:', error.message);
    return {
      success: false,
      message: `Failed to create tag: ${error.message}`,
    };
  }
}

