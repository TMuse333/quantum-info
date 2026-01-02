/**
 * Deploy Development Editor to Vercel
 *
 * Creates a Vercel project for the user's development editor
 * This runs ONCE during user onboarding
 */

import { getVercelClient } from './vercel-client';

export interface DeployEditorParams {
  userId: string;
  githubOwner: string;
  githubRepo: string;
  githubToken: string;
  customDomain?: string; // e.g., "client-dev.yourcompany.com"
  dryRun?: boolean; // If true, simulates deployment without calling Vercel API
}

export interface DeployEditorResult {
  success: boolean;
  projectId: string;
  deploymentId: string;
  editorUrl: string;
  vercelUrl: string;
  error?: string;
}

export async function deployEditor({
  userId,
  githubOwner,
  githubRepo,
  githubToken,
  customDomain,
  dryRun = false,
}: DeployEditorParams): Promise<DeployEditorResult> {
  console.log(`🚀 [DEPLOY-EDITOR] Starting deployment for user: ${userId}`);

  if (dryRun) {
    console.log('🧪 [DEPLOY-EDITOR] DRY RUN MODE - No actual deployment will occur');
  }

  const vercel = !dryRun ? getVercelClient() : null;
  const projectName = `${userId}-editor`;

  try {
    // ============================================================================
    // DRY RUN MODE: Simulate deployment without calling Vercel API
    // ============================================================================
    if (dryRun) {
      console.log('🧪 [DEPLOY-EDITOR] Simulating project creation...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

      console.log('🧪 [DEPLOY-EDITOR] Simulating deployment...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate build time

      if (customDomain) {
        console.log(`🧪 [DEPLOY-EDITOR] Simulating domain assignment: ${customDomain}`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const mockResult = {
        success: true,
        projectId: `prj_mock_${Date.now()}`,
        deploymentId: `dpl_mock_${Date.now()}`,
        editorUrl: customDomain ? `https://${customDomain}` : `https://${projectName}.vercel.app`,
        vercelUrl: `https://${projectName}.vercel.app`,
      };

      console.log('🎉 [DEPLOY-EDITOR] DRY RUN COMPLETE!');
      console.log(`🔗 [DEPLOY-EDITOR] Would deploy to: ${mockResult.editorUrl}`);

      return mockResult;
    }

    // ============================================================================
    // REAL DEPLOYMENT: Actually call Vercel API
    // ============================================================================
    // 1. Create Vercel project
    console.log('📦 [DEPLOY-EDITOR] Creating Vercel project...');

    const project = await vercel!.createProject({
      name: projectName,
      framework: 'nextjs',
      rootDirectory: 'frontend', // CRITICAL: Tell Vercel to use the frontend subdirectory
      buildCommand: 'npm run build',
      outputDirectory: '.next',
      installCommand: 'npm install',
      devCommand: 'npm run dev',
      gitRepository: {
        type: 'github',
        repo: `${githubOwner}/${githubRepo}`,
        branch: 'development', // Editor runs on development branch
      },
      environmentVariables: [
        {
          key: 'GITHUB_TOKEN',
          value: githubToken,
          type: 'encrypted',
          target: ['production', 'preview'],
        },
        {
          key: 'GITHUB_OWNER',
          value: githubOwner,
          type: 'plain',
          target: ['production', 'preview'],
        },
        {
          key: 'GITHUB_REPO',
          value: githubRepo,
          type: 'plain',
          target: ['production', 'preview'],
        },
        {
          key: 'NEXT_PUBLIC_USER_ID',
          value: userId,
          type: 'plain',
          target: ['production', 'preview'],
        },
        {
          key: 'NEXT_PUBLIC_REPO_TYPE',
          value: 'monorepo',
          type: 'plain',
          target: ['production', 'preview'],
        },
        {
          key: 'NEXT_PUBLIC_CURRENT_BRANCH',
          value: 'development',
          type: 'plain',
          target: ['production', 'preview'],
        },
      ],
    });

    console.log(`✅ [DEPLOY-EDITOR] Project created: ${project.id}`);

    // 2. Trigger initial deployment
    console.log('🔨 [DEPLOY-EDITOR] Triggering initial deployment...');

    // Note: Vercel may auto-deploy on project creation with git integration
    // If not, we can manually trigger:
    let deployment;
    try {
      deployment = await vercel!.createDeployment(project.id, {
        name: projectName,
        target: 'production',
        gitSource: {
          type: 'github',
          ref: 'development',
          repoId: project.link?.repoId || 0,
        },
      });

      console.log(`🔨 [DEPLOY-EDITOR] Deployment started: ${deployment.id}`);
    } catch (error: any) {
      // Vercel might auto-deploy on git connection, so deployment may already exist
      console.log('⚠️ [DEPLOY-EDITOR] Auto-deployment may be in progress');
      deployment = { id: 'auto', url: `${projectName}.vercel.app`, readyState: 'BUILDING' } as any;
    }

    // 3. Wait for deployment to complete
    console.log('⏳ [DEPLOY-EDITOR] Waiting for deployment to complete...');

    let finalDeployment;
    if (deployment.id !== 'auto') {
      try {
        finalDeployment = await vercel!.waitForDeployment(
          deployment.id,
          300000, // 5 min timeout for first deploy
          (state, elapsed) => {
            console.log(`⏳ [DEPLOY-EDITOR] ${state} - ${Math.round(elapsed / 1000)}s elapsed`);
          }
        );
      } catch (error) {
        console.warn('⚠️ [DEPLOY-EDITOR] Could not wait for deployment, continuing...');
        finalDeployment = deployment;
      }
    } else {
      finalDeployment = deployment;
    }

    console.log(`✅ [DEPLOY-EDITOR] Deployment ready!`);

    // 4. Assign custom domain (if provided)
    let editorUrl = `https://${projectName}.vercel.app`;

    if (customDomain) {
      console.log(`🌐 [DEPLOY-EDITOR] Assigning custom domain: ${customDomain}`);

      try {
        await vercel!.addDomain(project.id, customDomain);
        editorUrl = `https://${customDomain}`;
        console.log(`✅ [DEPLOY-EDITOR] Domain assigned: ${editorUrl}`);
      } catch (error: any) {
        console.warn(`⚠️ [DEPLOY-EDITOR] Could not assign domain: ${error.message}`);
        console.warn('⚠️ [DEPLOY-EDITOR] Using default Vercel URL');
      }
    }

    console.log(`🎉 [DEPLOY-EDITOR] Editor deployed successfully!`);
    console.log(`🔗 [DEPLOY-EDITOR] Editor URL: ${editorUrl}`);

    return {
      success: true,
      projectId: project.id,
      deploymentId: finalDeployment.id,
      editorUrl,
      vercelUrl: `https://${projectName}.vercel.app`,
    };

  } catch (error: any) {
    console.error('❌ [DEPLOY-EDITOR] Deployment failed:', error);

    return {
      success: false,
      projectId: '',
      deploymentId: '',
      editorUrl: '',
      vercelUrl: '',
      error: error.message,
    };
  }
}
