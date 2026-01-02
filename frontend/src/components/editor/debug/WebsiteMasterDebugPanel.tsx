"use client";

import { useState, useMemo } from "react";
import useWebsiteStore from "@/stores/websiteStore";
import {
  testWebsiteMasterCheck,
  formatValueForDisplay,
  getVersionComparisonSummary,
  type VersionComparison,
} from "@/lib/debug/websiteDataCheck";
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2, XCircle, Plus, Minus, Code, FileJson } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { WebsiteMaster } from '@/types/editorial';

export default function WebsiteMasterDebugPanel() {
  const websiteData = useWebsiteStore((state) => state.websiteData);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedComparisons, setExpandedComparisons] = useState<Set<number>>(new Set());
  const [expandedDifferences, setExpandedDifferences] = useState<Set<string>>(new Set());
  const [showJsonViewer, setShowJsonViewer] = useState(false);
  const [selectedVersionForJson, setSelectedVersionForJson] = useState<number | "current">("current");

  const comparisons = useMemo(() => {
    if (!websiteData) return [];
    console.log(`🔍 [DebugPanel] Recalculating comparisons for websiteData:`, {
      pagesCount: websiteData.pages?.length || 0,
      currentPageIndex: websiteData.pages?.[0]?.components?.length || 0,
      timestamp: new Date().toISOString(),
    });
    return testWebsiteMasterCheck(websiteData);
  }, [websiteData]);

  const summary = useMemo(() => {
    return getVersionComparisonSummary(comparisons);
  }, [comparisons]);

  const toggleComparison = (index: number) => {
    const newSet = new Set(expandedComparisons);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedComparisons(newSet);
  };

  const toggleDifference = (path: string) => {
    const newSet = new Set(expandedDifferences);
    if (newSet.has(path)) {
      newSet.delete(path);
    } else {
      newSet.add(path);
    }
    setExpandedDifferences(newSet);
  };

  // Get the WebsiteMaster JSON for display
  const getWebsiteMasterJson = (): WebsiteMaster | null => {
    if (!websiteData) return null;
    
    if (selectedVersionForJson === "current") {
      return websiteData;
    }
    
    // Find the selected version
    const version = websiteData.versions?.find(
      (v) => v.versionNumber === selectedVersionForJson
    );
    
    return version ? (version.websiteData as WebsiteMaster) : null;
  };

  const websiteDataJson = getWebsiteMasterJson();

  if (!websiteData) {
    return null;
  }

  const getDifferenceIcon = (type: VersionComparison["differences"][0]["type"]) => {
    switch (type) {
      case "added":
        return <Plus className="w-4 h-4 text-green-600" />;
      case "removed":
        return <Minus className="w-4 h-4 text-red-600" />;
      case "modified":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-gray-400" />;
    }
  };

  const getDifferenceColor = (type: VersionComparison["differences"][0]["type"]) => {
    switch (type) {
      case "added":
        return "bg-green-50 border-green-200 text-green-900";
      case "removed":
        return "bg-red-50 border-red-200 text-red-900";
      case "modified":
        return "bg-yellow-50 border-yellow-200 text-yellow-900";
      default:
        return "bg-gray-50 border-gray-200 text-gray-900";
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-4xl">
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? "auto" : "auto",
        }}
        className="bg-white rounded-lg shadow-2xl border-2 border-blue-500 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Code className="w-5 h-5" />
              <div>
                <h3 className="font-bold text-lg">WebsiteMaster Debug Panel</h3>
                <p className="text-xs text-blue-100">
                  {summary.totalVersions} versions • {summary.versionsWithChanges} with changes •{" "}
                  {summary.totalDifferences} total differences
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronUp className="w-5 h-5" />
              )}
            </button>
          </div>
          {/* JSON Viewer Toggle */}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowJsonViewer(!showJsonViewer);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
            >
              <FileJson className="w-4 h-4" />
              {showJsonViewer ? "Hide" : "Show"} JSON
            </button>
            {showJsonViewer && (
              <select
                value={selectedVersionForJson}
                onChange={(e) =>
                  setSelectedVersionForJson(
                    e.target.value === "current" ? "current" : parseInt(e.target.value, 10)
                  )
                }
                className="px-2 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="current">Current Version</option>
                {websiteData.versions
                  ?.sort((a, b) => b.versionNumber - a.versionNumber)
                  .map((v) => (
                    <option key={v.versionNumber} value={v.versionNumber}>
                      Version {v.versionNumber}{v.changeDescription ? `: ${v.changeDescription}` : ''}
                    </option>
                  ))}
              </select>
            )}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 max-h-[70vh] overflow-y-auto space-y-4">
                {/* JSON Viewer - Focused on Pages */}
                {showJsonViewer && websiteDataJson && (
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white flex items-center gap-2">
                        <FileJson className="w-4 h-4" />
                        Pages Array ({selectedVersionForJson === "current" ? "Current" : `Version ${selectedVersionForJson}`})
                      </h4>
                      <button
                        onClick={() => {
                          const pagesOnly = { pages: websiteDataJson.pages || [] };
                          const jsonStr = JSON.stringify(pagesOnly, null, 2);
                          navigator.clipboard.writeText(jsonStr);
                        }}
                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                      >
                        Copy Pages JSON
                      </button>
                    </div>
                    <pre className="text-xs text-green-400 overflow-x-auto max-h-96 overflow-y-auto font-mono bg-black/50 p-3 rounded border border-gray-700">
                      {JSON.stringify({ pages: websiteDataJson.pages || [] }, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Summary Card */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Summary
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Total Versions</p>
                      <p className="font-bold text-lg text-gray-900">{summary.totalVersions}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">With Changes</p>
                      <p className="font-bold text-lg text-blue-600">{summary.versionsWithChanges}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Differences</p>
                      <p className="font-bold text-lg text-yellow-600">{summary.totalDifferences}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Avg per Version</p>
                      <p className="font-bold text-lg text-gray-900">
                        {summary.averageDifferencesPerVersion.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Version Comparisons */}
                {comparisons.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No versions to compare</p>
                  </div>
                ) : (
                  comparisons.map((comparison, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* Comparison Header */}
                      <div
                        className="bg-gray-100 p-3 cursor-pointer flex items-center justify-between hover:bg-gray-200 transition-colors"
                        onClick={() => toggleComparison(index)}
                      >
                        <div className="flex items-center gap-3">
                          {comparison.structureChanged ? (
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">
                              {comparison.versionNumber === -1
                                ? "Current vs Latest Version"
                                : `Version ${comparison.versionNumber}`}
                            </p>
                            {comparison.changeDescription && (
                              <p className="text-xs text-blue-600 font-medium mt-0.5">
                                "{comparison.changeDescription}"
                              </p>
                            )}
                            <p className="text-xs text-gray-600">
                              {comparison.totalDifferences} differences •{" "}
                              {comparison.summary.added} added • {comparison.summary.modified} modified •{" "}
                              {comparison.summary.removed} removed
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {comparison.structureChanged && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                              Changed
                            </span>
                          )}
                          {expandedComparisons.has(index) ? (
                            <ChevronUp className="w-4 h-4 text-gray-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                          )}
                        </div>
                      </div>

                      {/* Differences List */}
                      <AnimatePresence>
                        {expandedComparisons.has(index) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-3 space-y-2 bg-white">
                              {comparison.differences.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-2">
                                  No differences found
                                </p>
                              ) : (
                                comparison.differences.map((diff, diffIndex) => (
                                  <div
                                    key={diffIndex}
                                    className={`border rounded-lg p-3 ${getDifferenceColor(diff.type)}`}
                                  >
                                    <div
                                      className="flex items-start justify-between cursor-pointer"
                                      onClick={() => toggleDifference(`${index}-${diff.path}`)}
                                    >
                                      <div className="flex items-start gap-2 flex-1">
                                        {getDifferenceIcon(diff.type)}
                                        <div className="flex-1 min-w-0">
                                          <p className="font-mono text-xs font-semibold break-all">
                                            {diff.path}
                                          </p>
                                          <p className="text-xs mt-1 opacity-75">
                                            {diff.type.charAt(0).toUpperCase() + diff.type.slice(1)}
                                          </p>
                                        </div>
                                      </div>
                                      {expandedDifferences.has(`${index}-${diff.path}`) ? (
                                        <ChevronUp className="w-4 h-4 flex-shrink-0 ml-2" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4 flex-shrink-0 ml-2" />
                                      )}
                                    </div>

                                    {/* Expanded Value Comparison */}
                                    <AnimatePresence>
                                      {expandedDifferences.has(`${index}-${diff.path}`) && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          className="mt-3 pt-3 border-t border-current/20 overflow-hidden"
                                        >
                                          <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div>
                                              <p className="font-semibold mb-1 opacity-75">Old Value:</p>
                                              <pre className="bg-black/10 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto font-mono">
                                                {formatValueForDisplay(diff.oldValue)}
                                              </pre>
                                            </div>
                                            <div>
                                              <p className="font-semibold mb-1 opacity-75">New Value:</p>
                                              <pre className="bg-black/10 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto font-mono">
                                                {formatValueForDisplay(diff.newValue)}
                                              </pre>
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                ))
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

