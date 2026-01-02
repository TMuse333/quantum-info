/**
 * Git Commit Operations
 * 
 * Functions for staging and committing files:
 * - Staging files
 * - Committing changes
 * - Checking for changes
 */

import { execGit, getProjectRoot, removeLockFileIfExists } from './git-utils';

export interface GitOperationResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Commit production build
 *
 * @param message - Commit message
 * @param version - Version number (optional, for message formatting)
 * @returns GitOperationResult with commit SHA
 */
export async function commitProductionBuild(
  message: string,
  version?: number,
  force: boolean = false
): Promise<GitOperationResult> {
  try {
    console.log('💾 Committing production build...');

    // Force remove lock file before staging (aggressive)
    removeLockFileIfExists(true);

    // Stage all production files
    // Note: We stage directories, but git will only stage files that exist
    // Unnecessary files (like *Edit.tsx) should not be in production branch
    // IMPORTANT: Git runs from project root, so paths must include 'frontend/' prefix
    console.log(`\n📦 [GIT ADD] Staging files for commit...`);
    const projectRoot = getProjectRoot();
    const currentBranch = execGit('rev-parse --abbrev-ref HEAD', 5000, true, false);
    
    console.log(`   Project root: ${projectRoot}`);
    console.log(`   Current branch: ${currentBranch}`);
    console.log(`   Staging directories:`);
    console.log(`     - frontend/src/components/pageComponents`);
    console.log(`     - frontend/src/components/designs`);
    console.log(`     - frontend/src/data`);
    console.log(`     - frontend/src/app\n`);
    
    // Before staging, check what files exist
    console.log(`🔍 [GIT ADD] Checking what files exist before staging...`);
    try {
      const lsDesigns = execGit('ls-files frontend/src/components/designs/', 5000, true, false);
      const existingDesignFiles = lsDesigns.split('\n').filter(f => f.trim());
      console.log(`   Existing design files in git: ${existingDesignFiles.length}`);
      if (existingDesignFiles.length > 0) {
        existingDesignFiles.slice(0, 5).forEach(f => console.log(`     - ${f}`));
        if (existingDesignFiles.length > 5) console.log(`     ... and ${existingDesignFiles.length - 5} more`);
      }
      
      // Check what files exist on disk
      const fs = require('fs');
      const path = require('path');
      const designsDir = path.join(projectRoot, 'frontend/src/components/designs');
      if (fs.existsSync(designsDir)) {
        console.log(`   Design directory exists on disk: ${designsDir}`);
        // Try to list some files
        try {
          const walkDir = (dir: string, depth: number = 0): string[] => {
            if (depth > 3) return []; // Limit depth
            const files: string[] = [];
            const items = fs.readdirSync(dir);
            for (const item of items) {
              const fullPath = path.join(dir, item);
              const stat = fs.statSync(fullPath);
              if (stat.isDirectory()) {
                files.push(...walkDir(fullPath, depth + 1));
              } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
                files.push(fullPath);
              }
            }
            return files;
          };
          const diskFiles = walkDir(designsDir);
          console.log(`   Design files on disk: ${diskFiles.length}`);
          diskFiles.slice(0, 5).forEach(f => {
            const rel = path.relative(projectRoot, f);
            console.log(`     - ${rel}`);
          });
          if (diskFiles.length > 5) console.log(`     ... and ${diskFiles.length - 5} more`);
        } catch (e: any) {
          console.warn(`     Could not list disk files: ${e.message}`);
        }
      } else {
        console.warn(`   ⚠️  Design directory does NOT exist on disk: ${designsDir}`);
      }
    } catch (e: any) {
      console.warn(`   ⚠️  Could not check existing files: ${e.message}`);
    }
    
    execGit('add frontend/src/components/pageComponents', 30000, true, force);
    execGit('add frontend/src/components/designs', 30000, true, force);
    execGit('add frontend/src/data', 30000, true, force);
    execGit('add frontend/src/app', 30000, true, force);
    
    // Check what was actually staged
    try {
      const stagedFiles = execGit('diff --cached --name-only');
      const stagedList = stagedFiles.split('\n').filter(f => f.trim());
      console.log(`\n📋 [GIT ADD] Files staged (${stagedList.length} total):`);
      
      // Group by type
      const designFiles = stagedList.filter(f => f.includes('components/designs'));
      const pageFiles = stagedList.filter(f => f.includes('pageComponents'));
      const dataFiles = stagedList.filter(f => f.includes('/data/'));
      const appFiles = stagedList.filter(f => f.includes('/app/'));
      
      console.log(`   🎨 Design components: ${designFiles.length}`);
      if (designFiles.length > 0) {
        designFiles.forEach(f => {
          const isProd = f.includes('.prod.tsx');
          const marker = isProd ? '⚠️  (.prod.tsx - should be .tsx!)' : '✅';
          console.log(`      ${marker} ${f}`);
        });
      } else {
        console.warn(`      ⚠️  WARNING: No design component files were staged!`);
        console.warn(`      This means .prod.tsx files may not have been copied correctly.`);
      }
      
      console.log(`   📄 Page components: ${pageFiles.length}`);
      pageFiles.slice(0, 3).forEach(f => console.log(`      - ${f}`));
      if (pageFiles.length > 3) console.log(`      ... and ${pageFiles.length - 3} more`);
      
      console.log(`   📊 Data files: ${dataFiles.length}`);
      dataFiles.slice(0, 3).forEach(f => console.log(`      - ${f}`));
      if (dataFiles.length > 3) console.log(`      ... and ${dataFiles.length - 3} more`);
      
      console.log(`   🛣️  App routes: ${appFiles.length}`);
      appFiles.slice(0, 3).forEach(f => console.log(`      - ${f}`));
      if (appFiles.length > 3) console.log(`      ... and ${appFiles.length - 3} more`);
      
      if (designFiles.length === 0) {
        console.warn(`\n   ⚠️  WARNING: No design component files were staged!`);
        console.warn(`   This means .prod.tsx files may not have been copied correctly.`);
        console.warn(`   Check the file writing logs above to see if files were written.`);
        
        // Additional diagnostics
        console.log(`\n🔍 [DIAGNOSTICS] Checking why files weren't staged...`);
        try {
          const status = execGit('status --short', 5000, true, false);
          if (status) {
            console.log(`   Git status shows:`);
            status.split('\n').filter(f => f.trim()).forEach(f => console.log(`     ${f}`));
          } else {
            console.log(`   Git status is clean (no changes detected)`);
          }
        } catch (e: any) {
          console.warn(`   Could not get git status: ${e.message}`);
        }
      }
    } catch (e: any) {
      console.warn(`   ⚠️  Could not list staged files: ${e.message}`);
    }
    
    // Remove any unnecessary files that might have been staged
    // This ensures we don't commit editorial files or other non-production files
    // Note: We use git reset with pattern matching to unstage unwanted files
    try {
      // Get list of staged files matching patterns we want to exclude
      const stagedFiles = execGit('diff --cached --name-only');
      const filesToUnstage: string[] = [];
      
      stagedFiles.split('\n').forEach((file: string) => {
        if (!file.trim()) return;
        // Exclude editorial files
        if (file.includes('Edit.tsx') || file.includes('Edit.ts')) {
          filesToUnstage.push(file);
        }
        // Exclude .prod.tsx files (they should be renamed to .tsx in production)
        if (file.endsWith('.prod.tsx')) {
          filesToUnstage.push(file);
        }
        // Exclude next.config.ts to prevent server restarts
        if (file.includes('next.config.ts') || file.includes('next.config.js')) {
          filesToUnstage.push(file);
        }
      });
      
      // Unstage unwanted files
      if (filesToUnstage.length > 0) {
        console.log(`\n🧹 [GIT ADD] Unstaging ${filesToUnstage.length} unwanted files...`);
        filesToUnstage.forEach((file) => {
          try {
            execGit(`reset HEAD -- "${file}"`);
            console.log(`     - Unstaged: ${file}`);
          } catch {
            // Ignore errors for individual files
          }
        });
      }
    } catch (e: any) {
      // Ignore errors - this is a cleanup step
      console.warn(`   ⚠️  Could not clean up staged files: ${e.message}`);
    }

    // Check if there are changes to commit
    const status = execGit('status --porcelain');
    if (!status) {
      console.log('⚠️  No changes to commit');
      return {
        success: true,
        message: 'No changes to commit',
        details: { commitSha: null },
      };
    }

    // Format commit message
    const formattedMessage = version
      ? `Production build v${version}\n\n${message}\n\n🤖 Auto-generated deployment`
      : `${message}\n\n🤖 Auto-generated deployment`;

    // Commit changes
    execGit(`commit -m "${formattedMessage.replace(/"/g, '\\"')}"`);

    // Get commit SHA
    const commitSha = execGit('rev-parse HEAD');

    console.log(`✅ Committed: ${commitSha.substring(0, 7)}`);
    return {
      success: true,
      message: 'Committed production build',
      details: { commitSha },
    };
  } catch (error: any) {
    console.error('❌ Failed to commit:', error.message);
    return {
      success: false,
      message: `Failed to commit: ${error.message}`,
    };
  }
}

