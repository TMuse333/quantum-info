/**
 * API Route: Deploy Development Editor to Vercel
 *
 * POST /api/vercel/deploy-editor
 *
 * This runs ONCE during user onboarding to create the development editor
 */

import { NextRequest, NextResponse } from 'next/server';
import { deployEditor } from '@/lib/vercel/deploy-editor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      userId,
      githubOwner,
      githubRepo,
      githubToken,
      customDomain,
      dryRun = false,
    } = body;

    // Validate required fields
    if (!userId || !githubOwner || !githubRepo || !githubToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: userId, githubOwner, githubRepo, githubToken',
        },
        { status: 400 }
      );
    }

    console.log(`📡 [API] Deploying editor for user: ${userId}`);
    if (dryRun) {
      console.log('🧪 [API] DRY RUN MODE ENABLED');
    }

    // Deploy the editor
    const result = await deployEditor({
      userId,
      githubOwner,
      githubRepo,
      githubToken,
      customDomain,
      dryRun,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Deployment failed',
        },
        { status: 500 }
      );
    }

    console.log(`✅ [API] Editor deployed successfully: ${result.editorUrl}`);

    return NextResponse.json({
      success: true,
      projectId: result.projectId,
      deploymentId: result.deploymentId,
      editorUrl: result.editorUrl,
      vercelUrl: result.vercelUrl,
    });

  } catch (error: any) {
    console.error('❌ [API] Deploy editor error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
