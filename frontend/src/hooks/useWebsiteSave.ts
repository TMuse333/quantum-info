"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useWebsiteStore from "@/stores/websiteStore";
import { useComponentEditor } from "@/context/context";
import { useEditHistoryStore } from "@/stores/editHistoryStore";
import { validateWebsiteData, formatValidationErrors } from "@/lib/validation/websiteData";
import { GITHUB_CONFIG } from "@/lib/config";

export function useWebsiteSave() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { websiteData } = useWebsiteStore();
  const {
    previewStructuralChanges,
    setPreviewStructuralChanges,
    recentOpenAIEdit,
    setRecentOpenAIEdit,
  } = useComponentEditor();

  const [isSaving, setIsSaving] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [originalWebsiteData, setOriginalWebsiteData] = useState(websiteData);

  const handleSave = () => {
    setShowCommitModal(true);
  };

  const handleConfirmSave = async (commitMessage: string) => {
    const { REPO_OWNER, REPO_NAME, CURRENT_BRANCH } = GITHUB_CONFIG;

    // Get branch from search params or default to CURRENT_BRANCH
    const branch = searchParams.get("branch") || CURRENT_BRANCH;

    // Check for dry run mode (via URL param or localStorage flag)
    const dryRunParam = searchParams.get("dryRun");
    const dryRunFlag = localStorage.getItem("save-dry-run") === "true";
    const dryRun = dryRunParam === "true" || dryRunFlag;

    if (dryRun) {
      console.log("🧪 [DRY RUN] Save mode enabled - No GitHub API calls will be made");
      console.log("🧪 [DRY RUN] To disable, remove ?dryRun=true from URL or run: localStorage.removeItem('save-dry-run')");
    }

    setIsSaving(true);

    try {
      // Use unified store
      const store = useWebsiteStore.getState();

      if (!store.websiteData) {
        throw new Error("No website data to save");
      }

      // Validate website data before saving
      const validation = validateWebsiteData(store.websiteData);
      if (!validation.valid) {
        const errorMessage = formatValidationErrors(validation);
        console.error("❌ [useWebsiteSave] Validation failed:", errorMessage);
        alert(`Cannot save - validation failed:\n\n${errorMessage}`);
        setIsSaving(false);
        setShowCommitModal(false);
        return;
      }

      // Log warnings if any (non-blocking)
      if (validation.warnings.length > 0) {
        console.warn("⚠️ [useWebsiteSave] Validation warnings:", validation.warnings);
      }

      // Use store's save method (simpler - handles commit and reload)
      // But first handle structural changes if any
      let finalCommitMessage = commitMessage;

      if (previewStructuralChanges) {
        // For structural changes, we need to commit multiple files
        const websiteDataPath = process.env.NEXT_PUBLIC_REPO_TYPE === 'monorepo'
          ? 'frontend/src/data/websiteData.json'
          : 'src/data/websiteData.json';

        const serialized = JSON.stringify(store.websiteData, null, 2);

        const filesToCommit = [
          ...previewStructuralChanges.files.map(file => ({
            path: file.path,
            content: file.changes,
            encoding: 'utf-8' as const,
          })),
          {
            path: websiteDataPath,
            content: serialized,
            encoding: 'utf-8' as const,
          }
        ];

        finalCommitMessage = `Claude Code: ${previewStructuralChanges.originalPrompt}\n\n${commitMessage}`;

        let githubData;
        if (dryRun) {
          // DRY RUN: Simulate API response
          console.log("🧪 [DRY RUN] Would call: POST /api/versions/create-github");
          console.log("🧪 [DRY RUN] Would commit files:", filesToCommit.map(f => f.path));
          console.log("🧪 [DRY RUN] Would use commit message:", finalCommitMessage);
          githubData = {
            commitSha: "dry-run-commit-sha-" + Date.now(),
            versionNumber: (store.websiteData?.currentVersionNumber || 0) + 1,
          };
          console.log(`🧪 [DRY RUN] Simulated commit: ${githubData.commitSha}`);
        } else {
          const githubResponse = await fetch('/api/versions/create-github', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              commitMessage: finalCommitMessage,
              branch,
              files: filesToCommit,
            }),
          });

          if (!githubResponse.ok) {
            const errorData = await githubResponse.json().catch(() => ({ error: 'Failed to commit to GitHub' }));
            throw new Error(errorData.error || 'Failed to commit to GitHub');
          }

          githubData = await githubResponse.json();
          console.log(`✅ [useWebsiteSave] Committed to GitHub: ${githubData.commitSha}`);
        }

        // Also write to local file so it stays in sync (skip in dry run)
        if (!dryRun) {
          try {
            await fetch('/api/files/write-local', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: serialized }),
            });
            console.log(`✅ [useWebsiteSave] Updated local file: ${websiteDataPath}`);
          } catch (localWriteError) {
            console.warn(`⚠️ [useWebsiteSave] Failed to write local file (non-fatal):`, localWriteError);
          }
        } else {
          console.log(`🧪 [DRY RUN] Would write local file: ${websiteDataPath}`);
        }

        // Update store with the saved data (no reload needed - data is already in sync)
        // The store already has the latest data since we just saved it
        const updatedWebsiteData = {
          ...store.websiteData,
          currentVersionNumber: parseInt(githubData.versionNumber),
          updatedAt: new Date(),
        };
        store.setWebsiteData(updatedWebsiteData);

        // Update URL to show the new version (no page reload)
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete('version'); // Remove version param to show latest
        const newUrl = `${window.location.pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`;
        window.history.replaceState({}, '', newUrl);
        console.log(`🔄 [useWebsiteSave] Updated URL to show latest version (commit: ${githubData.commitSha}, no reload)`);

        setPreviewStructuralChanges(null);
      } else {
        // Simple save - use store's method
        if (recentOpenAIEdit) {
          finalCommitMessage = `OpenAI Edit: ${recentOpenAIEdit.prompt}\n\n${commitMessage}`;
        }

        let saveResult;
        if (dryRun) {
          // DRY RUN: Simulate save
          console.log("🧪 [DRY RUN] Would call: store.saveToGitHub()");
          console.log("🧪 [DRY RUN] Branch:", branch);
          console.log("🧪 [DRY RUN] Commit message:", finalCommitMessage);
          saveResult = {
            commitSha: "dry-run-commit-sha-" + Date.now(),
            versionNumber: (store.websiteData?.currentVersionNumber || 0) + 1,
          };
          console.log(`🧪 [DRY RUN] Simulated save result:`, saveResult);
          
          // Still update store state for testing (but mark as dry run)
          const updatedWebsiteData = {
            ...store.websiteData,
            currentVersionNumber: saveResult.versionNumber,
            updatedAt: new Date(),
          };
          store.setWebsiteData(updatedWebsiteData);
          console.log(`🧪 [DRY RUN] Updated store state (for testing)`);
        } else {
          saveResult = await store.saveToGitHub(branch, finalCommitMessage);
        }

        // Update URL to show the new version
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete('version'); // Remove version param to show latest
        const newUrl = `${window.location.pathname}?${newSearchParams.toString()}`;
        window.history.replaceState({}, '', newUrl);
        console.log(`🔄 [useWebsiteSave] Updated URL to show latest version (commit: ${saveResult.commitSha})`);

        if (recentOpenAIEdit) {
          setRecentOpenAIEdit(null);
        }
      }

      // Keep original data snapshot for comparison
      const latestWebsiteData = useWebsiteStore.getState().websiteData;
      if (latestWebsiteData) {
        setOriginalWebsiteData(JSON.parse(JSON.stringify(latestWebsiteData)));
      }

      // Mark as saved AFTER reload completes
      // Since automatic theme sync was removed, no new edits should be added after reload
      // Use a short delay to ensure reload state is settled
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const editHistory = useEditHistoryStore.getState();
      const saveTimestamp = Date.now();
      
      // Get current unsaved edits count before marking as saved (for logging)
      const unsavedBefore = editHistory.getUnsavedEdits().length;
      
      editHistory.markAsSaved();
      
      // Verify unsaved edits are cleared
      const unsavedAfter = editHistory.getUnsavedEdits().length;
      console.log(`💾 [useWebsiteSave] Marked edits as saved at timestamp: ${saveTimestamp}`);
      console.log(`💾 [useWebsiteSave] Unsaved edits before: ${unsavedBefore}, after: ${unsavedAfter}`);
      
      if (unsavedAfter > 0) {
        console.warn(`⚠️ [useWebsiteSave] Still have ${unsavedAfter} unsaved edits after marking as saved. These were likely added after the save.`);
      }

      // The store's saveToGitHub already updates the state with the saved data
      // No need to reload from GitHub - data is already in sync
      
      setSaveSuccess(true);
      setShowCommitModal(false);

      if (dryRun) {
        console.log("🧪 [DRY RUN] Save simulation complete!");
        console.log("🧪 [DRY RUN] No actual GitHub API calls were made");
        console.log("🧪 [DRY RUN] Store state was updated for testing purposes");
        alert("🧪 DRY RUN MODE\n\nSave simulation complete! No actual GitHub API calls were made.\n\nTo disable dry run, remove ?dryRun=true from URL or run:\nlocalStorage.removeItem('save-dry-run')");
      }

      // Dispatch event for any listeners (like version control panel)
      window.dispatchEvent(new CustomEvent("versionCreated"));

      // Update URL to remove version param (shows latest version)
      // Use replaceState instead of href to avoid page reload
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('version');
      const newUrl = `${window.location.pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
      console.log(`🔄 [useWebsiteSave] Updated URL to show latest version (no page reload)`);
    } catch (error) {
      console.error("Error saving website:", error);
      alert(`Failed to save: ${error instanceof Error ? error.message : "Unknown error"}`);
      setShowCommitModal(false);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    showCommitModal,
    setShowCommitModal,
    saveSuccess,
    setSaveSuccess,
    handleSave,
    handleConfirmSave,
    originalWebsiteData,
  };
}
