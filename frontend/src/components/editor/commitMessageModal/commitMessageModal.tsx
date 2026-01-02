"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, GitBranch, Loader2 } from "lucide-react";

interface CommitMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (message: string) => void;
  isSaving: boolean;
}

export default function CommitMessageModal({
  isOpen,
  onClose,
  onConfirm,
  isSaving,
}: CommitMessageModalProps) {
  const [message, setMessage] = useState("");

  // Reset message when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMessage("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onConfirm(message);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Blurred Background */}
          <motion.div
            initial={{ opacity: 0,  }}
            animate={{ opacity: 1, }}
            exit={{ opacity: 0,  }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-white/30 z-50 flex items-center justify-center"
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full overflow-hidden
            text-black
            ">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Save Changes</h2>
                    <p className="text-sm text-white/80">Commit your changes to version control</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  disabled={isSaving}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="p-6">
                <label className="block mb-4">
                  <span className="text-sm font-semibold text-gray-700 mb-2 block">
                    Commit Message
                  </span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all
                    text-black"
                    placeholder="Describe your changes..."
                    rows={4}
                    required
                    disabled={isSaving}
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This message will be used for the Git commit
                  </p>
                </label>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSaving}
                    className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !message.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <GitBranch className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

