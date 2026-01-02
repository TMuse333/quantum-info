/**
 * List Production Snapshots API
 *
 * Returns a list of all production snapshots with metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

const GITHUB_OWNER = 'TMuse333';
const GITHUB_REPO = 'next-js-template';
const PRODUCTION_BRANCH = 'production';
const SNAPSHOTS_PATH = 'frontend/production-snapshots';

export async function GET(request: NextRequest) {
  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubToken) {
    return NextResponse.json(
      { error: 'GITHUB_TOKEN not configured' },
      { status: 500 }
    );
  }

  const octokit = new Octokit({ auth: githubToken });

  try {
    console.log('📋 [SNAPSHOTS] Listing production snapshots...');

    // Get contents of production-snapshots directory
    const { data: files } = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: SNAPSHOTS_PATH,
      ref: PRODUCTION_BRANCH,
    });

    // Filter for JSON files and extract version numbers
    const snapshots = Array.isArray(files)
      ? files
          .filter((file) => file.type === 'file' && file.name.endsWith('.json'))
          .map((file) => {
            const match = file.name.match(/v(\d+)\.json/);
            const version = match ? parseInt(match[1], 10) : 0;
            return {
              version,
              filename: file.name,
              path: file.path,
              sha: file.sha,
              size: file.size,
              url: file.download_url,
            };
          })
          .filter((s) => s.version > 0)
          .sort((a, b) => b.version - a.version) // Sort by version descending
      : [];

    console.log(`✅ [SNAPSHOTS] Found ${snapshots.length} snapshots`);

    return NextResponse.json({
      success: true,
      snapshots,
      count: snapshots.length,
    });
  } catch (error: any) {
    // If directory doesn't exist yet (404), return empty list
    if (error.status === 404) {
      console.log('⚠️  [SNAPSHOTS] No snapshots directory found (no deployments yet)');
      return NextResponse.json({
        success: true,
        snapshots: [],
        count: 0,
      });
    }

    console.error('❌ [SNAPSHOTS] Error listing snapshots:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list snapshots' },
      { status: 500 }
    );
  }
}
