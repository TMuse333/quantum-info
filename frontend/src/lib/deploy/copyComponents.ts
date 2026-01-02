/**
 * Component Copy Utility
 *
 * Copies production component files (.prod.tsx) as-is to production branch
 * No prop merging or transformation needed since .prod.tsx files already have all props defined
 */

import * as fs from 'fs';
import * as path from 'path';
import { getComponentInfo } from '../componentRegistry';

export interface ComponentFileContent {
  path: string;
  content: string;
}

export interface CopyResult {
  success: boolean;
  componentsCopied: number;
  files: ComponentFileContent[];
  errors: string[];
  warnings: string[];
}

/**
 * Copy production components to the current directory
 *
 * @param usedComponentTypes - Array of component types to copy (e.g., ['auroraImageHero', 'textAndList'])
 * @param dryRun - If true, only simulate the copy (don't actually write files)
 * @returns CopyResult with details about what was copied
 */
export async function copyProductionComponents(
  usedComponentTypes: string[],
  dryRun: boolean = false
): Promise<CopyResult> {
  const result: CopyResult = {
    success: true,
    componentsCopied: 0,
    files: [],
    errors: [],
    warnings: [],
  };

  console.log(`\n📦 Copying ${usedComponentTypes.length} component types...`);
  if (dryRun) {
    console.log('🧪 DRY RUN MODE - No files will be written\n');
  }

  for (const componentType of usedComponentTypes) {
    console.log(`\n🔍 [${componentType}] Processing component...`);
    
    const componentInfo = getComponentInfo(componentType);

    if (!componentInfo) {
      console.error(`  ❌ Component type "${componentType}" not found in registry`);
      result.errors.push(`Component type "${componentType}" not found in registry`);
      result.success = false;
      continue;
    }

    try {
      // Convert import path to file system path
      // Example: '@/components/designs/herobanners/auroraImageHero/auroraImageHero'
      //       -> 'frontend/src/components/designs/herobanners/auroraImageHero/auroraImageHero'
      // The componentImportPath already includes the component name at the end
      // IMPORTANT: We generate paths relative to project root (with frontend/ prefix)
      // Files will be read from frontend/ directory but paths stored with frontend/ prefix
      const componentPath = componentInfo.componentImportPath.replace('@/', 'frontend/src/');
      const componentDir = path.dirname(componentPath);
      const componentBaseName = path.basename(componentPath);
      
      console.log(`  📍 Component import path: ${componentInfo.componentImportPath}`);
      console.log(`  📍 Converted to: ${componentPath}`);
      console.log(`  📍 Component directory: ${componentDir}`);
      console.log(`  📍 Component base name: ${componentBaseName}`);
      
      // For reading files: Next.js runs from frontend/, so we need to go up one level or use relative path
      // Find project root by looking for .git folder
      let projectRoot = process.cwd();
      while (projectRoot !== path.dirname(projectRoot) && !fs.existsSync(path.join(projectRoot, '.git'))) {
        projectRoot = path.dirname(projectRoot);
      }
      console.log(`  📍 Project root: ${projectRoot}`);
      console.log(`  📍 Process cwd: ${process.cwd()}`);
      
      const fullComponentDir = path.join(projectRoot, componentDir);
      console.log(`  📍 Full component directory: ${fullComponentDir}`);
      console.log(`  📍 Directory exists: ${fs.existsSync(fullComponentDir)}`);
      
      // Look for .prod.tsx file first, then fall back to .tsx
      const prodPath = path.join(fullComponentDir, `${componentBaseName}.prod.tsx`);
      const regularPath = path.join(fullComponentDir, `${componentBaseName}.tsx`);
      
      console.log(`  🔎 Looking for .prod.tsx file: ${prodPath}`);
      console.log(`  🔎 File exists: ${fs.existsSync(prodPath)}`);
      console.log(`  🔎 Looking for regular .tsx file: ${regularPath}`);
      console.log(`  🔎 File exists: ${fs.existsSync(regularPath)}`);
      
      // Determine which file to use
      let sourcePath: string;
      let targetPath: string; // Path in production (always .tsx, not .prod.tsx)
      
      if (fs.existsSync(prodPath)) {
        sourcePath = prodPath;
        targetPath = path.join(componentDir, `${componentBaseName}.tsx`);
        console.log(`  ✅ FOUND .prod.tsx FILE!`);
        console.log(`     Source (absolute): ${sourcePath}`);
        console.log(`     Source (relative): ${path.relative(process.cwd(), prodPath)}`);
        console.log(`     Target (production): ${targetPath}`);
        console.log(`     → Will copy to: frontend/src/components/designs/${componentDir.split('frontend/src/components/designs/')[1] || componentDir}/${componentBaseName}.tsx`);
      } else if (fs.existsSync(regularPath)) {
        sourcePath = regularPath;
        targetPath = path.join(componentDir, `${componentBaseName}.tsx`);
        console.warn(`  ⚠️  No .prod.tsx found, using regular .tsx file`);
        console.log(`     Source (absolute): ${sourcePath}`);
        console.log(`     Source (relative): ${path.relative(process.cwd(), regularPath)}`);
        console.log(`     Target (production): ${targetPath}`);
        result.warnings.push(`No .prod.tsx file found for ${componentType}, using regular .tsx file`);
      } else {
        console.error(`  ❌ Component file not found!`);
        console.error(`     Checked .prod.tsx: ${prodPath}`);
        console.error(`     Checked .tsx: ${regularPath}`);
        console.error(`     Relative .prod: ${path.relative(process.cwd(), prodPath)}`);
        console.error(`     Relative .tsx: ${path.relative(process.cwd(), regularPath)}`);
        result.errors.push(`Component file not found: ${path.relative(process.cwd(), prodPath)} or ${path.relative(process.cwd(), regularPath)}`);
        result.success = false;
        continue;
      }

      // Read component file (production version, no safeguards)
      const componentContent = fs.readFileSync(sourcePath, 'utf-8');
      const contentSize = componentContent.length;
      const firstLine = componentContent.split('\n')[0];
      const lastLine = componentContent.split('\n').slice(-2)[0]; // -2 to avoid empty last line

      // Store component file (renamed from .prod.tsx to .tsx in production)
      console.log(`  📦 File content read: ${(contentSize / 1024).toFixed(1)}KB, ${componentContent.split('\n').length} lines`);
      console.log(`  📝 First line: ${firstLine.substring(0, 80)}...`);
      console.log(`  📝 Last line: ${lastLine.substring(0, 80)}...`);
      console.log(`  🎯 TARGET PATH FOR PRODUCTION: ${targetPath}`);
      console.log(`     → This file will be written to: frontend/src/components/designs/${targetPath.split('frontend/src/components/designs/')[1] || targetPath}`);
      
      if (dryRun) {
        console.log(`  🧪 DRY RUN: Would write to: ${targetPath}\n`);
      } else {
        console.log(`  ✅ Prepared for production: ${targetPath} (${(contentSize / 1024).toFixed(1)}KB)\n`);
      }

      result.files.push({
        path: targetPath,
        content: componentContent,
      });

      // Copy index.ts file (required for production)
      // indexPath should also have frontend/ prefix to match componentDir
      const indexPath = path.join(componentDir, 'index.ts');
      // Find project root for reading (same logic as above)
      let projectRootForIndex = process.cwd();
      while (projectRootForIndex !== path.dirname(projectRootForIndex) && !fs.existsSync(path.join(projectRootForIndex, '.git'))) {
        projectRootForIndex = path.dirname(projectRootForIndex);
      }
      const fullIndexPath = path.join(projectRootForIndex, indexPath);
      
      if (fs.existsSync(fullIndexPath)) {
        let indexContent = fs.readFileSync(fullIndexPath, 'utf-8');
        
        // Clean up index.ts for production: remove editorial component references
        // Remove imports of *Edit/*edit components (handles both camelCase and lowercase)
        // Matches: Testimonials3Edit, testimonials3edit, experienceCardEdit, etc.
        indexContent = indexContent.replace(
          /import\s+\w+[Ee]dit\s+from\s+['"]\.\/\w+[Ee]dit['"];?\s*\n?/gi,
          ''
        );
        // Also catch variations like testimonials3edit (no capital E)
        indexContent = indexContent.replace(
          /import\s+\w+edit\s+from\s+['"]\.\/\w+edit['"];?\s*\n?/gi,
          ''
        );
        // Remove exports of *Edit components (handles both cases)
        indexContent = indexContent.replace(
          /export\s*{\s*\w+[Ee]dit[,\s]*/g,
          (match) => match.replace(/\w+[Ee]dit[,\s]*/, '')
        );
        // Remove exports that only contain Edit components
        indexContent = indexContent.replace(
          /export\s*{\s*\w+[Ee]dit\s*}\s*;?\s*\n?/gi,
          ''
        );
        // Remove standalone export statements for Edit components at end of file
        indexContent = indexContent.replace(
          /export\s*{\s*\w+[Ee]dit\s*}\s*;?\s*$/gim,
          ''
        );
        // Remove editorial-related exports (auroraImageHeroComponent, etc.)
        indexContent = indexContent.replace(
          /export\s+const\s+\w+Component[^;]*;?\s*\n?/g,
          ''
        );
        // Remove imports of EditorialComponentProps and WebsiteComponent (editorial-only types)
        indexContent = indexContent.replace(
          /import\s*{[^}]*EditorialComponentProps[^}]*}\s*from[^;]*;?\s*\n?/g,
          ''
        );
        indexContent = indexContent.replace(
          /EditorialComponentProps[,\s]*/g,
          ''
        );
        indexContent = indexContent.replace(
          /WebsiteComponent[^,}]*[,\s]*/g,
          ''
        );
        // Clean up empty import statements
        indexContent = indexContent.replace(
          /import\s*{\s*}\s*from[^;]*;?\s*\n?/g,
          ''
        );
        // Clean up multiple consecutive empty lines
        indexContent = indexContent.replace(/\n{3,}/g, '\n\n');
        
        result.files.push({
          path: indexPath,
          content: indexContent,
        });
        if (dryRun) {
          console.log(`  ✓ Would prepare: ${indexPath} (cleaned for production)`);
        } else {
          console.log(`  ✓ Prepared: ${indexPath} (cleaned for production)`);
        }
      } else {
        result.warnings.push(`Index file not found: ${indexPath} (component may still work)`);
      }

      result.componentsCopied++;
    } catch (error: any) {
      result.errors.push(`Failed to prepare ${componentType}: ${error.message}`);
      result.success = false;
    }
  }

  console.log(`\n✅ [COMPONENT COPY] Component preparation complete`);
  console.log(`   Components processed: ${result.componentsCopied}`);
  console.log(`   Total files prepared: ${result.files.length}`);
  
  // Show breakdown of files
  const componentFiles = result.files.filter(f => f.path.includes('components/designs') && f.path.endsWith('.tsx'));
  const indexFiles = result.files.filter(f => f.path.includes('components/designs') && f.path.endsWith('index.ts'));
  const otherFiles = result.files.filter(f => !f.path.includes('components/designs'));
  
  console.log(`\n📦 [COMPONENT COPY] File breakdown:`);
  console.log(`   🎨 Component .tsx files: ${componentFiles.length}`);
  componentFiles.forEach(f => {
    console.log(`      → ${f.path} (${(f.content.length / 1024).toFixed(1)}KB)`);
    console.log(`        Will be written to production branch at: ${f.path}`);
  });
  console.log(`   📄 Index.ts files: ${indexFiles.length}`);
  indexFiles.forEach(f => {
    console.log(`      → ${f.path} (${(f.content.length / 1024).toFixed(1)}KB)`);
  });
  if (otherFiles.length > 0) {
    console.log(`   📋 Other files: ${otherFiles.length}`);
  }

  if (result.warnings.length > 0) {
    console.log(`\n   ⚠️  Warnings: ${result.warnings.length}`);
    result.warnings.forEach((w) => console.log(`     - ${w}`));
  }

  if (result.errors.length > 0) {
    console.log(`\n   ❌ Errors: ${result.errors.length}`);
    result.errors.forEach((e) => console.log(`     - ${e}`));
  }
  
  console.log(`\n🎯 [COMPONENT COPY] Summary:`);
  console.log(`   All component files will be written to production branch at:`);
  console.log(`   frontend/src/components/designs/{componentType}/{componentName}.tsx`);
  console.log(`   Example: frontend/src/components/designs/herobanners/auroraImageHero/auroraImageHero.tsx\n`);

  return result;
}

/**
 * Get list of files that would be copied for given component types
 *
 * @param usedComponentTypes - Array of component types
 * @returns Array of file paths that would be copied
 */
export function getComponentFilePaths(usedComponentTypes: string[]): string[] {
  const filePaths: string[] = [];

  for (const componentType of usedComponentTypes) {
    const componentInfo = getComponentInfo(componentType);
    if (componentInfo) {
      // componentImportPath already includes the component name at the end
      // Example: '@/components/designs/herobanners/auroraImageHero/auroraImageHero'
      // IMPORTANT: Generate paths with frontend/ prefix (relative to project root)
      const componentPath = componentInfo.componentImportPath.replace('@/', 'frontend/src/');
      const componentDir = path.dirname(componentPath);
      const componentBaseName = path.basename(componentPath);
      
      // Production path (always .tsx, even if source is .prod.tsx)
      const productionComponentPath = path.join(componentDir, `${componentBaseName}.tsx`);
      const indexPath = path.join(componentDir, 'index.ts');
      
      filePaths.push(productionComponentPath);
      filePaths.push(indexPath);
    }
  }

  return filePaths;
}
