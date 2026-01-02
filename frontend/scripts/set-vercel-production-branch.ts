/**
 * Script to set Vercel production branch to 'main'
 *
 * Usage:
 *   npx ts-node scripts/set-vercel-production-branch.ts <project-id-or-name>
 *
 * Example:
 *   npx ts-node scripts/set-vercel-production-branch.ts next-js-template
 *
 * Requirements:
 *   - VERCEL_API_TOKEN must be set in .env
 *   - VERCEL_TEAM_ID (optional, if using a team)
 */

import 'dotenv/config';

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

async function setProductionBranch(projectId: string, branch: string = 'main') {
  if (!VERCEL_API_TOKEN) {
    console.error('❌ VERCEL_API_TOKEN environment variable is not set');
    console.error('   Add it to your .env file');
    process.exit(1);
  }

  const baseUrl = 'https://api.vercel.com';
  const teamParam = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '';

  try {
    console.log(`🔧 Setting production branch to '${branch}' for project: ${projectId}`);

    const response = await fetch(
      `${baseUrl}/v9/projects/${projectId}${teamParam}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${VERCEL_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productionBranch: branch,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Vercel API Error: ${error.error?.message || response.statusText}`);
    }

    const result = await response.json();

    console.log('✅ Success! Project updated:');
    console.log(`   Project ID: ${result.id}`);
    console.log(`   Project Name: ${result.name}`);
    console.log(`   Production Branch: ${branch}`);
    console.log('');
    console.log('🚀 Next deployment will use the main branch!');
  } catch (error: any) {
    console.error('❌ Failed to set production branch:', error.message);
    process.exit(1);
  }
}

// Get project ID from command line args
const projectId = process.argv[2];

if (!projectId) {
  console.error('❌ Usage: npx ts-node scripts/set-vercel-production-branch.ts <project-id>');
  console.error('');
  console.error('Example:');
  console.error('  npx ts-node scripts/set-vercel-production-branch.ts next-js-template');
  process.exit(1);
}

setProductionBranch(projectId);
