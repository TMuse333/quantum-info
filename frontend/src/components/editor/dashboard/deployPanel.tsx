"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Play, Beaker, Loader2, GitBranch, FileText } from 'lucide-react';
import useWebsiteStore from '@/stores/websiteStore';
import { useDeploymentHistoryStore, formatTimestamp, getStatusEmoji } from '@/stores/deploymentHistoryStore';
import { useDeploymentConfigStore } from '@/stores/deploymentConfigStore';
import AnimatedDeployModal from '@/components/deployment/AnimatedDeployModal';
import AppNameModal from './AppNameModal';
import DeployConfirmationModal from './DeployConfirmationModal';
import PreviewDataFilesModal from './PreviewDataFilesModal';
import { GITHUB_CONFIG } from '@/lib/config';

export default function DeployPanel() {
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showAppNameModal, setShowAppNameModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [pendingDryRun, setPendingDryRun] = useState(false);
  const [pendingPushToMain, setPendingPushToMain] = useState(false);

  // Only show test deployment options in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';

  const websiteData = useWebsiteStore((state) => state.websiteData);
  const hasUnsavedChanges = useWebsiteStore((state) => state.hasUnsavedChanges);
  const saveToGitHub = useWebsiteStore((state) => state.saveToGitHub);
  const deployments = useDeploymentHistoryStore((state) => state.deployments);
  const latestDeployment = deployments[0];

  // Deployment config from Zustand store
  const appName = useDeploymentConfigStore((state) => state.appName);
  const setAppName = useDeploymentConfigStore((state) => state.setAppName);
  const clearConfig = useDeploymentConfigStore((state) => state.clearConfig);

  // Modal state from Zustand (survives re-renders!)
  const isModalOpen = useDeploymentHistoryStore((state) => state.isModalOpen);
  const currentDryRun = useDeploymentHistoryStore((state) => state.currentDryRun);
  const setIsModalOpen = useDeploymentHistoryStore((state) => state.setModalOpen);
  const setCurrentDryRun = useDeploymentHistoryStore((state) => state.setDryRun);

  const handleDeploy = async (dryRun: boolean = false) => {
    console.log('🚀 [DEPLOY] Starting deployment flow...');

    // STEP 1: Check if app name is set
    if (!appName) {
      console.log('📝 [DEPLOY] No app name found, prompting user...');
      setPendingDryRun(dryRun);
      setPendingPushToMain(false);
      setShowAppNameModal(true);
      return;
    }

    // STEP 2: Show confirmation modal
    console.log('✅ [DEPLOY] App name exists:', appName);
    setPendingDryRun(dryRun);
    setPendingPushToMain(false);
    setShowConfirmationModal(true);
  };

  const handlePushToMain = async (dryRun: boolean = false) => {
    console.log('📦 [PUSH TO MAIN] Starting push to main flow...');

    // No app name needed for push to main (no Vercel deployment)
    setPendingDryRun(dryRun);
    setPendingPushToMain(true);
    setShowConfirmationModal(true);
  };

  const handleSmartDeploy = async (dryRun: boolean = false) => {
    console.log('🤖 [SMART DEPLOY] Checking deployment type...');
    setIsAutoSaving(true);

    try {
      // Check if this is the first deployment
      const response = await fetch('/api/production/check-first-deploy');
      const data = await response.json();

      console.log(`🤖 [SMART DEPLOY] First deploy: ${data.isFirstDeploy}, Latest version: ${data.latestVersion}`);

      if (data.isFirstDeploy) {
        // First deployment - use Vercel API (Full Deploy)
        console.log('🆕 [SMART DEPLOY] First deployment detected - using Vercel API');
        setIsAutoSaving(false);
        await handleDeploy(dryRun);
      } else {
        // Subsequent deployment - use GitHub only (Push to Main)
        console.log('🔄 [SMART DEPLOY] Subsequent deployment detected - using GitHub push');
        setIsAutoSaving(false);
        await handlePushToMain(dryRun);
      }
    } catch (error) {
      console.error('❌ [SMART DEPLOY] Error checking deployment type:', error);
      setIsAutoSaving(false);
      alert('Failed to determine deployment type. Please use Full Deploy or Push to Main manually.');
    }
  };

  const handleAppNameConfirm = (name: string) => {
    console.log('📝 [DEPLOY] App name confirmed:', name);
    try {
      setAppName(name);
      setShowAppNameModal(false);
      // Show confirmation modal next
      setShowConfirmationModal(true);
    } catch (error) {
      // App name already set - this shouldn't happen if modal logic is correct
      console.error('❌ [DEPLOY] Cannot change app name:', error);
      alert(error instanceof Error ? error.message : 'App name cannot be changed once set');
      setShowAppNameModal(false);
    }
  };

  const handleDeploymentConfirm = async () => {
    console.log('✅ [DEPLOY] Deployment confirmed, proceeding...');
    setShowConfirmationModal(false);

    const dryRun = pendingDryRun;
    const pushToMain = pendingPushToMain;

    // STEP 3: Auto-save if needed (but skip for production deployments)
    console.log('🔄 [AUTO-SAVE] Checking for unsaved changes before deployment...');

    // Skip auto-save for production deployments (pushToMain=true) because:
    // 1. The production push already includes all current changes
    // 2. Auto-save to experiment branch causes duplicate Vercel deployments
    // 3. Keeps experiment branch clean and deployment history simple
    if (hasUnsavedChanges && !pushToMain) {
      console.log('✅ [AUTO-SAVE] Unsaved changes detected, auto-saving before deployment...');
      setIsAutoSaving(true);

      try {
        // Get next version number for commit message
        const nextVersion = (deployments[0]?.version || 0) + 1;
        const commitMessage = `Auto-save before deployment v${nextVersion}`;

        console.log(`💾 [AUTO-SAVE] Saving to GitHub with message: "${commitMessage}"`);

        // Auto-save to GitHub
        await saveToGitHub(GITHUB_CONFIG.CURRENT_BRANCH, commitMessage);

        console.log('✅ [AUTO-SAVE] Auto-save completed successfully');
      } catch (error) {
        console.error('❌ [AUTO-SAVE] Auto-save failed:', error);
        setIsAutoSaving(false);
        alert('Failed to save changes before deployment. Please save manually and try again.');
        return; // Abort deployment
      } finally {
        setIsAutoSaving(false);
      }
    } else if (hasUnsavedChanges && pushToMain) {
      console.log('⏭️ [AUTO-SAVE] Skipping auto-save for production deployment - changes will be included in main push');
    } else {
      console.log('✅ [AUTO-SAVE] No unsaved changes detected, proceeding directly to deployment');
    }

    // STEP 4: Open deployment modal
    console.log(`🎬 [DEPLOY] Opening ${pushToMain ? 'push to main' : 'deployment'} modal...`);
    setCurrentDryRun(dryRun);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full h-full flex flex-col gap-6 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-purple-500/20">
          <Rocket className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Production Deployment</h2>
          <p className="text-gray-400 text-sm">Deploy your website to production</p>
        </div>
      </div>

      {/* Smart Deploy Button - SaaS MVP */}
      <motion.div
        className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-6 border border-purple-500/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Rocket className="w-5 h-5 text-purple-400" />
          Quick Deploy
        </h3>
        <p className="text-sm text-gray-300 mb-4">
          Automatically detects if this is your first deployment or an update
        </p>
        <motion.button
          type="button"
          onClick={() => handleSmartDeploy(false)}
          disabled={isAutoSaving}
          className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
            isAutoSaving
              ? 'border-yellow-500/50 bg-yellow-500/10 cursor-not-allowed'
              : 'border-purple-500 bg-purple-600 hover:bg-purple-700 hover:border-purple-400'
          }`}
          whileHover={!isAutoSaving ? { scale: 1.02 } : {}}
          whileTap={!isAutoSaving ? { scale: 0.98 } : {}}
        >
          <div className="flex items-center justify-center gap-3">
            {isAutoSaving ? (
              <>
                <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
                <span className="font-bold text-white text-lg">Checking...</span>
              </>
            ) : (
              <>
                <Rocket className="w-6 h-6 text-white" />
                <span className="font-bold text-white text-lg">Deploy to Production</span>
              </>
            )}
          </div>
        </motion.button>
      </motion.div>

      {/* Unsaved Changes Info */}
      {hasUnsavedChanges && !isAutoSaving && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <div className="text-yellow-400 text-xl">⚠️</div>
            <div>
              <p className="text-yellow-200 font-medium">You have unsaved changes</p>
              <p className="text-yellow-200/70 text-sm">
                Your changes will be automatically saved to GitHub before deployment
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Advanced Deploy Options */}
      <motion.div
        className="bg-gray-800/50 rounded-lg p-6 border border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Advanced Options</h3>
            <p className="text-xs text-gray-400 mt-1">Manual control for specific deployment needs</p>
          </div>
          {appName && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                App: <span className="font-mono text-purple-400">{appName}</span>
              </span>
              <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded" title="App name is locked and cannot be changed">
                🔒 Locked
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Real Deploy Button - Always shown */}
          <motion.button
            type="button"
            onClick={() => handleDeploy(false)}
            disabled={isAutoSaving}
            className={`relative overflow-hidden p-6 rounded-lg border-2 transition-all duration-200 ${
              isAutoSaving
                ? 'border-yellow-500/50 bg-yellow-500/10 cursor-not-allowed'
                : 'border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20'
            }`}
            whileHover={!isAutoSaving ? { scale: 1.02 } : {}}
            whileTap={!isAutoSaving ? { scale: 0.98 } : {}}
          >
            <div className="flex items-center gap-3 mb-2">
              {isAutoSaving ? (
                <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
              ) : (
                <Play className="w-5 h-5 text-purple-400" />
              )}
              <span className="font-semibold text-white">
                {isAutoSaving ? 'Saving...' : 'Full Deploy'}
              </span>
            </div>
            <p className="text-sm text-gray-400">
              {isAutoSaving
                ? 'Auto-saving changes'
                : 'GitHub + Vercel'}
            </p>
          </motion.button>

          {/* Push to Main Button - Only in development */}
          {isDevelopment && (
            <motion.button
              type="button"
              onClick={() => handlePushToMain(false)}
              disabled={isAutoSaving}
              className={`relative overflow-hidden p-6 rounded-lg border-2 transition-all duration-200 ${
                isAutoSaving
                  ? 'border-gray-500/50 bg-gray-500/10 cursor-not-allowed'
                  : 'border-green-500/50 bg-green-500/10 hover:bg-green-500/20'
              }`}
              whileHover={!isAutoSaving ? { scale: 1.02 } : {}}
              whileTap={!isAutoSaving ? { scale: 0.98 } : {}}
            >
              <div className="flex items-center gap-3 mb-2">
                {isAutoSaving ? (
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                ) : (
                  <GitBranch className="w-5 h-5 text-green-400" />
                )}
                <span className="font-semibold text-white">
                  {isAutoSaving ? 'Saving...' : 'Push to Main'}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                {isAutoSaving
                  ? 'Auto-saving changes'
                  : 'GitHub only (no Vercel)'}
              </p>
            </motion.button>
          )}

          {/* Dry Run Button - Only in development */}
          {isDevelopment && (
            <motion.button
              type="button"
              onClick={() => handleDeploy(true)}
              disabled={isAutoSaving}
              className={`relative overflow-hidden p-6 rounded-lg border-2 transition-all duration-200 ${
                isAutoSaving
                  ? 'border-gray-500/50 bg-gray-500/10 cursor-not-allowed'
                  : 'border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20'
              }`}
              whileHover={!isAutoSaving ? { scale: 1.02 } : {}}
              whileTap={!isAutoSaving ? { scale: 0.98 } : {}}
            >
              <div className="flex items-center gap-3 mb-2">
                {isAutoSaving ? (
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                ) : (
                  <Beaker className="w-5 h-5 text-blue-400" />
                )}
                <span className="font-semibold text-white">
                  {isAutoSaving ? 'Saving...' : 'Dry Run'}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                {isAutoSaving
                  ? 'Auto-saving changes'
                  : 'Test without deploying'}
              </p>
            </motion.button>
          )}

          {/* Preview Data Files Button - Only in development */}
          {isDevelopment && (
            <motion.button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              disabled={isAutoSaving}
              className={`relative overflow-hidden p-6 rounded-lg border-2 transition-all duration-200 ${
                isAutoSaving
                  ? 'border-gray-500/50 bg-gray-500/10 cursor-not-allowed'
                  : 'border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20'
              }`}
              whileHover={!isAutoSaving ? { scale: 1.02 } : {}}
              whileTap={!isAutoSaving ? { scale: 0.98 } : {}}
            >
              <div className="flex items-center gap-3 mb-2">
                {isAutoSaving ? (
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                ) : (
                  <FileText className="w-5 h-5 text-cyan-400" />
                )}
                <span className="font-semibold text-white">
                  Preview Data
                </span>
              </div>
              <p className="text-sm text-gray-400">
                View .data.ts files
              </p>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Latest Deployment */}
      {latestDeployment && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 rounded-lg p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Latest Deployment</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getStatusEmoji(latestDeployment.status)}</span>
                <div>
                  <p className="text-white font-medium">Version {latestDeployment.version}</p>
                  <p className="text-sm text-gray-400">{formatTimestamp(latestDeployment.timestamp)}</p>
                </div>
              </div>
              <div className={`
                px-3 py-1 rounded-full text-xs font-medium
                ${latestDeployment.status === 'success' ? 'bg-green-500/20 text-green-400' : ''}
                ${latestDeployment.status === 'failed' ? 'bg-red-500/20 text-red-400' : ''}
                ${latestDeployment.status === 'building' ? 'bg-blue-500/20 text-blue-400' : ''}
                ${latestDeployment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : ''}
              `}>
                {latestDeployment.status.toUpperCase()}
              </div>
            </div>

            {latestDeployment.deploymentUrl && (
              <a
                href={latestDeployment.deploymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                View deployment →
              </a>
            )}
          </div>
        </motion.div>
      )}

      {/* Deployment History */}
      {deployments.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 rounded-lg p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Recent Deployments</h3>

          <div className="space-y-2">
            {deployments.slice(1, 6).map((deployment) => (
              <div
                key={deployment.id}
                className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getStatusEmoji(deployment.status)}</span>
                  <div>
                    <p className="text-white text-sm font-medium">v{deployment.version}</p>
                    <p className="text-xs text-gray-500">{formatTimestamp(deployment.timestamp)}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {deployment.filesGenerated} files
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Animated Deployment Modal */}
      <AnimatedDeployModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        websiteData={websiteData}
        dryRun={currentDryRun}
        appName={appName || ''}
        pushToMain={pendingPushToMain}
      />

      {/* App Name Modal */}
      <AppNameModal
        isOpen={showAppNameModal}
        onConfirm={handleAppNameConfirm}
        onCancel={() => setShowAppNameModal(false)}
        existingAppName={appName!}
      />

      {/* Deployment Confirmation Modal */}
      <DeployConfirmationModal
        isOpen={showConfirmationModal}
        appName={appName || ''}
        onConfirm={handleDeploymentConfirm}
        onCancel={() => setShowConfirmationModal(false)}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {/* Preview Data Files Modal */}
      <PreviewDataFilesModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        websiteData={websiteData}
      />
    </div>
  );
}
