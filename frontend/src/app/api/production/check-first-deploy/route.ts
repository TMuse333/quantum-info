/**
 * Check First Deploy API
 *
 * Determines if this is the first deployment by checking for existing production snapshots
 * Returns: { isFirstDeploy: boolean, latestVersion: number | null }
 */

import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

const GITHUB_OWNER = 'TMuse333';
const GITHUB_REPO = 'next-js-template';
const PRODUCTION_BRANCH = 'main';
const SNAPSHOTS_PATH = 'frontend/production-snapshots';

export async function GET() {
  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubToken) {
    return NextResponse.json(
      { error: 'GITHUB_TOKEN not configured' },
      { status: 500 }
    );
  }

  try {
    const octokit = new Octokit({ auth: githubToken });

    console.log('🔍 [CHECK-FIRST-DEPLOY] Checking for existing production snapshots...');

    // Try to get the production-snapshots directory
    try {
      const { data: contents } = await octokit.repos.getContent({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path: SNAPSHOTS_PATH,
        ref: PRODUCTION_BRANCH,
      });

      // If directory exists and has files, it's not the first deploy
      if (Array.isArray(contents) && contents.length > 0) {
        // Extract version numbers from snapshot files (e.g., v1.json, v2.json)
        const versionNumbers = contents
          .filter((file: any) => file.name.match(/^v\d+\.json$/))
          .map((file: any) => {
            const match = file.name.match(/^v(\d+)\.json$/);
            return match ? parseInt(match[1], 10) : 0;
          })
          .filter((v: number) => v > 0);

        const latestVersion = versionNumbers.length > 0
          ? Math.max(...versionNumbers)
          : null;

        console.log(`✅ [CHECK-FIRST-DEPLOY] Found ${contents.length} snapshots, latest: v${latestVersion}`);

        return NextResponse.json({
          isFirstDeploy: false,
          latestVersion,
          snapshotCount: contents.length,
        });
      }

      // Directory exists but is empty - treat as first deploy
      console.log('📭 [CHECK-FIRST-DEPLOY] Snapshots directory exists but is empty');
      return NextResponse.json({
        isFirstDeploy: true,
        latestVersion: null,
        snapshotCount: 0,
      });
    } catch (error: any) {
      // 404 means directory doesn't exist - definitely first deploy
      if (error.status === 404) {
        console.log('🆕 [CHECK-FIRST-DEPLOY] No snapshots directory found - this is the first deploy');
        return NextResponse.json({
          isFirstDeploy: true,
          latestVersion: null,
          snapshotCount: 0,
        });
      }

      // Other errors should be thrown
      throw error;
    }
  } catch (error: any) {
    console.error('❌ [CHECK-FIRST-DEPLOY] Error checking deployment status:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to check deployment status',
        // Default to requiring full deploy (Vercel API) if we can't determine
        isFirstDeploy: true,
        latestVersion: null,
      },
      { status: 500 }
    );
  }
}
