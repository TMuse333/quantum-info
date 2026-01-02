/**
 * Update WebsiteMaster deployment field
 *
 * Updates the deployment status in websiteData.json
 * This provides quick access to latest deployment info without querying DeploymentRecord
 */

import fs from 'fs';
import path from 'path';

interface DeploymentUpdate {
  projectId?: string; // Optional - not used in this function but accepted for compatibility
  vercelProjectId?: string;
  vercelProductionUrl?: string;
  customDomain?: string;
  githubOwner?: string;
  githubRepo?: string;
  lastDeploymentStatus?: 'success' | 'failed' | 'pending' | 'building';
  lastDeploymentAt?: Date;
  lastDeploymentId?: string;
  lastCommitSha?: string;
  lastBuildTime?: number;
  incrementTotal?: boolean; // Increment totalDeployments
  incrementSuccess?: boolean; // Increment successfulDeployments
  incrementFailed?: boolean; // Increment failedDeployments
}

export async function updateWebsiteDeployment(
  updates: DeploymentUpdate
): Promise<void> {
  try {
    const websiteDataPath = path.join(
      process.cwd(),
      'src/data/websiteData.json'
    );

    // Read current data
    const data = JSON.parse(fs.readFileSync(websiteDataPath, 'utf-8'));

    // Initialize deployment object if it doesn't exist
    if (!data.deployment) {
      data.deployment = {
        totalDeployments: 0,
        successfulDeployments: 0,
        failedDeployments: 0,
      };
    }

    // Update fields
    if (updates.vercelProjectId) data.deployment.vercelProjectId = updates.vercelProjectId;
    if (updates.vercelProductionUrl) data.deployment.vercelProductionUrl = updates.vercelProductionUrl;
    if (updates.customDomain) data.deployment.customDomain = updates.customDomain;
    if (updates.githubOwner) data.deployment.githubOwner = updates.githubOwner;
    if (updates.githubRepo) data.deployment.githubRepo = updates.githubRepo;
    if (updates.lastDeploymentStatus) data.deployment.lastDeploymentStatus = updates.lastDeploymentStatus;
    if (updates.lastDeploymentAt) data.deployment.lastDeploymentAt = updates.lastDeploymentAt;
    else if (updates.lastDeploymentStatus) data.deployment.lastDeploymentAt = new Date();
    if (updates.lastDeploymentId) data.deployment.lastDeploymentId = updates.lastDeploymentId;
    if (updates.lastCommitSha) data.deployment.lastCommitSha = updates.lastCommitSha;
    if (updates.lastBuildTime !== undefined) data.deployment.lastBuildTime = updates.lastBuildTime;

    // Update counters
    if (updates.incrementTotal) {
      data.deployment.totalDeployments = (data.deployment.totalDeployments || 0) + 1;
    }
    if (updates.incrementSuccess) {
      data.deployment.successfulDeployments = (data.deployment.successfulDeployments || 0) + 1;
    }
    if (updates.incrementFailed) {
      data.deployment.failedDeployments = (data.deployment.failedDeployments || 0) + 1;
    }

    // Write back to file
    fs.writeFileSync(
      websiteDataPath,
      JSON.stringify(data, null, 2),
      'utf-8'
    );

    console.log('✅ [DEPLOYMENT] Updated websiteData.json deployment info');
  } catch (error) {
    console.error('❌ [DEPLOYMENT] Failed to update websiteData.json:', error);
    // Don't throw - deployment can continue even if this fails
  }
}
