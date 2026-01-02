"use client";

/**
 * Site Status Card - Shows current website status
 * Non-technical, user-friendly display
 */

interface SiteStatusCardProps {
  deployment?: {
    vercelProductionUrl?: string;
    customDomain?: string;
    lastDeploymentStatus?: 'success' | 'failed' | 'pending' | 'building';
    lastDeploymentAt?: Date;
    totalDeployments?: number;
    successfulDeployments?: number;
  };
}

export function SiteStatusCard({ deployment }: SiteStatusCardProps) {
  const getStatusDisplay = () => {
    if (!deployment?.lastDeploymentStatus) {
      return {
        emoji: '⏸️',
        text: 'Not Yet Deployed',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
      };
    }

    switch (deployment.lastDeploymentStatus) {
      case 'success':
        return {
          emoji: '✅',
          text: 'Live',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        };
      case 'building':
        return {
          emoji: '🔨',
          text: 'Building...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        };
      case 'failed':
        return {
          emoji: '❌',
          text: 'Deployment Failed',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
        };
      case 'pending':
        return {
          emoji: '⏳',
          text: 'Pending',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
        };
    }
  };

  const status = getStatusDisplay();
  const siteUrl = deployment?.customDomain
    ? `https://${deployment.customDomain}`
    : deployment?.vercelProductionUrl;

  const successRate = deployment?.totalDeployments
    ? ((deployment.successfulDeployments! / deployment.totalDeployments) * 100).toFixed(0)
    : '0';

  const lastDeployed = deployment?.lastDeploymentAt
    ? new Date(deployment.lastDeploymentAt).toLocaleString()
    : 'Never';

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Your Website</h2>
        <div className={`${status.bgColor} ${status.color} px-4 py-2 rounded-full font-semibold flex items-center gap-2`}>
          <span className="text-xl">{status.emoji}</span>
          <span>{status.text}</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Website URL */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Website Address</p>
          {siteUrl ? (
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-medium text-blue-600 hover:underline"
            >
              {siteUrl}
            </a>
          ) : (
            <p className="text-gray-400">Not deployed yet</p>
          )}
        </div>

        {/* Last Updated */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Last Updated</p>
          <p className="text-lg font-medium text-gray-800">{lastDeployed}</p>
        </div>

        {/* Success Rate */}
        {deployment?.totalDeployments ? (
          <div>
            <p className="text-sm text-gray-600 mb-1">Deployment Success Rate</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${successRate}%` }}
                />
              </div>
              <span className="text-lg font-semibold text-gray-800">{successRate}%</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {deployment.successfulDeployments} successful out of {deployment.totalDeployments} total
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
