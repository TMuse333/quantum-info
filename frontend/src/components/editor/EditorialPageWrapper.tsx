"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";

import { useRouter, useSearchParams } from "next/navigation";
import { useComponentEditor } from "@/context";
import useWebsiteStore from "@/stores/websiteStore";
import Dashboard from "@/components/editor/dashboard/dashboard";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { PageSwitcher } from "@/components/editor/pageSwitcher/pageSwitcher";
import CommitMessageModal from "@/components/editor/commitMessageModal/commitMessageModal";
import { useWebsiteSave } from "@/hooks/useWebsiteSave";
import { HelperBotButton } from "@/components/editor/helperBot/HelperBotButton";
import { HelperBotPanel } from "@/components/editor/helperBot/HelperBotPanel";
import WebsiteDataDebugPanel from "@/components/editor/debug/WebsiteDataDebugPanel";
import { WebsitePage } from '@/types/editorial';

export interface ComponentInstance {
  id: string;
  type: string;
  category?: string;
  componentCategory?: string;
  order: number;
  props: Record<string, any>;
  context?: string;
}

export interface EditorialPageWrapperProps {
  pageSlug: string;
  components: ComponentInstance[];
  pageData?: {
    pageName?: string;
    slug?: string;
  };
  renderComponent?: (instance: ComponentInstance) => React.ReactNode;
}

export default function EditorialPageWrapper({
  pageSlug,
  components,
  pageData,
  renderComponent,
}: EditorialPageWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { editorMode } = useComponentEditor();

  // Direct store access - no wrapper hooks needed
  const loadFromGitHub = useWebsiteStore((state) => state.loadFromGitHub);
  const websiteData = useWebsiteStore((state) => state.websiteData);
  const isLoading = useWebsiteStore((state) => state.isLoading);
  const loadError = useWebsiteStore((state) => state.error);
  const setCurrentPageSlug = useWebsiteStore((state) => state.setCurrentPageSlug);
  const hasUnsavedChanges = useWebsiteStore((state) => state.hasUnsavedChanges);

  // Track if we've already loaded to prevent re-loading on re-renders
  const hasLoadedRef = useRef(false);

  // Load data on mount ONLY (never reload on re-renders)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // If we already have data, don't reload
    if (websiteData) {
      console.log('📦 [EditorialPageWrapper] Data already exists, skipping load');
      hasLoadedRef.current = true;
      return;
    }

    // If we've already attempted to load, don't reload
    if (hasLoadedRef.current) {
      console.log('📦 [EditorialPageWrapper] Already loaded once, skipping reload');
      return;
    }

    // Mark as loaded to prevent future loads
    hasLoadedRef.current = true;

    // Get optional version from URL
    const versionParam = searchParams.get('version');
    const versionNumber = versionParam ? parseInt(versionParam) : undefined;

    console.log('📦 [EditorialPageWrapper] Initial load from GitHub (one-time only)');
    // Load from GitHub (uses config defaults)
    loadFromGitHub(undefined, versionNumber);
  }, []); // Empty deps - only run once on mount, but we guard with ref to prevent re-loads

  // CRITICAL: Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
        return ''; // For older browsers
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);
  const {
    isSaving,
    showCommitModal,
    setShowCommitModal,
    saveSuccess,
    setSaveSuccess,
    handleSave,
    handleConfirmSave,
  } = useWebsiteSave();

  // Auto-close success modal after 3 seconds
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess, setSaveSuccess]);

  // Set current page when slug changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isLoading) return;

    // Normalize page slug (handle "/" -> "index")
    const normalizedPageSlug = pageSlug === '/' || pageSlug === '' ? 'index' : pageSlug;

    // Set current page slug in store
    setCurrentPageSlug(normalizedPageSlug);
  }, [pageSlug, isLoading, setCurrentPageSlug]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <div className="text-lg font-medium text-gray-700">Loading your website...</div>
        </div>
      </div>
    );
  }

  // Show error if data couldn't be loaded from GitHub
  if (loadError && !websiteData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg max-w-md">
          <h2 className="text-xl font-semibold text-red-800 mb-2">No Data Retrieved</h2>
          <p className="text-red-600 mb-4">{loadError}</p>
          <p className="text-sm text-gray-600">
            Using fallback data. Please check your repository settings or network connection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Dashboard is always visible so users can toggle editor mode */}
      <Dashboard />
      
      {/* PageSwitcher is always visible (like parent project) */}
      <PageSwitcher />
      
      {/* Other editor UI only shows when editor mode is on */}
      {editorMode && (
        <>
          <HelperBotButton />
          <HelperBotPanel />
        </>
      )}

      {/* Debug panel - always visible */}
      <WebsiteDataDebugPanel />

      {/* Success Modal */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setSaveSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Save Successful!
                </h3>
                <p className="text-gray-600 mb-4">
                  Your changes have been successfully saved to GitHub.
                </p>
                <p className="text-sm text-gray-500">
                  Reloading page to show latest version...
                </p>
                <button
                  onClick={() => setSaveSuccess(false)}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CommitMessageModal
        isOpen={showCommitModal}
        onClose={() => setShowCommitModal(false)}
        onConfirm={handleConfirmSave}
        isSaving={isSaving}
      />

      <div className={editorMode ? "pt-16" : ""}>
        {(() => {
          // Get components from new store (preferred), fallback to passed components prop
          let componentsToRender: ComponentInstance[] = [];
          
          // Try to get from new store first
          if (websiteData) {
            const pages = websiteData.pages;
            const normalizedPageSlug = pageSlug === '/' || pageSlug === '' ? 'index' : pageSlug;
            const currentPage = pages[normalizedPageSlug] || pages['index'] || null;

            if (currentPage?.components) {
              componentsToRender = currentPage.components as ComponentInstance[];
            }
          }
          
          // Final fallback to passed components prop
          if (componentsToRender.length === 0 && components.length > 0) {
            componentsToRender = components;
          }
          
          if (componentsToRender.length === 0) {
            return (
              <div className="text-center py-12">
                <p className="text-gray-500">No components on this page.</p>
              </div>
            );
          }
          
          return (
            <div>
              {componentsToRender
                .sort((a: any, b: any) => a.order - b.order)
                .map((instance: any) => {
                  if (renderComponent) {
                    return <React.Fragment key={instance.id}>{renderComponent(instance)}</React.Fragment>;
                  }
                  return (
                    <div key={instance.id} className="component-wrapper" data-component-id={instance.id}>
                      <p className="text-gray-400">Component: {instance.type}</p>
                    </div>
                  );
                })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

