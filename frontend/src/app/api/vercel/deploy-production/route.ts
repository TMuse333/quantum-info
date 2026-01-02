/**
 * API Route: Deploy Production Site to Vercel
 *
 * POST /api/vercel/deploy-production
 *
 * Deploys user's production website with build validation
 * This is called every time the user clicks "Deploy to Production"
 */

import { NextRequest, NextResponse } from 'next/server';
import { deployProduction } from '@/lib/vercel/deploy-production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      userId,
      githubOwner,
      githubRepo,
      githubToken,
      customDomain,
      validateBuild = true,
      autoFixErrors = true,
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

    console.log(`📡 [API] Deploying production for user: ${userId}`);
    console.log(`📡 [API] Build validation: ${validateBuild}, Auto-fix: ${autoFixErrors}`);
    if (dryRun) {
      console.log('🧪 [API] DRY RUN MODE ENABLED');
    }

    // ============================================================================
    // DEPLOY TO PRODUCTION (with build validation + Claude Code auto-fix)
    // ============================================================================
    const result = await deployProduction({
      userId,
      githubOwner,
      githubRepo,
      githubToken,
      customDomain,
      validateBuild,
      autoFixErrors,
      dryRun,
    });

    if (!result.success) {
      // Build validation failed or deployment error
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Deployment failed',
          buildValidation: result.buildValidation,
        },
        { status: 500 }
      );
    }

    console.log(`✅ [API] Production deployed successfully: ${result.productionUrl}`);

    return NextResponse.json({
      success: true,
      projectId: result.projectId,
      deploymentId: result.deploymentId,
      productionUrl: result.productionUrl,
      vercelUrl: result.vercelUrl,
      buildValidation: result.buildValidation,
    });

  } catch (error: any) {
    console.error('❌ [API] Deploy production error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
