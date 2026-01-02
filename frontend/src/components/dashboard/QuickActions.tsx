"use client";

/**
 * Quick Actions - Action buttons for the dashboard
 */

import { useState } from 'react';

interface QuickActionsProps {
  siteUrl?: string;
  onDeploy?: () => Promise<void>;
}

export function QuickActions({ siteUrl, onDeploy }: QuickActionsProps) {
  const [isDeploying, setIsDeploying] = useState(false);

  const handleDeploy = async () => {
    if (!onDeploy) return;

    setIsDeploying(true);
    try {
      await onDeploy();
    } catch (error) {
      console.error('Deploy failed:', error);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Deploy Button */}
        <button
          onClick={handleDeploy}
          disabled={isDeploying}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          {isDeploying ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Publishing...</span>
            </>
          ) : (
            <>
              <span>🚀</span>
              <span>Publish Latest Changes</span>
            </>
          )}
        </button>

        {/* View Live Site */}
        {siteUrl && (
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            <span>🌐</span>
            <span>View Live Site</span>
          </a>
        )}

        {/* Back to Editor */}
        <a
          href="/editor"
          className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
        >
          <span>✏️</span>
          <span>Edit Website</span>
        </a>

        {/* Help/Support */}
        <button className="flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
          <span>❓</span>
          <span>Get Help</span>
        </button>
      </div>
    </div>
  );
}
