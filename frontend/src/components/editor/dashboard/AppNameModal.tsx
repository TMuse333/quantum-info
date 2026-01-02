"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, AlertCircle } from 'lucide-react';

interface AppNameModalProps {
  isOpen: boolean;
  onConfirm: (appName: string) => void;
  onCancel: () => void;
  existingAppName?: string;
}

export default function AppNameModal({ isOpen, onConfirm, onCancel, existingAppName }: AppNameModalProps) {
  const [appName, setAppName] = useState(existingAppName || '');
  const [error, setError] = useState<string | null>(null);

  // If app name already exists, it's locked
  const isLocked = !!existingAppName;

  // Get custom domain from environment
  const customDomain = process.env.NEXT_PUBLIC_DOMAIN_NAME;

  // Generate preview URLs
  const getPreviewUrls = () => {
    const name = appName || 'your-app';
    if (customDomain) {
      return {
        primary: `https://${name}.dev.${customDomain}`,
        fallback: `https://${name}.vercel.app`
      };
    }
    return {
      primary: `https://${name}.vercel.app`,
      fallback: null
    };
  };

  const previewUrls = getPreviewUrls();

  const validateAppName = (name: string): boolean => {
    // Vercel project naming rules:
    // - Lowercase letters, numbers, hyphens only
    // - Must start with a letter or number
    // - 3-63 characters
    const validPattern = /^[a-z0-9][a-z0-9-]{2,62}$/;

    if (!name) {
      setError('App name is required');
      return false;
    }

    if (name.length < 3) {
      setError('App name must be at least 3 characters');
      return false;
    }

    if (name.length > 63) {
      setError('App name must be less than 63 characters');
      return false;
    }

    if (!validPattern.test(name)) {
      setError('App name must contain only lowercase letters, numbers, and hyphens, and start with a letter or number');
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // If locked, don't allow submission
    if (isLocked) {
      return;
    }

    const trimmedName = appName.trim().toLowerCase();

    if (validateAppName(trimmedName)) {
      onConfirm(trimmedName);
      setAppName('');
      setError(null);
    }
  };

  const handleCancel = () => {
    setAppName('');
    setError(null);
    onCancel();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="bg-gray-900 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-6 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Rocket className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {isLocked ? 'App Name (Locked)' : 'Name Your App'}
                  </h2>
                  <p className="text-sm text-purple-200">
                    {isLocked 
                      ? 'Your app name is set and cannot be changed' 
                      : 'Choose a unique name for your deployment'}
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label htmlFor="appName" className="block text-sm font-medium text-gray-300 mb-2">
                  App Name
                </label>
                <input
                  type="text"
                  id="appName"
                  value={appName}
                  onChange={(e) => {
                    if (isLocked) return; // Prevent changes if locked
                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                    setAppName(value);
                    if (error) validateAppName(value);
                  }}
                  placeholder="my-awesome-site"
                  disabled={isLocked}
                  readOnly={isLocked}
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent ${
                    isLocked 
                      ? 'border-green-500/50 bg-gray-800/50 cursor-not-allowed opacity-75' 
                      : 'border-gray-700 focus:ring-purple-500'
                  }`}
                  autoFocus={!isLocked}
                />
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-gray-400">
                    Your site will be available at:
                  </p>
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      {customDomain && <span className="text-green-400 text-sm">✓</span>}
                      <code className="text-purple-400 text-sm font-mono">
                        {previewUrls.primary}
                      </code>
                    </div>
                    {previewUrls.fallback && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">Fallback:</span>
                        <code className="text-gray-400 text-xs font-mono">
                          {previewUrls.fallback}
                        </code>
                      </div>
                    )}
                  </div>
                  {customDomain && (
                    <p className="text-xs text-green-400/70 mt-2">
                      🎉 Custom domain configured: <span className="font-mono">{customDomain}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </motion.div>
              )}

              {/* Info */}
              {isLocked ? (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-200 mb-2">
                    <strong>🔒 App name is locked</strong>
                  </p>
                  <p className="text-xs text-green-300">
                    Your app name is set to <span className="font-mono font-bold">{existingAppName}</span> and cannot be changed. 
                    This ensures all deployments go to the same Vercel project.
                  </p>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-200 mb-2">
                    <strong>⚠️ Important:</strong>
                  </p>
                  <p className="text-xs text-blue-300 mb-2">
                    Once you set an app name, it cannot be changed. This ensures all deployments go to the same Vercel project.
                  </p>
                  <p className="text-sm text-blue-200 mb-2">
                    <strong>Naming rules:</strong>
                  </p>
                  <ul className="text-xs text-blue-300 space-y-1 ml-4 list-disc">
                    <li>Lowercase letters, numbers, and hyphens only</li>
                    <li>Must start with a letter or number</li>
                    <li>3-63 characters long</li>
                  </ul>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  {isLocked ? 'Close' : 'Cancel'}
                </button>
                {!isLocked && (
                  <button
                    type="submit"
                    disabled={!appName || appName.length < 3}
                    className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
