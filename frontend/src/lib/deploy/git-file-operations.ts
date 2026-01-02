/**
 * Git File Operations
 * 
 * Functions for writing files to disk before committing:
 * - Writing generated files
 * - Creating directories
 * - File path resolution
 */

import * as fs from 'fs';
import * as path from 'path';
import { getProjectRoot, execGit } from './git-utils';

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface GitOperationResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Write generated files to disk
 *
 * @param files - Array of files to write
 * @returns GitOperationResult with success status
 */
export async function writeGeneratedFiles(
  files: GeneratedFile[]
): Promise<GitOperationResult> {
  try {
    console.log(`📝 Writing ${files.length} files to disk...`);

    let writtenCount = 0;
    const errors: string[] = [];

    const projectRoot = getProjectRoot();
    const currentBranch = execGit('rev-parse --abbrev-ref HEAD', 5000, true, false);
    
    console.log(`\n📝 [WRITE FILES] Writing ${files.length} files to production branch...`);
    console.log(`   Project root: ${projectRoot}`);
    console.log(`   Current branch: ${currentBranch}`);
    console.log(`   Files to write:\n`);
    
    // Group files by type for better logging
    const componentFiles = files.filter(f => f.path.includes('components/designs'));
    const pageFiles = files.filter(f => f.path.includes('pageComponents'));
    const dataFiles = files.filter(f => f.path.includes('/data/'));
    const appFiles = files.filter(f => f.path.includes('/app/'));
    
    console.log(`   📊 File breakdown:`);
    console.log(`      🎨 Component files: ${componentFiles.length}`);
    console.log(`      📄 Page components: ${pageFiles.length}`);
    console.log(`      📊 Data files: ${dataFiles.length}`);
    console.log(`      🛣️  App routes: ${appFiles.length}\n`);
    
    for (const file of files) {
      try {
        // Skip next.config.ts to prevent server restarts
        if (file.path.includes('next.config.ts') || file.path.includes('next.config.js')) {
          console.log(`  ⏭️  Skipping ${file.path} (prevents server restart)`);
          continue;
        }

        // Files are written relative to project root
        // file.path already includes 'frontend/' prefix (from generatePageFiles or copyComponents)
        const fullPath = path.join(projectRoot, file.path);
        const dir = path.dirname(fullPath);

        // Log component files specifically
        if (file.path.includes('components/designs')) {
          console.log(`  🎨 [COMPONENT FILE] ${file.path}`);
          console.log(`     Full path: ${fullPath}`);
          console.log(`     Directory: ${dir}`);
          console.log(`     Directory exists: ${fs.existsSync(dir)}`);
          console.log(`     File size: ${(file.content.length / 1024).toFixed(1)}KB`);
          
          // Check if file already exists and is identical
          if (fs.existsSync(fullPath)) {
            const existingContent = fs.readFileSync(fullPath, 'utf-8');
            if (existingContent === file.content) {
              console.log(`     ⚠️  File already exists and is identical (no change needed)`);
            } else {
              console.log(`     🔄 File exists but content differs (will overwrite)`);
              console.log(`        Existing: ${(existingContent.length / 1024).toFixed(1)}KB`);
              console.log(`        New: ${(file.content.length / 1024).toFixed(1)}KB`);
            }
          } else {
            console.log(`     ✨ New file (doesn't exist yet)`);
          }
        }

        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
          console.log(`     📁 Creating directory: ${dir}`);
          fs.mkdirSync(dir, { recursive: true });
        }

        // Write file
        fs.writeFileSync(fullPath, file.content, 'utf-8');
        writtenCount++;
        
        // Verify file was written
        if (!fs.existsSync(fullPath)) {
          throw new Error(`File was not created at ${fullPath}`);
        }
        
        const writtenContent = fs.readFileSync(fullPath, 'utf-8');
        if (writtenContent !== file.content) {
          throw new Error(`File content mismatch after writing`);
        }
        
        if (file.path.includes('components/designs')) {
          console.log(`     ✅ Written to production: ${fullPath}`);
          console.log(`     ✅ Production path: ${file.path}`);
          console.log(`     ✅ Verified: File exists and content matches\n`);
        } else {
          console.log(`  ✅ ${file.path}`);
        }
      } catch (error: any) {
        errors.push(`${file.path}: ${error.message}`);
        console.error(`  ❌ ${file.path}: ${error.message}`);
        if (file.path.includes('components/designs')) {
          console.error(`     Full path attempted: ${path.join(projectRoot, file.path)}`);
        }
      }
    }
    
    console.log(`\n📊 [WRITE FILES] Summary:`);
    console.log(`   Files written: ${writtenCount}`);
    console.log(`   Errors: ${errors.length}`);
    if (errors.length > 0) {
      errors.forEach(e => console.error(`     ❌ ${e}`));
    }
    
    // After writing, check what git sees
    console.log(`\n🔍 [WRITE FILES] Checking what git sees...`);
    try {
      const gitStatus = execGit('status --porcelain', 5000, true, false);
      if (gitStatus) {
        const changedFiles = gitStatus.split('\n').filter(f => f.trim());
        console.log(`   Git sees ${changedFiles.length} changed/untracked files:`);
        changedFiles.slice(0, 10).forEach(f => console.log(`     - ${f}`));
        if (changedFiles.length > 10) console.log(`     ... and ${changedFiles.length - 10} more`);
        
        const designChanges = changedFiles.filter(f => f.includes('components/designs'));
        console.log(`   🎨 Design component changes: ${designChanges.length}`);
        if (designChanges.length === 0) {
          console.warn(`   ⚠️  WARNING: Git doesn't see any design component file changes!`);
          console.warn(`   This could mean:`);
          console.warn(`     1. Files are identical to what's already in production`);
          console.warn(`     2. Files weren't written to the correct location`);
          console.warn(`     3. Git is looking in the wrong directory`);
        }
      } else {
        console.warn(`   ⚠️  Git reports no changes (status --porcelain returned empty)`);
        console.warn(`   This means all files are identical to what's in the current branch.`);
      }
    } catch (e: any) {
      console.warn(`   ⚠️  Could not check git status: ${e.message}`);
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: `Failed to write ${errors.length} files`,
        details: { written: writtenCount, errors },
      };
    }

    console.log(`✅ Successfully wrote ${writtenCount} files`);
    return {
      success: true,
      message: `Wrote ${writtenCount} files`,
      details: { written: writtenCount },
    };
  } catch (error: any) {
    console.error('❌ Failed to write files:', error.message);
    return {
      success: false,
      message: `Failed to write files: ${error.message}`,
    };
  }
}

