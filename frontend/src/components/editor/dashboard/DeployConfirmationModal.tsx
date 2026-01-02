"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface DeployConfirmationModalProps {
  isOpen: boolean;
  appName: string;
  onConfirm: () => void;
  onCancel: () => void;
  hasUnsavedChanges: boolean;
}

export default function DeployConfirmationModal({
  isOpen,
  appName,
  onConfirm,
  onCancel,
  hasUnsavedChanges,
}: DeployConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onCancel}
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
                  <h2 className="text-xl font-bold text-white">Ready to Deploy?</h2>
                  <p className="text-sm text-purple-200">Review before going live</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* App Info */}
              <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-400 mb-1">Deploying to:</p>
                <p className="text-lg font-mono text-purple-400 break-all">
                  {appName}.vercel.app
                </p>
              </div>

              {/* Warnings/Info */}
              <div className="space-y-3 mb-6">
                {hasUnsavedChanges && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
                  >
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-300">Unsaved changes detected</p>
                      <p className="text-xs text-yellow-400/80 mt-1">
                        Your changes will be automatically saved before deployment
                      </p>
                    </div>
                  </motion.div>
                )}

                <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-300">What happens next:</p>
                    <ul className="text-xs text-blue-400/80 mt-1 space-y-1 ml-4 list-disc">
                      <li>Your changes will be pushed to production</li>
                      <li>Your site will be built and deployed</li>
                      <li>Your app will be live in a few minutes</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/20"
                >
                  Deploy Now
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
