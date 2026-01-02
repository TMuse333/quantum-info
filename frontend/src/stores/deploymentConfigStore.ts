/**
 * Deployment Configuration Store
 *
 * Stores Vercel deployment configuration:
 * - App name (for Vercel project naming)
 * - Project ID (after first deployment)
 * - Latest deployment URL
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DeploymentConfigState {
  // Vercel Configuration
  appName: string | null;
  vercelProjectId: string | null;
  latestDeploymentUrl: string | null;

  // Actions
  setAppName: (name: string) => void;
  setVercelProjectId: (id: string) => void;
  setLatestDeploymentUrl: (url: string) => void;
  clearConfig: () => void;
}

export const useDeploymentConfigStore = create<DeploymentConfigState>()(
  persist(
    (set, get) => ({
      // Initial state
      appName: null,
      vercelProjectId: null,
      latestDeploymentUrl: null,

      // Actions
      setAppName: (name: string) => {
        // Prevent changing app name once it's been set
        const currentAppName = get().appName;
        if (currentAppName && currentAppName !== name) {
          console.warn('⚠️ [DeploymentConfig] App name is already set and cannot be changed:', currentAppName);
          throw new Error(`App name is already set to "${currentAppName}" and cannot be changed. This ensures all deployments go to the same Vercel project.`);
        }
        console.log('📝 [DeploymentConfig] Setting app name:', name);
        set({ appName: name });
      },

      setVercelProjectId: (id: string) => {
        console.log('📝 [DeploymentConfig] Setting Vercel project ID:', id);
        set({ vercelProjectId: id });
      },

      setLatestDeploymentUrl: (url: string) => {
        console.log('📝 [DeploymentConfig] Setting latest deployment URL:', url);
        set({ latestDeploymentUrl: url });
      },

      clearConfig: () => {
        console.log('🗑️ [DeploymentConfig] Clearing all config');
        set({
          appName: null,
          vercelProjectId: null,
          latestDeploymentUrl: null,
        });
      },
    }),
    {
      name: 'deployment-config-storage', // LocalStorage key
    }
  )
);
