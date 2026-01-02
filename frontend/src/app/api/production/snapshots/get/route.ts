/**
 * Get Production Snapshot API
 *
 * Returns the websiteData.json for a specific production version
 */

import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

const GITHUB_OWNER = 'TMuse333';
const GITHUB_REPO = 'next-js-template';
const PRODUCTION_BRANCH = 'production';
const SNAPSHOTS_PATH = 'frontend/production-snapshots';

export async function POST(request: NextRequest) {
  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubToken) {
    return NextResponse.json(
      { error: 'GITHUB_TOKEN not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { version } = body;

    if (!version || typeof version !== 'number') {
      return NextResponse.json(
        { error: 'Version number is required' },
        { status: 400 }
      );
    }

    console.log(`📸 [SNAPSHOT] Retrieving snapshot for v${version}...`);

    const octokit = new Octokit({ auth: githubToken });

    // Get snapshot file from production branch
    const snapshotPath = `${SNAPSHOTS_PATH}/v${version}.json`;

    const { data: file } = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: snapshotPath,
      ref: PRODUCTION_BRANCH,
    });

    // Decode content (it's base64 encoded)
    if ('content' in file && file.content) {
      const content = Buffer.from(file.content, 'base64').toString('utf-8');
      const snapshot = JSON.parse(content);

      console.log(`✅ [SNAPSHOT] Retrieved snapshot v${version}`);

      return NextResponse.json({
        success: true,
        snapshot,
        metadata: {
          version: snapshot.version,
          timestamp: snapshot.timestamp,
          commitSha: snapshot.commitSha,
        },
        websiteData: snapshot.websiteData,
      });
    } else {
      throw new Error('File content not found');
    }
  } catch (error: any) {
    if (error.status === 404) {
      console.error(`❌ [SNAPSHOT] Snapshot not found`);
      return NextResponse.json(
        { error: 'Snapshot not found for this version' },
        { status: 404 }
      );
    }

    console.error('❌ [SNAPSHOT] Error retrieving snapshot:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve snapshot' },
      { status: 500 }
    );
  }
}
