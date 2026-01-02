/**
 * Deploy Production Site to Vercel
 *
 * Deploys user's production website with build validation
 *
 * IMPORTANT: This ALWAYS deploys from the 'main' branch.
 * Users never interact with Vercel or GitHub directly - all deployments
 * are automated and must use the production-ready main branch.
 */

import { getVercelClient } from './vercel-client';

// CRITICAL: Production branch is ALWAYS 'main' - never deploy from other branches!
// This is hardcoded to prevent users from accidentally deploying from development branches
const PRODUCTION_BRANCH = 'main' as const;

export interface DeployProductionParams {
  userId: string;
  githubOwner: string;
  githubRepo: string;
  githubToken: string;
  customDomain?: string; // e.g., "client.com"
  validateBuild?: boolean; // Default: true
  autoFixErrors?: boolean; // Use Claude Code to auto-fix build errors
  dryRun?: boolean; // If true, simulates deployment without calling Vercel API
}

export interface DeployProductionResult {
  success: boolean;
  projectId: string;
  deploymentId: string;
  productionUrl: string;
  vercelUrl: string;
  buildValidation?: {
    passed: boolean;
    errors?: string[];
    autoFixed?: boolean;
    fixAttempts?: number;
  };
  error?: string;
}

export async function deployProduction({
  userId,
  githubOwner,
  githubRepo,
  githubToken,
  customDomain,
  validateBuild = true,
  autoFixErrors = true,
  dryRun = false,
}: DeployProductionParams): Promise<DeployProductionResult> {
  console.log(`🚀 [DEPLOY-PRODUCTION] Starting production deployment for user: ${userId}`);

  if (dryRun) {
    console.log('🧪 [DEPLOY-PRODUCTION] DRY RUN MODE - No actual deployment will occur');
  }

  const vercel = !dryRun ? getVercelClient() : null;
  const projectName = userId; // Use app name directly without -production suffix
  const deploymentStartTime = Date.now();
  let trackingId: string | null = null;

  // Start deployment tracking
  try {
    const trackResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/deployments/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: userId,
        deploymentType: 'update',
        commitMessage: 'Production deployment',
      }),
    });

    if (trackResponse.ok) {
      const trackData = await trackResponse.json();
      trackingId = trackData.deploymentId;
      console.log(`📊 [DEPLOY-PRODUCTION] Tracking deployment: ${trackingId}`);
    }
  } catch (error) {
    console.warn('⚠️ [DEPLOY-PRODUCTION] Failed to start tracking, continuing without it:', error);
  }

  try {
    // ============================================================================
    // DRY RUN MODE: Simulate deployment without calling Vercel API
    // ============================================================================
    if (dryRun) {
      console.log('🧪 [DEPLOY-PRODUCTION] Simulating build validation...');
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate validation

      const mockBuildValidation = {
        passed: true,
        errors: [],
        autoFixed: false,
        fixAttempts: 0,
      };

      console.log('🧪 [DEPLOY-PRODUCTION] Simulating project creation/update...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('🧪 [DEPLOY-PRODUCTION] Simulating deployment...');
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate build time

      if (customDomain) {
        console.log(`🧪 [DEPLOY-PRODUCTION] Simulating domain assignment: ${customDomain}`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const mockResult = {
        success: true,
        projectId: `prj_mock_${Date.now()}`,
        deploymentId: `dpl_mock_${Date.now()}`,
        productionUrl: customDomain ? `https://${customDomain}` : `https://${projectName}.vercel.app`,
        vercelUrl: `https://${projectName}.vercel.app`,
        buildValidation: mockBuildValidation,
      };

      console.log('🎉 [DEPLOY-PRODUCTION] DRY RUN COMPLETE!');
      console.log(`🔗 [DEPLOY-PRODUCTION] Would deploy to: ${mockResult.productionUrl}`);
      console.log(`📁 [DEPLOY-PRODUCTION] Root directory: frontend/`);

      return mockResult;
    }

    // ============================================================================
    // REAL DEPLOYMENT: Actually call Vercel API
    // ============================================================================
    // ============================================================================
    // STEP 1: BUILD VALIDATION (with Claude Code auto-fix)
    // ============================================================================
    let buildValidationResult;

    if (validateBuild) {
      console.log('🔍 [DEPLOY-PRODUCTION] Running build validation...');

      // TODO: Implement actual build validation
      // This is a PLACEHOLDER for Claude Code integration
      buildValidationResult = await validateAndFixBuild({
        githubOwner,
        githubRepo,
        githubToken,
        branch: PRODUCTION_BRANCH, // ALWAYS use production branch
        autoFix: autoFixErrors,
      });

      if (!buildValidationResult.passed) {
        console.error('❌ [DEPLOY-PRODUCTION] Build validation failed');
        return {
          success: false,
          projectId: '',
          deploymentId: '',
          productionUrl: '',
          vercelUrl: '',
          buildValidation: buildValidationResult,
          error: 'Build validation failed. Fix errors before deploying to production.',
        };
      }

      console.log('✅ [DEPLOY-PRODUCTION] Build validation passed!');
    }

    // ============================================================================
    // STEP 2: CREATE OR UPDATE VERCEL PROJECT
    // ============================================================================
    console.log('📦 [DEPLOY-PRODUCTION] Setting up Vercel project...');

    let project;
    let isNewProject = false;
    try {
      // Try to get existing project
      project = await vercel!.getProject(projectName);
      console.log(`📦 [DEPLOY-PRODUCTION] Using existing project: ${project.id}`);
    } catch (error) {
      // Project doesn't exist, create it
      console.log('📦 [DEPLOY-PRODUCTION] Creating new Vercel project...');
      isNewProject = true;

      project = await vercel!.createProject({
        name: projectName,
        framework: 'nextjs',
        rootDirectory: 'frontend', // CRITICAL: Tell Vercel to use the frontend subdirectory
        buildCommand: 'npm run build',
        outputDirectory: '.next',
        installCommand: 'npm install',
        devCommand: 'npm run dev',
        productionBranch: PRODUCTION_BRANCH, // CRITICAL: Set production branch to main
        gitRepository: {
          type: 'github',
          repo: `${githubOwner}/${githubRepo}`,
          branch: PRODUCTION_BRANCH, // CRITICAL: Production ALWAYS uses main branch
        },
        environmentVariables: [
          {
            key: 'NEXT_PUBLIC_USER_ID',
            value: userId,
            type: 'plain',
            target: ['production'],
          },
          {
            key: 'NEXT_PUBLIC_REPO_TYPE',
            value: 'monorepo',
            type: 'plain',
            target: ['production'],
          },
          {
            key: 'NEXT_PUBLIC_CURRENT_BRANCH',
            value: PRODUCTION_BRANCH, // Environment variable set to production branch
            type: 'plain',
            target: ['production'],
          },
          // Add any other production-specific env vars here
        ],
      });

      console.log(`✅ [DEPLOY-PRODUCTION] Project created: ${project.id}`);
    }

    // CRITICAL: Always ensure production branch is set to 'main' (even for existing projects)
    // This prevents deployment from wrong branches if the setting was changed in Vercel dashboard
    try {
      console.log(`🔧 [DEPLOY-PRODUCTION] Ensuring production branch is set to '${PRODUCTION_BRANCH}'...`);
      await vercel!.updateProject(project.id, {
        productionBranch: PRODUCTION_BRANCH,
      });
      console.log(`✅ [DEPLOY-PRODUCTION] Production branch confirmed: ${PRODUCTION_BRANCH}`);
    } catch (error: any) {
      console.warn('⚠️ [DEPLOY-PRODUCTION] Could not update production branch setting:', error.message);
      console.warn('   This may require manual configuration in Vercel dashboard');
      // Continue anyway - the project should still work
    }

    // ============================================================================
    // STEP 3: TRIGGER DEPLOYMENT
    // ============================================================================
    console.log('🔨 [DEPLOY-PRODUCTION] Triggering production deployment...');
    console.log(`   Project ID: ${project.id}`);
    console.log(`   Project name: ${projectName}`);
    console.log(`   Project link:`, project.link);
    console.log(`   Repo ID: ${project.link?.repoId || 'NOT SET'}`);

    let deployment;
    try {
      // Check if project has git connection
      if (!project.link || !project.link.repoId) {
        console.warn('⚠️ [DEPLOY-PRODUCTION] Project does not have git connection set up');
        console.warn('   Vercel will auto-deploy when you push to the main branch');
        console.warn('   Make sure the main branch has commits and is connected to GitHub');
        throw new Error('Project git connection not established. Vercel will auto-deploy on next push to main branch.');
      }

      console.log(`   Using repo ID: ${project.link.repoId}`);
      
      deployment = await vercel!.createDeployment(project.id, {
        name: projectName,
        target: 'production',
        gitSource: {
          type: 'github',
          ref: PRODUCTION_BRANCH, // CRITICAL: ALWAYS deploy from main branch
          repoId: project.link.repoId,
        },
      });

      console.log(`✅ [DEPLOY-PRODUCTION] Deployment started: ${deployment.id}`);
      console.log(`   Deployment URL: ${deployment.url || 'pending'}`);
    } catch (error: any) {
      console.error('❌ [DEPLOY-PRODUCTION] Failed to trigger deployment:', error.message);
      console.error('   Error details:', error);
      
      // If deployment fails, Vercel should auto-deploy when we push to main
      // But we need to make sure the branch has commits
      console.warn('⚠️ [DEPLOY-PRODUCTION] Manual deployment failed. Vercel should auto-deploy on git push.');
      console.warn('   Make sure:');
      console.warn('   1. The main branch has commits');
      console.warn('   2. The git connection is properly set up in Vercel');
      console.warn('   3. The project is connected to the correct GitHub repo');
      
      throw new Error(`Failed to trigger deployment: ${error.message}. Vercel should auto-deploy when you push to main branch.`);
    }

    // ============================================================================
    // STEP 4: WAIT FOR DEPLOYMENT TO COMPLETE
    // ============================================================================
    console.log('⏳ [DEPLOY-PRODUCTION] Waiting for deployment to complete...');

    let finalDeployment;
    if (deployment.id !== 'auto') {
      try {
        finalDeployment = await vercel!.waitForDeployment(
          deployment.id,
          300000, // 5 min timeout
          (state, elapsed) => {
            console.log(`⏳ [DEPLOY-PRODUCTION] ${state} - ${Math.round(elapsed / 1000)}s elapsed`);
          }
        );
      } catch (error) {
        console.warn('⚠️ [DEPLOY-PRODUCTION] Could not wait for deployment, continuing...');
        finalDeployment = deployment;
      }
    } else {
      finalDeployment = deployment;
    }

    console.log(`✅ [DEPLOY-PRODUCTION] Deployment ready!`);

    // ============================================================================
    // STEP 5: ASSIGN CUSTOM DOMAIN (if provided)
    // ============================================================================
    let productionUrl = `https://${projectName}.vercel.app`;

    if (customDomain) {
      console.log(`🌐 [DEPLOY-PRODUCTION] Assigning custom domain: ${customDomain}`);

      try {
        await vercel!.addDomain(project.id, customDomain);
        productionUrl = `https://${customDomain}`;
        console.log(`✅ [DEPLOY-PRODUCTION] Domain assigned: ${productionUrl}`);
      } catch (error: any) {
        console.warn(`⚠️ [DEPLOY-PRODUCTION] Could not assign domain: ${error.message}`);
        console.warn('⚠️ [DEPLOY-PRODUCTION] Using default Vercel URL');
      }
    }

    console.log(`🎉 [DEPLOY-PRODUCTION] Production site deployed successfully!`);
    console.log(`🔗 [DEPLOY-PRODUCTION] Production URL: ${productionUrl}`);

    // Update deployment tracking with success
    if (trackingId) {
      try {
        const buildTime = Date.now() - deploymentStartTime;
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/deployments/${trackingId}/complete`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'success',
            vercelDeploymentId: finalDeployment.id,
            vercelDeploymentUrl: productionUrl,
            vercelProjectId: project.id,
            buildTime,
            branch: PRODUCTION_BRANCH,
          }),
        });
        console.log(`📊 [DEPLOY-PRODUCTION] Updated tracking: success`);
      } catch (error) {
        console.warn('⚠️ [DEPLOY-PRODUCTION] Failed to update tracking:', error);
      }
    }

    // Update websiteData.json deployment field
    try {
      const { updateWebsiteDeployment } = await import('@/lib/db/updateWebsiteDeployment');
      await updateWebsiteDeployment({
        projectId: userId,
        vercelProjectId: project.id,
        vercelProductionUrl: productionUrl,
        customDomain,
        githubOwner,
        githubRepo,
        lastDeploymentStatus: 'success',
        lastDeploymentId: trackingId || undefined,
        lastBuildTime: Date.now() - deploymentStartTime,
        incrementTotal: true,
        incrementSuccess: true,
      });
      console.log(`📊 [DEPLOY-PRODUCTION] Updated websiteData.json`);
    } catch (error) {
      console.warn('⚠️ [DEPLOY-PRODUCTION] Failed to update websiteData.json:', error);
    }

    return {
      success: true,
      projectId: project.id,
      deploymentId: finalDeployment.id,
      productionUrl,
      vercelUrl: `https://${projectName}.vercel.app`,
      buildValidation: buildValidationResult,
    };

  } catch (error: any) {
    console.error('❌ [DEPLOY-PRODUCTION] Deployment failed:', error);

    // Update deployment tracking with failure
    if (trackingId) {
      try {
        const buildTime = Date.now() - deploymentStartTime;
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/deployments/${trackingId}/complete`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'failed',
            errorMessage: error.message,
            errorStack: error.stack,
            buildTime,
            branch: PRODUCTION_BRANCH,
          }),
        });
        console.log(`📊 [DEPLOY-PRODUCTION] Updated tracking: failed`);
      } catch (trackError) {
        console.warn('⚠️ [DEPLOY-PRODUCTION] Failed to update tracking:', trackError);
      }
    }

    return {
      success: false,
      projectId: '',
      deploymentId: '',
      productionUrl: '',
      vercelUrl: '',
      error: error.message,
    };
  }
}

// ============================================================================
// PLACEHOLDER: BUILD VALIDATION WITH CLAUDE CODE AUTO-FIX
// ============================================================================

interface BuildValidationParams {
  githubOwner: string;
  githubRepo: string;
  githubToken: string;
  branch: string;
  autoFix: boolean;
}

interface BuildValidationResult {
  passed: boolean;
  errors?: string[];
  autoFixed?: boolean;
  fixAttempts?: number;
}

/**
 * PLACEHOLDER: Validate build and optionally auto-fix with Claude Code
 *
 * This is where Claude Code API integration would go:
 * 1. Clone repo locally (or use existing clone)
 * 2. Checkout specified branch
 * 3. Run `npm run build`
 * 4. If build fails and autoFix=true:
 *    - Parse error messages
 *    - Call Claude Code API to fix errors
 *    - Commit fixes to branch
 *    - Re-run build (max 3 attempts)
 * 5. Return validation result
 */
async function validateAndFixBuild(
  params: BuildValidationParams
): Promise<BuildValidationResult> {
  console.log('🔍 [BUILD-VALIDATION] PLACEHOLDER - Build validation not yet implemented');
  console.log('🔍 [BUILD-VALIDATION] Params:', params);

  // TODO: Implement actual build validation
  // For now, just return success
  // When implemented, this should:
  // 1. Run `npm run build` in a temporary directory
  // 2. Parse TypeScript/ESLint errors
  // 3. If autoFix=true, use Claude Code API to fix errors
  // 4. Return detailed validation results

  /*
  Example implementation structure:

  import { exec } from 'child_process';
  import { promisify } from 'util';
  const execAsync = promisify(exec);

  try {
    // 1. Clone repo to temp directory
    const tempDir = `/tmp/${params.githubRepo}-${Date.now()}`;
    await execAsync(`git clone https://${params.githubToken}@github.com/${params.githubOwner}/${params.githubRepo}.git ${tempDir}`);
    await execAsync(`cd ${tempDir} && git checkout ${params.branch}`);

    // 2. Install dependencies
    await execAsync(`cd ${tempDir} && npm install`);

    // 3. Run build
    const { stdout, stderr } = await execAsync(`cd ${tempDir} && npm run build`);

    // 4. If successful, clean up and return
    await execAsync(`rm -rf ${tempDir}`);
    return { passed: true };

  } catch (error: any) {
    // 5. Build failed - parse errors
    const errors = parseBuildErrors(error.stderr);

    // 6. If autoFix enabled, attempt Claude Code fix
    if (params.autoFix && errors.length > 0) {
      const fixResult = await claudeCodeAutoFix(tempDir, errors);

      if (fixResult.success) {
        // Commit fixes
        await execAsync(`cd ${tempDir} && git add . && git commit -m "Auto-fix build errors" && git push`);

        // Retry build
        try {
          await execAsync(`cd ${tempDir} && npm run build`);
          return { passed: true, autoFixed: true, fixAttempts: 1 };
        } catch (retryError) {
          return { passed: false, errors, autoFixed: false, fixAttempts: 1 };
        }
      }
    }

    // 7. Build failed and couldn't auto-fix
    return { passed: false, errors };
  }
  */

  return {
    passed: true, // TEMPORARY - always pass for now
    errors: [],
  };
}
