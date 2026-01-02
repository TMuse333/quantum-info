"use client";

/**
 * Deployment History - Shows recent deployments
 * Simple, non-technical display
 */

interface Deployment {
  id: string;
  status: 'success' | 'failed' | 'pending' | 'building';
  commitMessage?: string;
  startedAt: string | Date; // Accept both string (ISO) and Date
  completedAt?: string | Date;
  buildTime?: number;
  errorMessage?: string;
}

interface DeploymentHistoryProps {
  deployments: Deployment[];
}

export function DeploymentHistory({ deployments }: DeploymentHistoryProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <span>✅</span>
            <span>Success</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <span>❌</span>
            <span>Failed</span>
          </span>
        );
      case 'building':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <span>🔨</span>
            <span>Building</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <span>⏳</span>
            <span>Pending</span>
          </span>
        );
    }
  };

  const formatDate = (date: string | Date) => {
    const now = new Date();
    const deployDate = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now.getTime() - deployDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return deployDate.toLocaleDateString();
  };

  const formatBuildTime = (ms?: number) => {
    if (!ms) return null;
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  if (deployments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Update History</h2>
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No deployments yet</p>
          <p className="text-gray-400 text-sm mt-2">
            Your deployment history will appear here once you publish changes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Update History</h2>

      <div className="space-y-4">
        {deployments.map((deployment) => (
          <div
            key={deployment.id}
            className="border-l-4 pl-4 py-3 hover:bg-gray-50 transition-colors rounded-r"
            style={{
              borderColor:
                deployment.status === 'success'
                  ? '#10b981'
                  : deployment.status === 'failed'
                  ? '#ef4444'
                  : deployment.status === 'building'
                  ? '#3b82f6'
                  : '#eab308',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusBadge(deployment.status)}
                  <span className="text-sm text-gray-500">
                    {formatDate(deployment.startedAt)}
                  </span>
                  {deployment.buildTime && (
                    <span className="text-sm text-gray-500">
                      • {formatBuildTime(deployment.buildTime)}
                    </span>
                  )}
                </div>

                <p className="text-gray-800 font-medium">
                  {deployment.commitMessage || 'Website update'}
                </p>

                {deployment.errorMessage && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-700">
                      <span className="font-semibold">Error: </span>
                      {deployment.errorMessage}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
