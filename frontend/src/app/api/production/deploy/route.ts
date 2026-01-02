/**
 * Deployment Orchestrator API
 *
 * Main API endpoint that coordinates the entire production deployment process:
 * 1. Validate website data
 * 2. Generate SEO metadata
 * 3. Generate page files
 * 4. Review generated code
 * 5. Execute git operations
 * 6. Deploy to Vercel
 * 7. Return deployment result
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateAllPageFiles, validateComponentTypes } from '@/lib/deploy/generators/generatePageFiles';
import { deployToProductionViaAPI } from '@/lib/deploy/github-api-operations';
import { waitForVercelAutoDeployment } from '@/lib/deploy/vercel-operations';
import { copyProductionComponents } from '@/lib/deploy/copyComponents';
import { SEOMetadata } from '@/types/website';

interface DeploymentRequest {
  websiteData: any;
  skipCodeReview?: boolean; // Optional flag to skip code review
  skipVercelDeploy?: boolean; // Optional flag to skip Vercel (just do git)
  dryRun?: boolean; // Optional flag for dry-run mode (simulates without executing)
}

interface DeploymentResponse {
  success: boolean;
  message: string;
  details?: {
    version?: number;
    commitSha?: string;
    tag?: string;
    deploymentUrl?: string;
    filesGenerated?: number;
    pagesDeployed?: string[];
    codeReviewPassed?: boolean;
    vercelDeploymentId?: string;
  };
  errors?: string[];
}

export async function POST(request: NextRequest): Promise<NextResponse<DeploymentResponse>> {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 PRODUCTION DEPLOYMENT ORCHESTRATOR');
  console.log('='.repeat(80) + '\n');

  const stages = {
    validation: false,
    seoGeneration: false,
    fileGeneration: false,
    codeReview: false,
    gitOperations: false,
    vercelDeployment: false,
  };

  try {
    // ========================================================================
    // Parse Request
    // ========================================================================
    const body: DeploymentRequest = await request.json();
    const { websiteData, skipCodeReview = false, skipVercelDeploy = false, dryRun = false } = body;

    if (dryRun) {
      console.log('🧪 DRY RUN MODE ENABLED');
      console.log('='.repeat(80) + '\n');
    }

    if (!websiteData) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request: websiteData is required',
          errors: ['Missing websiteData in request body'],
        },
        { status: 400 }
      );
    }

    // ========================================================================
    // STAGE 1: Validate Website Data
    // ========================================================================
    console.log('📋 STAGE 1: Validating website data...\n');

    const validation = validateComponentTypes(websiteData);

    if (!validation.valid) {
      console.error('❌ Validation failed!');
      console.error('Missing component types:', validation.missingTypes);
      return NextResponse.json(
        {
          success: false,
          message: 'Website data validation failed',
          errors: [
            `Missing component types: ${validation.missingTypes.join(', ')}`,
            'Please add these components to the registry or remove them from websiteData',
          ],
        },
        { status: 400 }
      );
    }

    console.log(`✅ Validation passed`);
    console.log(`  - ${validation.usedTypes.length} component types in use`);
    console.log(`  - Components: ${validation.usedTypes.join(', ')}\n`);
    stages.validation = true;

    // ========================================================================
    // STAGE 2: Generate SEO Metadata
    // ========================================================================
    console.log('🔍 STAGE 2: Generating SEO metadata...\n');

    let seoMetadata: Record<string, SEOMetadata> = {};

    try {
      const seoResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/assistant/generate-seo-batch`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteData }),
        }
      );

      if (seoResponse.ok) {
        const seoData = await seoResponse.json();
        seoMetadata = seoData.seoMetadata;
        console.log(`✅ SEO generated for ${Object.keys(seoMetadata).length} pages\n`);
        stages.seoGeneration = true;
      } else {
        console.warn('⚠️  SEO generation failed, using defaults');
        // Use defaults - don't fail deployment
        stages.seoGeneration = false;
      }
    } catch (error: any) {
      console.warn('⚠️  SEO generation error, using defaults:', error.message);
      stages.seoGeneration = false;
    }

    // ========================================================================
    // STAGE 3: Generate Page Files
    // ========================================================================
    console.log('📝 STAGE 3: Generating page files...\n');

    const files = generateAllPageFiles(websiteData, seoMetadata);

    console.log(`✅ Generated ${files.length} files`);
    files.forEach((file) => {
      console.log(`  - ${file.path} (${file.content.length} chars)`);
    });
    console.log();
    stages.fileGeneration = true;

    // ========================================================================
    // STAGE 4: Code Review
    // ========================================================================
    let codeReviewPassed = true;

    if (!skipCodeReview) {
      console.log('🔍 STAGE 4: Reviewing generated code...\n');

      try {
        const reviewResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/assistant/review-deployment`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ files }),
          }
        );

        if (reviewResponse.ok) {
          const reviewData = await reviewResponse.json();

          if (reviewData.approved) {
            console.log('✅ Code review passed!');
            if (reviewData.suggestions && reviewData.suggestions.length > 0) {
              console.log(`  ℹ️  ${reviewData.suggestions.length} suggestions:`);
              reviewData.suggestions.forEach((s: string) => {
                console.log(`     - ${s}`);
              });
            }
          } else {
            console.error('❌ Code review failed!');
            reviewData.issues.forEach((issue: string) => {
              console.error(`  - ${issue}`);
            });

            return NextResponse.json(
              {
                success: false,
                message: 'Code review failed',
                errors: reviewData.issues,
              },
              { status: 400 }
            );
          }

          console.log();
          stages.codeReview = true;
        } else {
          console.warn('⚠️  Code review failed to run, proceeding anyway\n');
          stages.codeReview = false;
        }
      } catch (error: any) {
        console.warn('⚠️  Code review error, proceeding anyway:', error.message, '\n');
        stages.codeReview = false;
      }
    } else {
      console.log('⏭️  STAGE 4: Code review skipped\n');
    }

    // ========================================================================
    // STAGE 5: Copy Component Files
    // ========================================================================
    console.log('📦 STAGE 5: Copying component files...\n');

    const usedTypes = validation.usedTypes;
    const copyResult = await copyProductionComponents(usedTypes, dryRun);

    if (!copyResult.success) {
      console.error('❌ Component copying failed!');
      return NextResponse.json(
        {
          success: false,
          message: 'Component copying failed',
          errors: copyResult.errors,
        },
        { status: 500 }
      );
    }

    const componentFiles = copyResult.files;
    console.log(`✅ Copied ${componentFiles.length} component files\n`);

    // ========================================================================
    // STAGE 6: GitHub API Deployment (No server restarts!)
    // ========================================================================
    console.log('📦 STAGE 6: GitHub API deployment...\n');

    const gitResult = await deployToProductionViaAPI(
      componentFiles, // component files (.tsx and index.ts)
      files, // page files (page components, data files, route files)
      `Generated ${files.length} page files and ${componentFiles.length} component files for ${Object.keys(websiteData.pages).length} pages`,
      dryRun
    );

    if (!gitResult.success) {
      console.error('❌ GitHub API deployment failed!');
      console.error(`   Error: ${gitResult.error || gitResult.message}`);
      return NextResponse.json(
        {
          success: false,
          message: 'GitHub deployment failed',
          errors: [gitResult.error || gitResult.message],
        },
        { status: 500 }
      );
    }

    console.log('✅ GitHub deployment complete (no server restarts!)');
    console.log(`  - Version: v${gitResult.details?.version}`);
    console.log(`  - Commit: ${gitResult.details?.commitSha?.substring(0, 7)}`);
    console.log(`  - Tag: ${gitResult.details?.tagName}`);
    if (gitResult.details?.commitUrl) {
      console.log(`  - Commit URL: ${gitResult.details.commitUrl}`);
    }
    console.log();
    stages.gitOperations = true;

    // ========================================================================
    // STAGE 6: Vercel Auto-Deployment (Wait for GitHub integration)
    // ========================================================================
    let vercelResult = null;

    if (!skipVercelDeploy) {
      console.log('🌐 STAGE 6: Waiting for Vercel auto-deployment...\n');
      console.log('  Note: Vercel automatically deploys when main branch is updated via GitHub integration\n');

      const projectId = process.env.VERCEL_PROJECT_ID;

      if (!projectId) {
        console.warn('⚠️  VERCEL_PROJECT_ID not set, skipping Vercel deployment wait\n');
      } else if (!dryRun) {
        try {
          // Wait for Vercel's auto-deployment to complete
          vercelResult = await waitForVercelAutoDeployment(projectId);

          if (vercelResult.success) {
            console.log('✅ Vercel deployment complete!');
            console.log(`  - URL: ${vercelResult.url}\n`);
            stages.vercelDeployment = true;
          } else {
            console.error('❌ Vercel deployment failed:', vercelResult.error);
            // Don't fail entire deployment - git push succeeded
            stages.vercelDeployment = false;
          }
        } catch (error: any) {
          console.error('❌ Vercel deployment error:', error.message, '\n');
          stages.vercelDeployment = false;
        }
      } else {
        console.log('🧪 DRY RUN - Skipping Vercel deployment wait\n');
      }
    } else {
      console.log('⏭️  STAGE 6: Vercel deployment skipped\n');
    }

    // ========================================================================
    // Success Response
    // ========================================================================
    console.log('='.repeat(80));
    if (dryRun) {
      console.log('✅ DRY RUN COMPLETE!');
      console.log('='.repeat(80));
      console.log('\n🧪 Dry Run Summary (No changes were made):');
    } else {
      console.log('✅ DEPLOYMENT COMPLETE!');
      console.log('='.repeat(80));
      console.log('\n📊 Deployment Summary:');
    }
    console.log(`  - Version: v${gitResult.details?.version}`);
    console.log(`  - Commit: ${gitResult.details?.commitSha?.substring(0, 7)}`);
    console.log(`  - Files: ${files.length}`);
    console.log(`  - Pages: ${Object.keys(websiteData.pages).join(', ')}`);
    if (vercelResult?.url) {
      console.log(`  - Live URL: ${vercelResult.url}`);
    }
    if (dryRun) {
      console.log('\n  ⚠️  This was a DRY RUN - no actual deployment occurred');
    }
    console.log();

    return NextResponse.json({
      success: true,
      message: dryRun ? 'Dry run successful (no changes made)' : 'Deployment successful',
      details: {
        version: gitResult.details?.version,
        commitSha: gitResult.details?.commitSha,
        commitUrl: gitResult.details?.commitUrl,
        tag: gitResult.details?.tagName,
        tagUrl: gitResult.details?.tagUrl,
        deploymentUrl: vercelResult?.url,
        filesGenerated: files.length,
        pagesDeployed: Object.keys(websiteData.pages),
        codeReviewPassed: stages.codeReview,
        vercelDeploymentId: vercelResult?.deploymentId,
        dryRun,
      },
    });
  } catch (error: any) {
    console.error('\n❌ DEPLOYMENT FAILED!');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.log();

    return NextResponse.json(
      {
        success: false,
        message: 'Deployment failed',
        errors: [error.message],
      },
      { status: 500 }
    );
  }
}
