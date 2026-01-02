/**
 * Git Operations - Main Export File
 * 
 * This file re-exports all git operations from the modular files
 * for backward compatibility. The actual implementations are in:
 * - git-utils.ts - Core utilities
 * - git-branch-operations.ts - Branch management
 * - git-file-operations.ts - File writing
 * - git-commit-operations.ts - Staging and committing
 * - git-tag-operations.ts - Tagging
 * - git-push-operations.ts - Pushing
 * - git-deployment.ts - Main deployment orchestrator
 */

// Re-export all functions and types for backward compatibility
export { getProjectRoot, execGit, removeLockFileIfExists } from './git-utils';
export { 
  productionBranchExists, 
  getCurrentBranch, 
  checkoutProductionBranch, 
  returnToBranch 
} from './git-branch-operations';
export { 
  writeGeneratedFiles, 
  type GeneratedFile 
} from './git-file-operations';
export { commitProductionBuild } from './git-commit-operations';
export { createProductionTag, getNextVersion } from './git-tag-operations';
export { pushToRemote } from './git-push-operations';
export { deployToProduction } from './git-deployment';

// Re-export types
export interface GitOperationResult {
  success: boolean;
  message: string;
  details?: any;
}
