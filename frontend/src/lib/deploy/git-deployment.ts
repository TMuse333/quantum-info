/**
 * Git Deployment Orchestrator
 * 
 * Main function that coordinates the entire git deployment workflow:
 * - Checkout production branch
 * - Write files
 * - Commit changes
 * - Create tags
 * - Push to remote
 * - Return to original branch
 */

import { checkoutProductionBranch, returnToBranch, getCurrentBranch } from './git-branch-operations';
import { writeGeneratedFiles, GeneratedFile } from './git-file-operations';
import { commitProductionBuild } from './git-commit-operations';
import { createProductionTag, getNextVersion } from './git-tag-operations';
import { pushToRemote } from './git-push-operations';
import { execGit } from './git-utils';

export interface GitOperationResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Full deployment git workflow
 *
 * @param pageFiles - Page files to deploy (page components, data files, Next.js pages)
 * @param componentFiles - Component files to deploy (design components with props)
 * @param commitMessage - Commit message
 * @param dryRun - If true, simulates deployment without executing git commands
 * @returns GitOperationResult with deployment details
 */
export async function deployToProduction(
  pageFiles: GeneratedFile[],
  componentFiles: GeneratedFile[],
  commitMessage: string,
  dryRun: boolean = false,
  force: boolean = false
): Promise<GitOperationResult> {
  const originalBranch = getCurrentBranch();
  console.log(`\n🚀 Starting git deployment workflow...`);
  console.log(`📍 Original branch: ${originalBranch}`);
  if (dryRun) {
    console.log(`🧪 DRY RUN MODE - No actual git operations will be performed\n`);
  } else {
    console.log();
  }

  try {
    const version = getNextVersion();
    const totalFiles = pageFiles.length + componentFiles.length;

    if (dryRun) {
      // DRY RUN: Just simulate and log
      console.log('📋 DRY RUN - What would happen:\n');
      console.log(`1. ✓ Would checkout/create production branch`);
      console.log(`2. ✓ Would write ${totalFiles} files to disk:`);
      console.log(`     - ${componentFiles.length} component files (with props)`);
      console.log(`     - ${pageFiles.length} page files`);

      // Show component files in detail
      console.log('\n  📦 Component Files to Deploy:');
      componentFiles.forEach((f) => {
        console.log(`     • ${f.path} (${(f.content.length / 1024).toFixed(1)}KB)`);
      });

      // Show page files
      console.log('\n  📄 Page Files to Deploy:');
      pageFiles.slice(0, 5).forEach((f) => {
        console.log(`     • ${f.path}`);
      });
      if (pageFiles.length > 5) console.log(`     ... and ${pageFiles.length - 5} more`);

      // Compare with production branch to show what would change
      console.log('\n  🔍 Checking differences vs production branch...');
      try {
        const allFiles = [...componentFiles, ...pageFiles];
        let filesChanged = 0;
        let filesNew = 0;
        let filesUnchanged = 0;

        for (const file of allFiles) {
          try {
            // Try to get file content from production branch
            const prodContent = execGit(`show production:frontend/${file.path}`, 5000);

            if (prodContent === file.content) {
              filesUnchanged++;
            } else {
              filesChanged++;
              console.log(`     🔄 CHANGED: ${file.path}`);
              console.log(`        Production: ${(prodContent.length / 1024).toFixed(1)}KB`);
              console.log(`        New: ${(file.content.length / 1024).toFixed(1)}KB`);
            }
          } catch (error: any) {
            if (error.message.includes('does not exist') || error.message.includes('exists on disk, but not in')) {
              filesNew++;
              console.log(`     ✨ NEW: ${file.path}`);
            } else {
              console.log(`     ⚠️  Could not check: ${file.path} (${error.message.split('\n')[0]})`);
            }
          }
        }

        console.log(`\n  📊 Summary:`);
        console.log(`     ${filesNew} new files`);
        console.log(`     ${filesChanged} changed files`);
        console.log(`     ${filesUnchanged} unchanged files`);

        if (filesChanged === 0 && filesNew === 0) {
          console.log('\n  ⚠️  WARNING: No actual changes detected!');
          console.log('     Git would report "no changes to commit"');
        }
      } catch (error: any) {
        console.log(`     Could not compare with production: ${error.message}`);
      }

      console.log(`\n3. ✓ Would commit with message: "${commitMessage}"`);
      console.log(`4. ✓ Would create version: v${version}`);
      console.log(`5. ✓ Would create tag: production-v${version}`);
      console.log(`6. ✓ Would push production branch to remote`);
      console.log(`7. ✓ Would push tag production-v${version} to remote`);
      console.log(`8. ✓ Would return to ${originalBranch} branch`);
      console.log('\n✅ DRY RUN complete - No changes made!\n');

      return {
        success: true,
        message: 'Dry run successful (no changes made)',
        details: {
          version,
          commitSha: 'dry-run-sha',
          tag: `production-v${version}`,
          filesDeployed: totalFiles,
          componentFiles: componentFiles.length,
          pageFiles: pageFiles.length,
          originalBranch,
          dryRun: true,
        },
      };
    }

    // REAL DEPLOYMENT
    // 1. Checkout production branch
    const checkoutResult = await checkoutProductionBranch();
    if (!checkoutResult.success) {
      throw new Error(checkoutResult.message);
    }

    // 2. Write all files (component files first, then page files)
    // This ensures component .tsx files with props are written to production branch
    const allFiles = [...componentFiles, ...pageFiles];
    const writeResult = await writeGeneratedFiles(allFiles);
    if (!writeResult.success) {
      throw new Error(writeResult.message);
    }

    // 3. Get version number
    console.log(`\n📦 Version: v${version}\n`);

    // 4. Commit (with force mode for lock file handling)
    const commitResult = await commitProductionBuild(commitMessage, version, force);
    if (!commitResult.success) {
      throw new Error(commitResult.message);
    }

    // 5. Create tag
    const tagResult = await createProductionTag(version);
    if (!tagResult.success) {
      throw new Error(tagResult.message);
    }

    // 6. Push to remote (with force mode)
    const pushResult = await pushToRemote('main', `production-v${version}`, force);
    if (!pushResult.success) {
      throw new Error(pushResult.message);
    }

    // 7. Return to original branch
    await returnToBranch(originalBranch);

    console.log('\n✅ Git deployment workflow complete!\n');
    return {
      success: true,
      message: 'Deployment successful',
      details: {
        version,
        commitSha: commitResult.details?.commitSha,
        tag: `production-v${version}`,
        filesDeployed: totalFiles,
        componentFiles: componentFiles.length,
        pageFiles: pageFiles.length,
        originalBranch,
        dryRun: false,
      },
    };
  } catch (error: any) {
    console.error('\n❌ Git deployment failed:', error.message);

    // Try to return to original branch
    try {
      await returnToBranch(originalBranch);
    } catch {
      console.error(`⚠️  Could not return to ${originalBranch}`);
    }

    return {
      success: false,
      message: `Deployment failed: ${error.message}`,
    };
  }
}

