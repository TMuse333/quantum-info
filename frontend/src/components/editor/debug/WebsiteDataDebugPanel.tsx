"use client";

import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, FileJson, Github, RefreshCw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useWebsiteStore from "@/stores/websiteStore";

export default function WebsiteDataDebugPanel() {
  const websiteData = useWebsiteStore((state) => state.websiteData);
  const currentPageSlug = useWebsiteStore((state) => state.currentPageSlug);
  const isLoading = useWebsiteStore((state) => state.isLoading);
  const error = useWebsiteStore((state) => state.error);
  const lastSyncedAt = useWebsiteStore((state) => state.lastSyncedAt);
  const hasUnsavedChanges = useWebsiteStore((state) => state.hasUnsavedChanges);
  const refreshFromGitHub = useWebsiteStore((state) => state.refreshFromGitHub);

  const [isExpanded, setIsExpanded] = useState(false);
  const [lastDataHash, setLastDataHash] = useState("");
  const [changeCount, setChangeCount] = useState(0);
  const [initialData, setInitialData] = useState<any>(null);
  const [showDiff, setShowDiff] = useState(false);

  const pagesCount = websiteData?.pages
    ? Object.keys(websiteData.pages).length
    : 0;

  const lastUpdated = websiteData?.updatedAt
    ? new Date(websiteData.updatedAt).toLocaleString()
    : "Never";

  const lastSynced = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleString()
    : "Never";

  // Capture initial data on first load
  useEffect(() => {
    if (websiteData && !initialData && lastSyncedAt) {
      // console.log("📸 [WebsiteDataDebugPanel] Capturing initial data from GitHub");
      setInitialData(JSON.parse(JSON.stringify(websiteData)));
    }
  }, [websiteData, lastSyncedAt, initialData]);

  // Track changes to websiteData
  useEffect(() => {
    if (websiteData) {
      const currentHash = JSON.stringify(websiteData);
      if (lastDataHash && currentHash !== lastDataHash) {
        setChangeCount(prev => {
          const newCount = prev + 1;
          // console.log("🔄 [WebsiteDataDebugPanel] Data changed!", newCount, "changes");
          // console.log("🔄 [WebsiteDataDebugPanel] Current websiteData:", websiteData);
          return newCount;
        });
      }
      setLastDataHash(currentHash);
    }
  }, [websiteData, lastDataHash]);

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <AnimatePresence>
        {!isExpanded ? (
          // Collapsed: Small circle
          <motion.button
            key="collapsed"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsExpanded(true)}
            className="relative w-14 h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-full shadow-2xl border-2 border-gray-700 hover:border-gray-600 transition-all flex items-center justify-center group"
          >
            <FileJson className="w-6 h-6 text-green-400" />
            {changeCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-black text-xs font-bold rounded-full flex items-center justify-center">
                {changeCount}
              </span>
            )}
            {isLoading && (
              <RefreshCw className="absolute -bottom-1 -right-1 w-4 h-4 animate-spin text-blue-400 bg-gray-900 rounded-full p-0.5" />
            )}
            {/* Tooltip */}
            <div className="absolute left-16 bottom-0 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              websiteData.json
            </div>
          </motion.button>
        ) : (
          // Expanded: Full panel
          <motion.div
            key="expanded"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700 overflow-hidden w-[500px] max-h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center bg-gray-800">
              <div className="flex-1 flex items-center gap-2 p-3">
                <Github className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold">websiteData.json</span>
                {changeCount > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-yellow-500 text-black rounded-full font-bold">
                    {changeCount} {changeCount === 1 ? 'change' : 'changes'}
                  </span>
                )}
                {isLoading && (
                  <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  refreshFromGitHub();
                }}
                disabled={isLoading}
                className="p-3 hover:bg-gray-750 transition-colors disabled:opacity-50 border-l border-gray-700"
                title="Force refresh from GitHub"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-3 hover:bg-gray-750 transition-colors border-l border-gray-700"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="p-3 bg-gray-800 border-t border-gray-700 text-xs space-y-2">
                {error && (
                  <div className="mb-2 p-2 bg-red-900/50 border border-red-700 rounded text-red-200">
                    <div className="font-semibold">Error:</div>
                    <div className="text-[10px] mt-1">{error}</div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">📊 Pages:</span>
                  <span className="text-white font-mono">{pagesCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">📄 Current Page:</span>
                  <span className="text-white font-mono">{currentPageSlug}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">🔄 Changes Made:</span>
                  <span className={`font-mono ${changeCount > 0 ? 'text-yellow-400' : 'text-white'}`}>
                    {changeCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">💾 Unsaved Changes:</span>
                  <span className={`font-mono font-bold ${hasUnsavedChanges ? 'text-red-400' : 'text-green-400'}`}>
                    {hasUnsavedChanges ? 'YES ⚠️' : 'NO ✓'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">🌐 Last Synced from GitHub:</span>
                  <span className="text-white font-mono text-[10px]">{lastSynced}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">📝 Data Last Updated:</span>
                  <span className="text-white font-mono text-[10px]">{lastUpdated}</span>
                </div>
                {websiteData?.currentVersionNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">🔖 Version:</span>
                    <span className="text-white font-mono">#{websiteData.currentVersionNumber}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 p-3 bg-gray-950 border-t border-gray-700 overflow-hidden flex flex-col">
                <div className="mb-2 flex items-center justify-between text-xs flex-shrink-0">
                  <span className="text-gray-400">
                    {changeCount > 0
                      ? "⚠️ Unsaved changes - This will be uploaded on save"
                      : "✅ Current data from GitHub"}
                  </span>
                  {changeCount > 0 && initialData && (
                    <button
                      onClick={() => setShowDiff(!showDiff)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs font-semibold"
                    >
                      {showDiff ? "Hide Comparison" : "Show Initial vs Current"}
                    </button>
                  )}
                </div>

                {showDiff && initialData ? (
                  <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto">
                    <div className="overflow-y-auto">
                      <div className="sticky top-0 bg-gray-800 px-2 py-1 text-xs font-semibold border-b border-gray-700 mb-2">
                        📥 Initial from GitHub
                      </div>
                      <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap break-words">
                        {JSON.stringify(initialData, null, 2)}
                      </pre>
                    </div>
                    <div className="overflow-y-auto">
                      <div className="sticky top-0 bg-gray-800 px-2 py-1 text-xs font-semibold border-b border-gray-700 mb-2">
                        📤 Current (will be uploaded)
                      </div>
                      <pre className="text-xs font-mono text-yellow-300 whitespace-pre-wrap break-words">
                        {JSON.stringify(websiteData, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto">
                    <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap break-words">
                      {websiteData ? JSON.stringify(websiteData, null, 2) : "No data loaded"}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
