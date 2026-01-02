/**
 * Deployment History Store
 *
 * Zustand store for tracking deployment history and current deployment status.
 * Persists to localStorage for client-side history tracking.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DeploymentRecord {
  id: string;
  timestamp: Date;
  commitSha: string;
  version: number;
  status: 'pending' | 'building' | 'success' | 'failed';
  deploymentUrl?: string;
  vercelDeploymentId?: string;
  filesGenerated: number;
  pagesDeployed: string[];
  errors?: string[];
  codeReviewPassed?: boolean;
  duration?: number; // milliseconds
  // Phase 2: Snapshot tracking
  snapshotVersion?: number; // The version number of the snapshot
  snapshotAvailable?: boolean; // Whether snapshot was saved successfully
}

interface DeploymentHistoryState {
  // State
  deployments: DeploymentRecord[];
  currentDeployment: DeploymentRecord | null;

  // Modal state (survives component re-renders!)
  isModalOpen: boolean;
  currentDryRun: boolean;

  // Actions
  addDeployment: (record: DeploymentRecord) => void;
  updateDeployment: (id: string, updates: Partial<DeploymentRecord>) => void;
  setCurrentDeployment: (record: DeploymentRecord | null) => void;
  clearCurrentDeployment: () => void;
  loadHistory: () => void;
  clearHistory: () => void;
  getDeploymentById: (id: string) => DeploymentRecord | undefined;
  getLatestDeployment: () => DeploymentRecord | undefined;
  getSuccessfulDeployments: () => DeploymentRecord[];
  getFailedDeployments: () => DeploymentRecord[];

  // Modal actions
  setModalOpen: (open: boolean) => void;
  setDryRun: (dryRun: boolean) => void;
}

export const useDeploymentHistoryStore = create<DeploymentHistoryState>()(
  persist(
    (set, get) => ({
      // ======================================================================
      // Initial State
      // ======================================================================
      deployments: [],
      currentDeployment: null,

      // Modal state
      isModalOpen: false,
      currentDryRun: false,

      // ======================================================================
      // Actions
      // ======================================================================

      /**
       * Add a new deployment record
       */
      addDeployment: (record: DeploymentRecord) => {
        set((state) => ({
          deployments: [record, ...state.deployments].slice(0, 50), // Keep last 50
        }));
      },

      /**
       * Update an existing deployment record
       */
      updateDeployment: (id: string, updates: Partial<DeploymentRecord>) => {
        set((state) => ({
          deployments: state.deployments.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
          currentDeployment:
            state.currentDeployment?.id === id
              ? { ...state.currentDeployment, ...updates }
              : state.currentDeployment,
        }));
      },

      /**
       * Set the current active deployment
       */
      setCurrentDeployment: (record: DeploymentRecord | null) => {
        set({ currentDeployment: record });
      },

      /**
       * Clear the current deployment
       */
      clearCurrentDeployment: () => {
        set({ currentDeployment: null });
      },

      /**
       * Load deployment history (from localStorage via persist middleware)
       */
      loadHistory: () => {
        // History is automatically loaded by persist middleware
        // This is just a placeholder for manual refresh if needed
        console.log('Deployment history loaded');
      },

      /**
       * Clear all deployment history
       */
      clearHistory: () => {
        set({ deployments: [], currentDeployment: null });
      },

      /**
       * Get a deployment by ID
       */
      getDeploymentById: (id: string) => {
        return get().deployments.find((d) => d.id === id);
      },

      /**
       * Get the latest deployment
       */
      getLatestDeployment: () => {
        const deployments = get().deployments;
        return deployments.length > 0 ? deployments[0] : undefined;
      },

      /**
       * Get all successful deployments
       */
      getSuccessfulDeployments: () => {
        return get().deployments.filter((d) => d.status === 'success');
      },

      /**
       * Get all failed deployments
       */
      getFailedDeployments: () => {
        return get().deployments.filter((d) => d.status === 'failed');
      },

      /**
       * Set modal open state
       */
      setModalOpen: (open: boolean) => {
        set({ isModalOpen: open });
      },

      /**
       * Set dry run flag
       */
      setDryRun: (dryRun: boolean) => {
        set({ currentDryRun: dryRun });
      },
    }),
    {
      name: 'deployment-history', // localStorage key
      // Only persist deployments, not modal state or currentDeployment
      partialize: (state) => ({ deployments: state.deployments }),
    }
  )
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a new deployment record
 */
export function createDeploymentRecord(
  version: number,
  filesGenerated: number,
  pagesDeployed: string[]
): DeploymentRecord {
  return {
    id: `deployment-${Date.now()}`,
    timestamp: new Date(),
    commitSha: '',
    version,
    status: 'pending',
    filesGenerated,
    pagesDeployed,
  };
}

/**
 * Start a new deployment
 */
export function startDeployment(
  filesGenerated: number,
  pagesDeployed: string[],
  version: number
): DeploymentRecord {
  const record = createDeploymentRecord(version, filesGenerated, pagesDeployed);
  useDeploymentHistoryStore.getState().addDeployment(record);
  useDeploymentHistoryStore.getState().setCurrentDeployment(record);
  return record;
}

/**
 * Complete a deployment successfully
 */
export function completeDeployment(
  id: string,
  commitSha: string,
  deploymentUrl?: string,
  vercelDeploymentId?: string,
  duration?: number
): void {
  useDeploymentHistoryStore.getState().updateDeployment(id, {
    status: 'success',
    commitSha,
    deploymentUrl,
    vercelDeploymentId,
    duration,
  });
  useDeploymentHistoryStore.getState().clearCurrentDeployment();
}

/**
 * Fail a deployment
 */
export function failDeployment(id: string, errors: string[], duration?: number): void {
  useDeploymentHistoryStore.getState().updateDeployment(id, {
    status: 'failed',
    errors,
    duration,
  });
  useDeploymentHistoryStore.getState().clearCurrentDeployment();
}

/**
 * Update deployment status
 */
export function updateDeploymentStatus(
  id: string,
  status: DeploymentRecord['status']
): void {
  useDeploymentHistoryStore.getState().updateDeployment(id, { status });
}

/**
 * Format deployment duration
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Format deployment timestamp
 */
export function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(new Date(date));
}

/**
 * Get deployment status color
 */
export function getStatusColor(status: DeploymentRecord['status']): string {
  switch (status) {
    case 'success':
      return 'green';
    case 'failed':
      return 'red';
    case 'building':
      return 'blue';
    case 'pending':
      return 'yellow';
    default:
      return 'gray';
  }
}

/**
 * Get deployment status emoji
 */
export function getStatusEmoji(status: DeploymentRecord['status']): string {
  switch (status) {
    case 'success':
      return '✅';
    case 'failed':
      return '❌';
    case 'building':
      return '🔨';
    case 'pending':
      return '⏳';
    default:
      return '❓';
  }
}
