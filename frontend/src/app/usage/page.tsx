"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import useWebsiteStore from "@/stores/websiteStore";
import {
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  Zap,
  FileText,
  Palette,
  Code,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import type { LLMUsageLog } from "@/types/usage";

function UsageContent() {
  const searchParams = useSearchParams();
  const { websiteData } = useWebsiteStore();

  // Get project ID from URL params, websiteData, or auto-detect
  const [projectId, setProjectId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LLMUsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [total, setTotal] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 20;

  // Expanded log details
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  // Auto-detect project ID on mount
  useEffect(() => {
    const detectProjectId = async () => {
      const urlProjectId = searchParams.get("projectId");
      const masterProjectId = websiteData!.repoName
      

      if (urlProjectId) {
        setProjectId(urlProjectId);
      } else if (masterProjectId) {
        setProjectId(masterProjectId);
      } else {
        // Try to auto-detect
        try {
          const response = await fetch("/api/git/repo-info");
          if (response.ok) {
            const data = await response.json();
            if (data.repoOwner && data.repoName) {
              setProjectId(`${data.repoOwner}/${data.repoName}`);
            }
          }
        } catch (error) {
          console.error("Failed to detect project ID:", error);
        }
      }
    };

    detectProjectId();
  }, [searchParams, websiteData]);

  // Fetch usage logs
  useEffect(() => {
    if (!projectId) return;

    const fetchUsage = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          projectId,
          limit: limit.toString(),
          offset: ((page - 1) * limit).toString(),
        });

        if (providerFilter !== "all") params.append("provider", providerFilter);
        if (typeFilter !== "all") params.append("type", typeFilter);
        if (statusFilter !== "all") params.append("status", statusFilter);
        if (dateRange.start) params.append("startDate", dateRange.start);
        if (dateRange.end) params.append("endDate", dateRange.end);

        const response = await fetch(`/api/usage/get?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setLogs(data.logs || []);
          setSummary(data.summary);
          setTotal(data.total || 0);
        } else {
          console.error("Failed to fetch usage");
        }
      } catch (error) {
        console.error("Error fetching usage:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [projectId, page, providerFilter, typeFilter, statusFilter, dateRange]);

  // Filter logs by search query (client-side for better UX)
  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.prompt.toLowerCase().includes(query) ||
      log.response?.content?.toLowerCase().includes(query) ||
      log.classification?.explanation?.toLowerCase().includes(query)
    );
  });

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `usage-logs-${new Date().toISOString()}.json`;
    link.click();
  };

  const exportToCSV = () => {
    const headers = [
      "Timestamp",
      "Prompt",
      "Type",
      "Provider",
      "Model",
      "Status",
      "Tokens",
      "Cost",
      "Classification",
    ];
    const rows = logs.map((log) => [
      new Date(log.timestamp).toISOString(),
      log.prompt,
      log.promptType,
      log.provider,
      log.model,
      log.status,
      log.tokens?.totalTokens || 0,
      log.tokens?.estimatedCost?.toFixed(6) || "0",
      log.classification?.type || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `usage-logs-${new Date().toISOString()}.csv`;
    link.click();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "text":
        return <FileText className="w-4 h-4" />;
      case "color":
        return <Palette className="w-4 h-4" />;
      case "structural":
        return <Code className="w-4 h-4" />;
      case "classification":
        return <Zap className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (!projectId) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Project Not Found
            </h2>
            <p className="text-gray-600">
              Unable to detect project ID. Please add <code className="bg-gray-100 px-2 py-1 rounded">?projectId=owner/repo</code> to the URL.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">LLM Usage</h1>
              <p className="text-sm text-gray-600 mt-1">
                Project: <span className="font-mono">{projectId}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToJSON}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search prompts, responses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                {showFilters ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Provider
                  </label>
                  <select
                    value={providerFilter}
                    onChange={(e) => {
                      setProviderFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">All</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">All</option>
                    <option value="text">Text</option>
                    <option value="color">Color</option>
                    <option value="structural">Structural</option>
                    <option value="classification">Classification</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">All</option>
                    <option value="success">Success</option>
                    <option value="error">Error</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => {
                      setDateRange({ ...dateRange, start: e.target.value });
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalRequests}</p>
                </div>
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tokens</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.totalTokens.toLocaleString()}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Cost</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${summary.totalCost.toFixed(4)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Showing</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredLogs.length} / {total}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        )}

        {/* Logs List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading usage logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Usage Logs</h3>
            <p className="text-gray-600">
              {searchQuery || providerFilter !== "all" || typeFilter !== "all"
                ? "No logs match your filters."
                : "Start using the AI assistant to see usage logs here."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogs.has(log._id || "");
              return (
                <div
                  key={log._id}
                  className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
                >
                  {/* Log Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => toggleLogExpansion(log._id || "")}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(log.status)}
                          {getTypeIcon(log.promptType)}
                          <span className="text-xs font-medium text-gray-600 capitalize">
                            {log.promptType}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                            {log.provider}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 font-medium mb-1 line-clamp-2">
                          {log.prompt}
                        </p>
                        {log.classification && (
                          <p className="text-xs text-gray-600">
                            Classified as: <span className="font-medium">{log.classification.type}</span>
                            {log.classification.editType && (
                              <> ({log.classification.editType})</>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {log.tokens?.totalTokens?.toLocaleString() || 0} tokens
                        </div>
                        <div className="text-xs text-gray-600">
                          ${log.tokens?.estimatedCost?.toFixed(6) || "0.000000"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                      {/* Request Details */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">PROMPT</h4>
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{log.prompt}</p>
                        </div>
                      </div>

                      {/* Response */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">RESPONSE</h4>
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">
                            {log.response?.content || "No response"}
                          </p>
                        </div>
                      </div>

                      {/* Classification */}
                      {log.classification && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 mb-2">CLASSIFICATION</h4>
                          <div className="bg-white p-3 rounded border border-gray-200">
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Type:</span> {log.classification.type}
                              {log.classification.editType && (
                                <> ({log.classification.editType})</>
                              )}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {log.classification.explanation}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Token Details */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-600">Prompt Tokens</p>
                          <p className="text-sm font-semibold">{log.tokens?.promptTokens || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Completion Tokens</p>
                          <p className="text-sm font-semibold">{log.tokens?.completionTokens || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Total Cost</p>
                          <p className="text-sm font-semibold">
                            ${log.tokens?.estimatedCost?.toFixed(6) || "0.000000"}
                          </p>
                        </div>
                      </div>

                      {/* Changes Applied */}
                      {log.changesApplied && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 mb-2">CHANGES APPLIED</h4>
                          <div className="bg-white p-3 rounded border border-gray-200">
                            <p className="text-sm text-gray-900">
                              Applied: {log.changesApplied.applied ? "Yes" : "No"}
                            </p>
                            {log.changesApplied.committed && (
                              <p className="text-sm text-gray-600 mt-1">
                                Committed: {log.changesApplied.commitSha?.substring(0, 7)}
                              </p>
                            )}
                            {log.changesApplied.filesModified && log.changesApplied.filesModified.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-600 mb-1">Files Modified:</p>
                                <ul className="list-disc list-inside text-xs text-gray-700">
                                  {log.changesApplied.filesModified.map((file, idx) => (
                                    <li key={idx}>{file}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Error */}
                      {log.error && (
                        <div>
                          <h4 className="text-xs font-semibold text-red-700 mb-2">ERROR</h4>
                          <div className="bg-red-50 p-3 rounded border border-red-200">
                            <p className="text-sm text-red-900">{log.error}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && total > limit && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * limit >= total}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UsagePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <UsageContent />
    </Suspense>
  );
}

