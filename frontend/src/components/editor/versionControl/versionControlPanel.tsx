"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useWebsiteStore from "@/stores/websiteStore";
import { Clock, CheckCircle2, XCircle, Code, RefreshCw, GitBranch } from "lucide-react";
import type { WebsiteVersion } from '@/types/editorial';
import { useEditHistoryStore } from "@/stores/editHistoryStore";
import { useComponentEditor } from "@/context/context";
import { useWebsiteSave } from "@/hooks/useWebsiteSave";
import CommitMessageModal from "@/components/editor/commitMessageModal/commitMessageModal";
import { GITHUB_CONFIG } from "@/lib/config";

export default function VersionControlPanel() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const websiteData = useWebsiteStore((state) => state.websiteData);
  const loadFromGitHub = useWebsiteStore((state) => state.loadFromGitHub); // Add this to use proper transformation
  const websiteId = searchParams.get("id");
  const editHistory = useEditHistoryStore();
  const { fileChangeHistory } = useComponentEditor();
  const { handleSave, handleConfirmSave, isSaving, showCommitModal, setShowCommitModal, saveSuccess } = useWebsiteSave();

  // Get change tracking from store (simpler - no component-level tracking needed!)
  const hasStoreChanges = useWebsiteStore((state) => state.hasUnsavedChanges);

  // Check if there are unsaved changes (from either old edit history OR new store)
  const unsavedEdits = editHistory.getUnsavedEdits();
  const hasUnsavedChanges = unsavedEdits.length > 0 || fileChangeHistory.length > 0 || hasStoreChanges;

  // Debug logging
  useEffect(() => {
    console.log("🔘 [VersionControl] Save button state:", {
      hasStoreChanges,
      unsavedEditsCount: unsavedEdits.length,
      fileChangeHistoryCount: fileChangeHistory.length,
      hasUnsavedChanges,
      buttonShouldBeEnabled: hasUnsavedChanges && !isSaving,
    });
  }, [hasStoreChanges, unsavedEdits.length, fileChangeHistory.length, hasUnsavedChanges, isSaving]);

  // Get repo info from config (no state needed!)
  const { REPO_OWNER, REPO_NAME, CURRENT_BRANCH } = GITHUB_CONFIG;

  const [versions, setVersions] = useState<WebsiteVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchingVersion, setSwitchingVersion] = useState<number | null>(null);

  useEffect(() => {
    // Fetch versions on mount
    fetchVersions();
  }, []); // Only run once on mount

  // Listen for version creation events to refresh the list
  useEffect(() => {
    const handleVersionCreated = () => {
      fetchVersions();
    };

    window.addEventListener('versionCreated', handleVersionCreated);
    return () => {
      window.removeEventListener('versionCreated', handleVersionCreated);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchVersions = async () => {
    console.log("📋 [VersionControl] Fetching versions from GitHub");

    setLoading(true);
    try {
      // Get branch from search params or default to CURRENT_BRANCH
      const branch = searchParams.get("branch") || CURRENT_BRANCH;

      // Fetch from GitHub (no params needed - API knows from config)
      const response = await fetch(`/api/versions/list-github?branch=${branch}`);
      if (response.ok) {
        const data = await response.json();
        // Transform GitHub commits to WebsiteVersion format
        const versions: WebsiteVersion[] = data.versions.map((v: any, index: number) => ({
          versionNumber: v.versionNumber,
          websiteData: null, // Will load on demand
          createdAt: new Date(v.date),
          createdBy: v.author,
          changeDescription: v.message,
          status: 'implemented' as const, // All commits are implemented
          implementedAt: new Date(v.date),
          commitSha: v.commitSha, // Store commit SHA
        }));
        setVersions(versions);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to fetch versions from GitHub:", errorData.error);
        // Show error but don't fail completely
        setVersions([]);
      }
    } catch (error) {
      console.error("Error fetching versions:", error);
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchVersion = async (versionNumber: number) => {
    setSwitchingVersion(versionNumber);

    try {
      // ✅ FIX: Use loadFromGitHub which has proper data transformation logic
      // This ensures pages arrays are converted to objects, dates are parsed, etc.
      await loadFromGitHub(CURRENT_BRANCH, versionNumber);

      // Clear localStorage and sessionStorage to force fresh load
      localStorage.removeItem("website-master-store");
      sessionStorage.removeItem(`last-loaded-version-${REPO_OWNER}-${REPO_NAME}`);

      // Navigate to editor with version param - this will trigger UI refresh
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('version', versionNumber.toString());
      window.location.href = currentUrl.pathname + currentUrl.search; // Use full reload to ensure fresh data
    } catch (error) {
      console.error("❌ [VersionControl] Error switching version:", error);
      alert(`Failed to load version: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSwitchingVersion(null);
    }
  };

  const getStatusIcon = (status: WebsiteVersion["status"]) => {
    switch (status) {
      case "implemented":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "confirmed":
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
      case "draft":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: WebsiteVersion["status"]) => {
    switch (status) {
      case "implemented":
        return "bg-green-100 text-green-700";
      case "confirmed":
        return "bg-blue-100 text-blue-700";
      case "draft":
        return "bg-yellow-100 text-yellow-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-600 mt-2">Loading versions...</p>
      </div>
    );
  }

  // Get current version from URL param (most accurate), websiteData, or latest
  const urlVersion = searchParams.get("version");
  const currentVersion = urlVersion 
    ? parseInt(urlVersion, 10) 
    : (typeof websiteData?.currentVersionNumber === 'number' 
        ? websiteData.currentVersionNumber 
        : (versions.length > 0 ? versions[0].versionNumber : 0));
  
  // Ensure currentVersion is a valid number (not NaN)
  const safeCurrentVersion = isNaN(currentVersion) ? (versions.length > 0 ? versions[0].versionNumber : 0) : currentVersion;
  const sortedVersions = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Code className="w-5 h-5 text-[#0099cc]" />
            Version Control
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title={hasUnsavedChanges ? "Save your changes" : "No unsaved changes"}
            >
              <GitBranch className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Current Changes"}
            </button>
            <button
              onClick={fetchVersions}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Current: <span className="font-semibold text-[#0099cc]">v{safeCurrentVersion}</span>
          {hasUnsavedChanges && (
            <span className="ml-3 text-xs text-orange-600 font-medium">
              • {hasStoreChanges ? 'Unsaved component changes' : `${unsavedEdits.length} unsaved edit${unsavedEdits.length !== 1 ? 's' : ''}`}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Working on: <span className="font-mono text-yellow-600">{CURRENT_BRANCH}</span> branch
          {' • '}Use the Deploy tab to publish to production
        </p>
      </div>

      {/* Versions List */}
      <div className="flex-1 overflow-y-auto p-4">
        {sortedVersions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No versions yet</p>
            <p className="text-xs mt-2">Versions will appear here after you save changes.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedVersions.map((version) => {
              const isCurrent = version.versionNumber === safeCurrentVersion;
              const isSwitching = switchingVersion === version.versionNumber;
              
              return (
                <div
                  key={version.versionNumber}
                  className={`p-3 rounded-lg border transition-all ${
                    isCurrent
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(version.status)}
                      <span className="font-semibold text-gray-900">
                        Version {version.versionNumber}
                      </span>
                      {isCurrent && (
                        <span className="text-xs px-2 py-0.5 bg-[#0099cc] text-white rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(version.status)}`}>
                      {version.status}
                    </span>
                  </div>
                  
                  {version.changeDescription && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {version.changeDescription}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>
                      {version.createdBy && `By ${version.createdBy}`}
                    </span>
                    <span>
                      {new Date(version.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {!isCurrent && (
                    <button
                      onClick={() => handleSwitchVersion(version.versionNumber)}
                      disabled={isSwitching}
                      className="w-full mt-2 px-3 py-1.5 text-xs font-medium bg-[#0099cc] text-white rounded-lg hover:bg-[#0088bb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSwitching ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Loading...
                        </>
                      ) : (
                        'Switch to This Version'
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {sortedVersions.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-600">Total:</span>
              <span className="font-semibold ml-1">{sortedVersions.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Draft:</span>
              <span className="font-semibold text-yellow-600 ml-1">
                {sortedVersions.filter(v => v.status === 'draft').length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Implemented:</span>
              <span className="font-semibold text-green-600 ml-1">
                {sortedVersions.filter(v => v.status === 'implemented').length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Confirmed:</span>
              <span className="font-semibold text-blue-600 ml-1">
                {sortedVersions.filter(v => v.status === 'confirmed').length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Commit Message Modal */}
      <CommitMessageModal
        isOpen={showCommitModal}
        onClose={() => setShowCommitModal(false)}
        onConfirm={handleConfirmSave}
        isSaving={isSaving}
      />
    </div>
  );
}

