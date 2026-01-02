/**
 * GitHub API Deployment Operations
 *
 * This module uses the GitHub API to deploy files to the production branch.
 * Benefits over git CLI:
 * - No file system changes (all happens in memory)
 * - No server restarts (Next.js file watcher not triggered)
 * - Works in browser/production context (no git commands needed)
 * - Proper timeouts (network requests have built-in timeout handling)
 */

import { Octokit } from '@octokit/rest';
import type { ComponentFileContent } from './copyComponents';
import { filterFilesForProduction, logFilterResults } from './production-filter';
import { generateAllPageFiles } from './generators/generatePageFiles';
import { GITHUB_CONFIG } from '@/lib/config';
import * as fs from 'fs';
import * as path from 'path';

// Use dynamic configuration from environment variables (set by parent repo via Vercel)
const GITHUB_OWNER = GITHUB_CONFIG.REPO_OWNER;
const GITHUB_REPO = GITHUB_CONFIG.REPO_NAME;
const PRODUCTION_BRANCH = GITHUB_CONFIG.PRODUCTION_BRANCH;

export interface GitHubDeployResult {
  success: boolean;
  message: string;
  details?: {
    commitSha?: string;
    commitUrl?: string;
    tagName?: string;
    tagUrl?: string;
    version?: number;
    filesDeployed?: number;
    componentFiles?: number;
    pageFiles?: number;
  };
  error?: string;
}

/**
 * Collect required utility files that components depend on
 * These files must be included in production deployment
 * 
 * NOTE: This function uses Node.js fs/path APIs which are safe here because:
 * - This file is only imported in Next.js API routes (server-side only)
 * - API routes run in Node.js environment, not in the browser
 * - No "use client" directive means this is server-side code
 */
function collectRequiredUtilityFiles(): ComponentFileContent[] {
  // Runtime check: ensure we're in a Node.js environment
  if (typeof window !== 'undefined') {
    console.error('❌ [ERROR] collectRequiredUtilityFiles() called in browser context!');
    console.error('   This function requires Node.js fs/path APIs and should only run server-side.');
    return [];
  }

  const utilityFiles: ComponentFileContent[] = [];
  const projectRoot = process.cwd();

  // Required utility directories that production components depend on
  // Only include essential files for production components
  const requiredDirs = [
    'frontend/src/lib/hooks',      // If running from project root
    'frontend/src/lib/colorUtils',
    'frontend/src/types',           // CRITICAL: Components import from @/types
    'src/lib/hooks',                // If running from frontend/ directory
    'src/lib/colorUtils',
    'src/types',
  ];

  // Files to exclude from deployment
  const excludedFiles = [
    'hooks.ts',                     // Only need isMobile.ts
    'llmOutputs.ts',                // Not needed for production
    'templateTypes.ts',             // Not needed for production
    'usage.ts',                     // Not needed for production
    'user.ts',                      // Not needed for production
    'website.ts',                   // Not needed for production
    'helperBot.ts',                 // Not needed for production
    'mainRegistry.ts',              // Registry file not needed for production
    'websiteDataTypes.ts',          // Editorial-only, not needed for production
  ];

  // console.log('\n📦 [UTILITIES] Collecting required utility files...');
  // console.log(`   Working directory: ${projectRoot}`);

  // Track which directories we've already processed (avoid duplicates)
  const processedDirs = new Set<string>();

  for (const dir of requiredDirs) {
    const fullDirPath = path.join(projectRoot, dir);
    const normalizedPath = path.normalize(fullDirPath);

    // Skip if we've already processed this directory
    if (processedDirs.has(normalizedPath)) {
      continue;
    }

    if (!fs.existsSync(fullDirPath)) {
      // Only warn if it's a frontend/ path (expected), not src/ (might not exist)
      if (dir.startsWith('frontend/')) {
        // Try the alternative path silently
        continue;
      }
      continue;
    }

    processedDirs.add(normalizedPath);

    // Read all files in the directory recursively
    function readDirRecursive(dirPath: string) {
      try {
        const files = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const file of files) {
          const fullPath = path.join(dirPath, file.name);

          if (file.isDirectory()) {
            // Recursively read subdirectories (e.g., types/registry/)
            readDirRecursive(fullPath);
          } else if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.js'))) {
            // Skip excluded files
            if (excludedFiles.includes(file.name)) {
              continue;
            }

            // For hooks directory, only include isMobile.ts
            if (dirPath.includes('/lib/hooks/') && file.name !== 'isMobile.ts') {
              continue;
            }

            // Exclude registry folder files (not needed for production)
            if (dirPath.includes('/types/registry/') || file.name === 'mainRegistry.ts') {
              continue;
            }

            let relativePath = path.relative(projectRoot, fullPath);

            // ENSURE path starts with 'frontend/' prefix
            // Repository structure: frontend/src/..., scripts/, etc.
            // Files must be at frontend/src/... to be in the correct location
            // Vercel root directory is set to 'frontend' in project settings
            if (!relativePath.startsWith('frontend/')) {
              relativePath = `frontend/${relativePath}`;
            }

            // Skip if already added (avoid duplicates)
            if (utilityFiles.some(f => f.path === relativePath)) {
              continue;
            }

            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              utilityFiles.push({
                path: relativePath,
                content,
              });
              // console.log(`  ✓ ${relativePath}`);
            } catch (error: any) {
              console.warn(`  ⚠️  Failed to read ${relativePath}: ${error.message}`);
            }
          }
        }
      } catch (error: any) {
        console.warn(`  ⚠️  Failed to read directory ${dirPath}: ${error.message}`);
      }
    }

    readDirRecursive(fullDirPath);
    // console.log(`  ✓ Processed: ${dir}`);
  }

  // console.log(`✅ Collected ${utilityFiles.length} utility file(s)\n`);
  return utilityFiles;
}

/**
 * Collect critical configuration files for production
 * These files must be included with their current content
 */
function collectCriticalConfigFiles(): ComponentFileContent[] {
  const configFiles: ComponentFileContent[] = [];
  const projectRoot = process.cwd();

  // Critical config files - process each type separately to avoid duplicates
  const processedTypes = new Set<string>();

  // List of config files to check (in priority order)
  const criticalFiles = [
    { path: 'frontend/next.config.ts', type: 'nextconfig' },
    { path: 'next.config.ts', type: 'nextconfig' },
    { path: 'frontend/package.json', type: 'package' },
    { path: 'package.json', type: 'package' },
    { path: 'frontend/tsconfig.json', type: 'tsconfig' },
    { path: 'tsconfig.json', type: 'tsconfig' },
    { path: 'frontend/.nvmrc', type: 'nvmrc' },
    { path: '.nvmrc', type: 'nvmrc' },
  ];

  for (const { path: filePath, type } of criticalFiles) {
    // Skip if we already processed this type
    if (processedTypes.has(type)) continue;

    const fullPath = path.join(projectRoot, filePath);

    if (fs.existsSync(fullPath)) {
      try {
        let content = fs.readFileSync(fullPath, 'utf-8');

        // For next.config.ts, create production-safe version
        if (type === 'nextconfig') {
          // Remove invalid 'eslint' property (not supported in Next.js 16)
          // Create clean production config
          const productionConfig = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
`;
          content = productionConfig;
          console.log('  ✓ Generated production-safe next.config.ts (removed invalid eslint property)');
        }

        // Ensure path has frontend/ prefix
        const relativePath = path.relative(projectRoot, fullPath);
        const normalizedPath = relativePath.startsWith('frontend/')
          ? relativePath
          : `frontend/${relativePath}`;

        configFiles.push({
          path: normalizedPath,
          content,
        });

        // Mark this type as processed
        processedTypes.add(type);
        console.log(`  ✓ Added ${type}: ${normalizedPath}`);
      } catch (error: any) {
        console.warn(`  ⚠️  Failed to read ${filePath}: ${error.message}`);
      }
    }
  }

  // Create production-safe types/index.ts
  const typesIndexPath = path.join(projectRoot, 'frontend/src/types/index.ts');
  if (fs.existsSync(typesIndexPath)) {
    try {
      const originalContent = fs.readFileSync(typesIndexPath, 'utf-8');
      
      // Create production-safe version that only exports from included files
      const productionTypesIndex = `// Production-safe types index
// Only exports from files that exist in production deployment

export * from './colors';
export * from './componentTypes';
export * from './forms';
export * from './navbar';

// Note: Excluded from production:
// - websiteDataTypes.ts (editorial-only)
// - templateTypes.ts (editorial-only)
// - llmOutputs.ts (editorial-only)
// - user.ts (editorial-only)
// - website.ts (editorial-only)
// - helperBot.ts (editorial-only)
// - usage.ts (editorial-only)
`;
      
      configFiles.push({
        path: 'frontend/src/types/index.ts',
        content: productionTypesIndex,
      });
    } catch (error: any) {
      console.warn(`  ⚠️  Failed to create production types/index.ts: ${error.message}`);
    }
  }

  return configFiles;
}

/**
 * Get next version number by checking existing production tags
 */
async function getNextVersion(octokit: Octokit): Promise<number> {
  try {
    const { data: tags } = await octokit.repos.listTags({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      per_page: 100,
    });

    // Filter production tags and extract version numbers
    const versionNumbers = tags
      .filter((tag) => tag.name.startsWith('production-v'))
      .map((tag) => {
        const match = tag.name.match(/production-v(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((v) => v > 0);

    // Return next version number
    return versionNumbers.length > 0 ? Math.max(...versionNumbers) + 1 : 1;
  } catch (error: any) {
    // console.warn('⚠️  Failed to fetch tags, defaulting to version 1:', error.message);
    return 1;
  }
}

/**
 * Deploy to production using GitHub API
 *
 * This approach:
 * 1. Gets current production branch SHA
 * 2. Creates blobs for each file in memory
 * 3. Creates a new tree with the blobs
 * 4. Creates a new commit
 * 5. Updates the production branch reference
 * 6. Creates a tag
 *
 * No file system changes, no server restarts!
 *
 * @param componentFiles - Component files to deploy
 * @param pageFiles - Page files to deploy
 * @param commitMessage - Commit message
 * @param dryRun - If true, only simulate the deployment
 * @returns GitHubDeployResult with details
 */
export async function deployToProductionViaAPI(
  componentFiles: ComponentFileContent[],
  pageFiles: ComponentFileContent[],
  commitMessage: string,
  dryRun: boolean = false
): Promise<GitHubDeployResult> {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🔍 FILE COLLECTION & FILTERING');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📥 Input files received:');
  console.log(`   Component files: ${componentFiles.length}`);
  if (componentFiles.length > 0) {
    console.log(`   Sample component paths:`);
    componentFiles.slice(0, 3).forEach(f => {
      console.log(`      - ${f.path}`);
    });
  }
  console.log(`   Page files: ${pageFiles.length}`);
  if (pageFiles.length > 0) {
    console.log(`   Sample page paths:`);
    pageFiles.slice(0, 3).forEach(f => {
      console.log(`      - ${f.path}`);
    });
  }
  console.log('');

  // Collect required utility files (hooks, colorUtils, etc.)
  console.log('📦 Collecting utility files (hooks, colorUtils, types)...');
  const utilityFiles = collectRequiredUtilityFiles();
  console.log(`   ✅ Collected ${utilityFiles.length} utility files\n`);

  // Collect critical config files (next.config.ts, package.json, etc.)
  console.log('📦 Collecting critical config files...');
  const configFiles = collectCriticalConfigFiles();
  console.log(`   ✅ Collected ${configFiles.length} config files\n`);

  // Combine all files (components + pages + utilities + config)
  const allInputFiles = [...componentFiles, ...pageFiles, ...utilityFiles, ...configFiles];

  console.log(`📊 Total input files: ${allInputFiles.length}`);
  console.log(`   - Components: ${componentFiles.length}`);
  console.log(`   - Pages: ${pageFiles.length}`);
  console.log(`   - Utilities: ${utilityFiles.length}`);
  console.log(`   - Config files: ${configFiles.length}\n`);

  // Apply comprehensive production filter to exclude editor/admin/build-breaking routes
  console.log('🔍 Applying production filter...');
  const filterResult = filterFilesForProduction(allInputFiles);
  const allFiles = filterResult.included;

  // Log filtering results
  logFilterResults(filterResult.stats);

  // Show sample of excluded files for verification
  if (filterResult.excluded.length > 0) {
    console.log('\n📋 Sample of EXCLUDED files (editorial-only):');
    const sampleExcluded = filterResult.excluded.slice(0, 10);
    sampleExcluded.forEach(f => {
      console.log(`   ⊗ ${f.path}`);
    });
    if (filterResult.excluded.length > 10) {
      console.log(`   ... and ${filterResult.excluded.length - 10} more excluded files`);
    }
    console.log('');
  }

  // Detailed breakdown of what's being deployed
  console.log(`\n📦 Files to deploy: ${allFiles.length}`);
  const frontendCount = allFiles.filter(f => f.path.startsWith('frontend/')).length;
  const srcCount = allFiles.filter(f => f.path.startsWith('src/')).length;
  const otherCount = allFiles.length - frontendCount - srcCount;
  console.log(`   - frontend/: ${frontendCount} files`);
  console.log(`   - src/: ${srcCount} files`);
  console.log(`   - other: ${otherCount} files`);
  
  if (frontendCount === 0 && allFiles.length > 0) {
    console.log(`\n   ⚠️  WARNING: No files with 'frontend/' prefix!`);
    console.log(`   ⚠️  This might be why the frontend folder isn't updating!`);
    console.log(`   ⚠️  Sample paths:`);
    allFiles.slice(0, 5).forEach(f => {
      console.log(`      - ${f.path}`);
    });
  }
  console.log('');

  // Verify environment variable
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return {
      success: false,
      message: 'GITHUB_TOKEN environment variable not set',
      error: 'Missing GITHUB_TOKEN - see setup instructions in GITHUB_API_EXAMPLE.md',
    };
  }

  const octokit = new Octokit({ auth: githubToken });

  if (dryRun) {
    console.log('\n🧪 DRY RUN MODE - GitHub API Deployment Simulation\n');
    console.log(`  Branch: ${PRODUCTION_BRANCH}`);
    console.log(`  Files: ${allFiles.length} (after filtering)`);
    console.log(`  Frontend files: ${allFiles.filter(f => f.path.startsWith('frontend/')).length}`);
    console.log(`  Excluded: ${filterResult.excluded.length} editor/admin/build-breaking routes`);
    console.log('\nNo API calls made in dry run mode.\n');

    return {
      success: true,
      message: 'Dry run successful - production-safe code only',
      details: {
        filesDeployed: allFiles.length,
        componentFiles: filterResult.stats.included,
        pageFiles: 0,
        version: 0,
      },
    };
  }

  try {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🚀 GITHUB API DEPLOYMENT - STEP BY STEP');
    console.log('═══════════════════════════════════════════════════════════\n');

    // STEP 0: Log what we're deploying
    console.log('📋 STEP 0: Files to deploy');
    console.log(`   Total files: ${allFiles.length}`);
    console.log(`   Components: ${componentFiles.length}`);
    console.log(`   Pages: ${pageFiles.length}`);
    console.log(`   Utilities: ${utilityFiles.length}`);
    
    // Show file path breakdown
    const pathBreakdown: Record<string, number> = {};
    allFiles.forEach(f => {
      const prefix = f.path.split('/')[0];
      pathBreakdown[prefix] = (pathBreakdown[prefix] || 0) + 1;
    });
    console.log(`   Path breakdown:`);
    Object.entries(pathBreakdown).forEach(([prefix, count]) => {
      console.log(`      ${prefix}/: ${count} files`);
    });
    
    // Show sample frontend files
    const frontendFiles = allFiles.filter(f => f.path.startsWith('frontend/'));
    console.log(`\n   Frontend files (${frontendFiles.length}):`);
    frontendFiles.slice(0, 10).forEach(f => {
      console.log(`      ✓ ${f.path}`);
    });
    if (frontendFiles.length > 10) {
      console.log(`      ... and ${frontendFiles.length - 10} more`);
    }
    console.log('');

    // 1. Get current production branch reference
    console.log('📌 STEP 1: Get current branch reference');
    console.log(`   Branch: ${PRODUCTION_BRANCH}`);
    console.log(`   Owner: ${GITHUB_OWNER}`);
    console.log(`   Repo: ${GITHUB_REPO}`);
    const { data: ref } = await octokit.git.getRef({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      ref: `heads/${PRODUCTION_BRANCH}`,
    });
    const currentSha = ref.object.sha;
    console.log(`   ✅ Current SHA: ${currentSha.substring(0, 7)} (${currentSha})`);
    console.log(`   ✅ Ref URL: ${ref.url}\n`);

    // 2. Get current commit to get base tree
    console.log('📌 STEP 2: Get base tree from current commit');
    const { data: currentCommit } = await octokit.git.getCommit({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      commit_sha: currentSha,
    });
    const baseTreeSha = currentCommit.tree.sha;
    console.log(`   ✅ Base tree SHA: ${baseTreeSha.substring(0, 7)} (${baseTreeSha})`);
    console.log(`   ✅ Commit message: ${currentCommit.message.split('\n')[0]}\n`);

    // 3. Create blobs for each file
    console.log(`📌 STEP 3: Create blobs for ${allFiles.length} files`);
    const tree: Array<{ path: string; mode: '100644'; type: 'blob'; sha: string }> = [];
    
    for (let index = 0; index < allFiles.length; index++) {
      const file = allFiles[index];
      
      // Log every frontend file (critical for debugging)
      if (file.path.startsWith('frontend/')) {
        console.log(`   📄 [${index + 1}/${allFiles.length}] ${file.path} (${(file.content.length / 1024).toFixed(1)}KB)`);
      }

      const { data: blob } = await octokit.git.createBlob({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        content: Buffer.from(file.content).toString('base64'),
        encoding: 'base64',
      });

      const relativePath = file.path;
      tree.push({
        path: relativePath,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blob.sha,
      });
    }
    
    console.log(`   ✅ Created ${tree.length} blobs`);
    console.log(`   ✅ Frontend blobs: ${tree.filter(t => t.path.startsWith('frontend/')).length}`);
    console.log('');

    // 4. Create new tree
    console.log('📌 STEP 4: Create new tree with base_tree + new files');
    console.log(`   Base tree: ${baseTreeSha.substring(0, 7)}`);
    console.log(`   New files: ${tree.length}`);
    console.log(`   Tree entries (first 10):`);
    tree.slice(0, 10).forEach(t => {
      console.log(`      ${t.path} → ${t.sha.substring(0, 7)}`);
    });
    if (tree.length > 10) {
      console.log(`      ... and ${tree.length - 10} more`);
    }
    
    const { data: newTree } = await octokit.git.createTree({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      base_tree: baseTreeSha,
      tree,
    });
    console.log(`   ✅ New tree SHA: ${newTree.sha.substring(0, 7)} (${newTree.sha})`);
    console.log(`   ✅ Tree URL: ${newTree.url}\n`);

    // 5. Get version number
    console.log('📌 STEP 5: Get next version number');
    const version = await getNextVersion(octokit);
    console.log(`   ✅ Version: v${version}\n`);

    // 6. Create new commit
    console.log('📌 STEP 6: Create new commit');
    const fullCommitMessage = `${commitMessage}\n\nVersion: production-v${version}\nDeployed via GitHub API`;
    console.log(`   Message: ${fullCommitMessage.split('\n')[0]}`);
    console.log(`   Tree: ${newTree.sha.substring(0, 7)}`);
    console.log(`   Parent: ${currentSha.substring(0, 7)}`);
    
    const { data: newCommit } = await octokit.git.createCommit({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      message: fullCommitMessage,
      tree: newTree.sha,
      parents: [currentSha],
    });
    console.log(`   ✅ Commit SHA: ${newCommit.sha.substring(0, 7)} (${newCommit.sha})`);
    const commitUrl = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/commit/${newCommit.sha}`;
    console.log(`   ✅ URL: ${commitUrl}\n`);

    // 7. Update production branch reference
    console.log('📌 STEP 7: Update branch reference');
    console.log(`   Branch: ${PRODUCTION_BRANCH}`);
    console.log(`   Old SHA: ${currentSha.substring(0, 7)}`);
    console.log(`   New SHA: ${newCommit.sha.substring(0, 7)}`);
    
    await octokit.git.updateRef({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      ref: `heads/${PRODUCTION_BRANCH}`,
      sha: newCommit.sha,
      force: false,
    });
    console.log(`   ✅ Branch ${PRODUCTION_BRANCH} updated successfully!`);
    console.log(`   ✅ View at: https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/tree/${PRODUCTION_BRANCH}\n`);

    // 8. Create tag
    // console.log('7️⃣  Creating tag...');
    const tagName = `production-v${version}`;

    // Check if tag already exists
    try {
      await octokit.git.getRef({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        ref: `tags/${tagName}`,
      });
      // console.log(`   ⚠️  Tag ${tagName} already exists, skipping...`);
    } catch (error: any) {
      if (error.status === 404) {
        // Tag doesn't exist, create it
        const { data: newTag } = await octokit.git.createTag({
          owner: GITHUB_OWNER,
          repo: GITHUB_REPO,
          tag: tagName,
          message: `Production release v${version}`,
          object: newCommit.sha,
          type: 'commit',
        });

        // Create reference for the tag
        await octokit.git.createRef({
          owner: GITHUB_OWNER,
          repo: GITHUB_REPO,
          ref: `refs/tags/${tagName}`,
          sha: newTag.sha,
        });

        // const tagUrl = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/tag/${tagName}`;
        // console.log(`   ✓ Tag created: ${tagName}`);
        // console.log(`   ✓ URL: ${tagUrl}`);
      } else {
        throw error;
      }
    }

    console.log('\n✅ Deployment successful via GitHub API!\n');

    return {
      success: true,
      message: 'Deployed successfully via GitHub API',
      details: {
        commitSha: newCommit.sha,
        commitUrl,
        tagName,
        tagUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/tag/${tagName}`,
        version,
        filesDeployed: allFiles.length,
        componentFiles: componentFiles.length,
        pageFiles: pageFiles.length,
      },
    };
  } catch (error: any) {
    console.error('❌ GitHub API deployment failed:', error);

    // Provide helpful error messages
    let errorMessage = error.message || 'Unknown error';
    if (error.status === 401) {
      errorMessage = 'GitHub authentication failed - check GITHUB_TOKEN';
    } else if (error.status === 403) {
      errorMessage = 'GitHub API rate limit exceeded or insufficient permissions';
    } else if (error.status === 404) {
      errorMessage = `Repository or branch not found: ${GITHUB_OWNER}/${GITHUB_REPO}/${PRODUCTION_BRANCH}`;
    }

    return {
      success: false,
      message: 'Deployment failed',
      error: errorMessage,
    };
  }
}

/**
 * Save production snapshot to GitHub
 * Stores websiteData.json snapshot in production-snapshots/ folder
 *
 * @param websiteData - The website data to snapshot
 * @param version - Version number for the snapshot
 * @param commitSha - The production deployment commit SHA
 * @returns Success/failure result
 */
export async function saveProductionSnapshot(
  websiteData: any,
  version: number,
  commitSha: string
): Promise<{ success: boolean; message: string; error?: string }> {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return {
      success: false,
      message: 'GITHUB_TOKEN not set',
      error: 'Missing GITHUB_TOKEN environment variable',
    };
  }

  const octokit = new Octokit({ auth: githubToken });

  try {
    // console.log(`📸 [SNAPSHOT] Creating production snapshot for v${version}...`);

    // 1. Get current production branch reference
    const { data: ref } = await octokit.git.getRef({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      ref: `heads/${PRODUCTION_BRANCH}`,
    });
    const currentSha = ref.object.sha;

    // 2. Get current commit to get base tree
    const { data: currentCommit } = await octokit.git.getCommit({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      commit_sha: currentSha,
    });
    const baseTreeSha = currentCommit.tree.sha;

    // 3. Create snapshot metadata
    const snapshotMetadata = {
      version,
      timestamp: new Date().toISOString(),
      commitSha,
      websiteData,
    };

    // 4. Create blob for snapshot file
    // Path WITH 'frontend/' prefix to match repository structure
    const snapshotPath = `frontend/production-snapshots/v${version}.json`;
    const snapshotContent = JSON.stringify(snapshotMetadata, null, 2);

    const { data: blob } = await octokit.git.createBlob({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      content: Buffer.from(snapshotContent).toString('base64'),
      encoding: 'base64',
    });

    // console.log(`   ✓ Created snapshot blob for ${snapshotPath}`);

    // 5. Create new tree with snapshot file
    const { data: newTree } = await octokit.git.createTree({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      base_tree: baseTreeSha,
      tree: [
        {
          path: snapshotPath,
          mode: '100644',
          type: 'blob',
          sha: blob.sha,
        },
      ],
    });

    // console.log(`   ✓ Created tree with snapshot`);

    // 6. Create commit for snapshot
    // IMPORTANT: [vercel skip] tells Vercel to ignore this commit and not trigger a deployment
    // This prevents double deployments (one for the actual code, one for the snapshot)
    const snapshotCommitMessage = `Save production snapshot v${version} [vercel skip]\n\nSnapshot of websiteData.json for production-v${version}`;
    const { data: newCommit } = await octokit.git.createCommit({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      message: snapshotCommitMessage,
      tree: newTree.sha,
      parents: [currentSha],
    });

    // console.log(`   ✓ Created snapshot commit: ${newCommit.sha.substring(0, 7)}`);

    // 7. Update production branch with snapshot commit
    await octokit.git.updateRef({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      ref: `heads/${PRODUCTION_BRANCH}`,
      sha: newCommit.sha,
      force: false,
    });

    // console.log(`✅ [SNAPSHOT] Snapshot v${version} saved successfully`);

    return {
      success: true,
      message: `Snapshot v${version} saved to ${snapshotPath}`,
    };
  } catch (error: any) {
    // console.error(`❌ [SNAPSHOT] Failed to save snapshot v${version}:`, error);

    // Don't fail deployment if snapshot fails
    return {
      success: false,
      message: 'Snapshot save failed (non-critical)',
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Regenerate .data.ts files from a production snapshot
 *
 * This function:
 * 1. Fetches the specified snapshot from the production branch
 * 2. Regenerates all .data.ts files from the snapshot's websiteData
 * 3. Commits the regenerated files back to main branch
 *
 * This ensures .data.ts files are always in sync with the production snapshot.
 */
export async function regenerateDataFilesFromSnapshot(
  version: number
): Promise<{ success: boolean; message: string; error?: string; commitSha?: string }> {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return {
      success: false,
      message: 'GITHUB_TOKEN not set',
      error: 'Missing GITHUB_TOKEN environment variable',
    };
  }

  const octokit = new Octokit({ auth: githubToken });

  try {
    console.log(`🔄 [REGENERATE] Fetching snapshot v${version} to regenerate .data.ts files...`);

    // 1. Fetch the snapshot from production branch
    const snapshotPath = `frontend/production-snapshots/v${version}.json`;
    const { data: snapshotFile } = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: snapshotPath,
      ref: PRODUCTION_BRANCH,
    });

    if (!('content' in snapshotFile) || !snapshotFile.content) {
      throw new Error('Snapshot file content not found');
    }

    // 2. Decode and parse snapshot
    const snapshotContent = Buffer.from(snapshotFile.content, 'base64').toString('utf-8');
    const snapshot = JSON.parse(snapshotContent);
    const websiteData = snapshot.websiteData;

    if (!websiteData) {
      throw new Error('websiteData not found in snapshot');
    }

    console.log(`   ✓ Retrieved snapshot v${version} with ${Object.keys(websiteData.pages || {}).length} pages`);

    // 3. Regenerate .data.ts files from snapshot's websiteData
    const seoMetadata: Record<string, any> = {};
    const allGeneratedFiles = generateAllPageFiles(websiteData, seoMetadata);

    // Filter to only include .data.ts files
    const dataFiles = allGeneratedFiles.filter(file => file.path.endsWith('.data.ts'));

    console.log(`   ✓ Regenerated ${dataFiles.length} .data.ts files from snapshot`);

    // 4. Get current main branch reference
    const { data: ref } = await octokit.git.getRef({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      ref: `heads/${PRODUCTION_BRANCH}`,
    });
    const currentSha = ref.object.sha;

    // 5. Get current commit to get base tree
    const { data: currentCommit } = await octokit.git.getCommit({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      commit_sha: currentSha,
    });
    const baseTreeSha = currentCommit.tree.sha;

    // 6. Create blobs for all .data.ts files
    const blobPromises = dataFiles.map(async (file) => {
      const { data: blob } = await octokit.git.createBlob({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        content: Buffer.from(file.content).toString('base64'),
        encoding: 'base64',
      });
      return { path: file.path, sha: blob.sha };
    });

    const blobs = await Promise.all(blobPromises);
    console.log(`   ✓ Created ${blobs.length} blobs for .data.ts files`);

    // 7. Create new tree with all .data.ts files
    const { data: newTree } = await octokit.git.createTree({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      base_tree: baseTreeSha,
      tree: blobs.map(blob => ({
        path: blob.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blob.sha,
      })),
    });

    console.log(`   ✓ Created tree with ${dataFiles.length} .data.ts files`);

    // 8. Create commit for regenerated files
    const commitMessage = `Sync .data.ts files with production snapshot v${version} [vercel skip]\n\nRegenerated ${dataFiles.length} .data.ts files from production-snapshots/v${version}.json to ensure data consistency.`;
    const { data: newCommit } = await octokit.git.createCommit({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      message: commitMessage,
      tree: newTree.sha,
      parents: [currentSha],
    });

    console.log(`   ✓ Created commit: ${newCommit.sha.substring(0, 7)}`);

    // 9. Update main branch with new commit
    await octokit.git.updateRef({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      ref: `heads/${PRODUCTION_BRANCH}`,
      sha: newCommit.sha,
      force: false,
    });

    console.log(`✅ [REGENERATE] Successfully synced ${dataFiles.length} .data.ts files with snapshot v${version}`);

    return {
      success: true,
      message: `Regenerated ${dataFiles.length} .data.ts files from snapshot v${version}`,
      commitSha: newCommit.sha,
    };
  } catch (error: any) {
    console.error(`❌ [REGENERATE] Failed to regenerate .data.ts files from snapshot v${version}:`, error);

    return {
      success: false,
      message: 'Failed to regenerate .data.ts files from snapshot',
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Verify GitHub token and repository access
 * Useful for testing setup before actual deployment
 */
export async function verifyGitHubAccess(): Promise<GitHubDeployResult> {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return {
      success: false,
      message: 'GITHUB_TOKEN not set',
      error: 'Missing GITHUB_TOKEN environment variable',
    };
  }

  const octokit = new Octokit({ auth: githubToken });

  try {
    // Check repository access
    const { data: repo } = await octokit.repos.get({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
    });

    // Check production branch exists
    const { data: ref } = await octokit.git.getRef({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      ref: `heads/${PRODUCTION_BRANCH}`,
    });

    return {
      success: true,
      message: 'GitHub access verified',
      details: {
        commitSha: ref.object.sha,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'GitHub access verification failed',
      error: error.message,
    };
  }
}
