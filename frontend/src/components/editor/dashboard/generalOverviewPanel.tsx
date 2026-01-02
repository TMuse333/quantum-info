"use client";

import { useState, useEffect } from "react";
import { Palette, Save, RefreshCw, Info, CheckCircle2, History, GitBranch, FileText, Clock, Trash2, Plus, Edit, AlertCircle } from "lucide-react";
import useWebsiteStore from "@/stores/websiteStore";
import { GradientConfig } from "@/types/colors";
import { useComponentEditor } from "@/context/context";
import { useWebsiteSave } from "@/hooks/useWebsiteSave";
import CommitMessageModal from "@/components/editor/commitMessageModal/commitMessageModal";
import { useEditHistoryStore } from "@/stores/editHistoryStore";

export default function GeneralOverviewPanel() {
  const { websiteData, setWebsiteData } = useWebsiteStore();
  const { fileChangeHistory } = useComponentEditor();
  const { handleSave, handleConfirmSave, isSaving, showCommitModal, setShowCommitModal, saveSuccess } = useWebsiteSave();
  const editHistory = useEditHistoryStore();

  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [theme, setTheme] = useState({
    primary: "#3B82F6",
    text: "#000000",
    background: "#ffffff",
    bgLayoutType: "solid" as "radial" | "linear" | "solid",
  });

  // Check if there are unsaved changes in edit history
  const unsavedEdits = editHistory.getUnsavedEdits();
  const hasUnsavedChanges = unsavedEdits.length > 0 || fileChangeHistory.length > 0;

  // Initialize theme from websiteData
  useEffect(() => {
    console.log("🔴 [GeneralOverview] useEffect - websiteData:", {
      hasWebsiteData: !!websiteData,
      colorTheme: websiteData?.colorTheme,
      pages: websiteData?.pages ? Object.keys(websiteData.pages).length : 0,
    });

    if (websiteData?.colorTheme) {
      console.log("🔴 [GeneralOverview] Setting theme from websiteData.colorTheme:", websiteData.colorTheme);
      setTheme({
        primary: websiteData.colorTheme.primary,
        text: websiteData.colorTheme.text,
        background: websiteData.colorTheme.background,
        bgLayoutType: websiteData.colorTheme.bgLayout?.type || "solid",
      });
    } else {
      console.log("🔴 [GeneralOverview] No colorTheme in websiteData, trying to extract from first component");
      // Try to extract theme from first component on first page
      const pages = websiteData?.pages || {};
      const pageArray = Array.isArray(pages)
        ? pages
        : Object.values(pages);

      if (pageArray.length > 0 && pageArray[0].components && pageArray[0].components.length > 0) {
        const firstComponent = pageArray[0].components[0];
        const compProps = firstComponent.props || {};

        setTheme({
          primary: compProps.mainColor || "#3B82F6",
          text: compProps.textColor || "#000000",
          background: compProps.baseBgColor || "#ffffff",
          bgLayoutType: compProps.bgLayout?.type || "solid",
        });
      }
    }
  }, [websiteData?.colorTheme]);

  const handleSaveTheme = () => {
    if (!websiteData) {
      console.error("Cannot save theme: websiteData is null");
      return;
    }

    console.log("💾 Saving theme to ALL pages:", theme);

    // Capture "before" theme for tracking
    const beforeTheme = websiteData?.colorTheme;

    // Build the bgLayout config
    const bgLayout: GradientConfig = {
      type: theme.bgLayoutType,
      ...(theme.bgLayoutType === "radial" && {
        radialSize: websiteData.colorTheme?.bgLayout?.radialSize || "125% 125%",
        radialPosition: websiteData.colorTheme?.bgLayout?.radialPosition || "50% 0%",
        radialBaseStop: websiteData.colorTheme?.bgLayout?.radialBaseStop || 50,
      }),
      ...(theme.bgLayoutType === "linear" && {
        direction: websiteData.colorTheme?.bgLayout?.direction || "to bottom",
      }),
    };

    // Get all pages
    const pages = websiteData.pages || {};
    const pageArray = Array.isArray(pages)
      ? pages
      : Object.entries(pages).map(([key, value]: [string, any]) => ({
          ...value,
          slug: key,
        }));

    console.log(`🎨 Applying theme to ${pageArray.length} pages`);

    // Update ALL components across ALL pages
    const updatedPages = pageArray.map((page: any) => {
      if (!page.components || page.components.length === 0) {
        return page;
      }

      const updatedComponents = page.components.map((comp: any) => ({
        ...comp,
        props: {
          ...comp.props,
          mainColor: theme.primary,
          textColor: theme.text,
          baseBgColor: theme.background,
          bgLayout: bgLayout,
        },
      }));

      console.log(`  ✅ Updated ${updatedComponents.length} components on page: ${page.name || page.slug}`);

      return {
        ...page,
        components: updatedComponents,
      };
    });

    // Convert back to object format if needed
    const finalPages = Array.isArray(pages)
      ? updatedPages
      : updatedPages.reduce((acc: any, page: any) => {
          const slug = page.slug || page.id;
          acc[slug] = page;
          return acc;
        }, {});

    // Update websiteData with new theme and updated pages
    const updatedWebsiteData = {
      ...websiteData,
      colorTheme: {
        primary: theme.primary,
        text: theme.text,
        background: theme.background,
        bgLayout: bgLayout,
        updatedAt: new Date(),
        source: "manual" as const,
      },
      pages: finalPages,
      updatedAt: new Date(),
    };

    setWebsiteData(updatedWebsiteData);

    // Track the theme edit
    const themeChanges: any = {};
    if (beforeTheme?.primary !== theme.primary) {
      themeChanges.primary = { old: beforeTheme?.primary || '', new: theme.primary };
    }
    if (beforeTheme?.text !== theme.text) {
      themeChanges.text = { old: beforeTheme?.text || '', new: theme.text };
    }
    if (beforeTheme?.background !== theme.background) {
      themeChanges.background = { old: beforeTheme?.background || '', new: theme.background };
    }
    if (JSON.stringify(beforeTheme?.bgLayout) !== JSON.stringify(bgLayout)) {
      themeChanges.bgLayout = { old: beforeTheme?.bgLayout, new: bgLayout };
    }

    if (Object.keys(themeChanges).length > 0) {
      editHistory.addEdit({
        type: 'theme',
        pageSlug: 'all-pages',
        changes: {
          theme: themeChanges,
        },
        metadata: {
          source: 'manual',
          editMode: 'page-wide',
        },
      });
    }

    console.log("✅ Theme applied to ALL pages and components");
    setIsEditing(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleReset = () => {
    if (websiteData?.colorTheme) {
      setTheme({
        primary: websiteData.colorTheme.primary,
        text: websiteData.colorTheme.text,
        background: websiteData.colorTheme.background,
        bgLayoutType: websiteData.colorTheme.bgLayout?.type || "solid",
      });
    }
    setIsEditing(false);
  };

  const hasChanges = !websiteData?.colorTheme || (
    theme.primary !== websiteData.colorTheme.primary ||
    theme.text !== websiteData.colorTheme.text ||
    theme.background !== websiteData.colorTheme.background ||
    theme.bgLayoutType !== (websiteData.colorTheme.bgLayout?.type || "solid")
  );

  // Calculate total components across all pages
  const totalComponents = () => {
    if (!websiteData?.pages) return 0;
    return Object.values(websiteData.pages).reduce((sum: number, page: any) => {
      return sum + (page.components?.length || 0);
    }, 0);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Palette className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">General Overview</h2>
              <p className="text-sm text-gray-500">Manage your website's global color theme and settings</p>
            </div>
          </div>
        </div>

        {/* Color Theme Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Site-Wide Color Theme</h3>
              <p className="text-sm text-gray-500 mt-1">
                Changes apply to ALL components across ALL pages
              </p>
              {showSuccess && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Theme saved and applied to {totalComponents()} components!</span>
                </div>
              )}
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                {websiteData?.colorTheme ? 'Edit Theme' : 'Create Theme'}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </button>
                <button
                  onClick={handleSaveTheme}
                  disabled={!hasChanges}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  Apply to All
                </button>
              </div>
            )}
          </div>

          {(websiteData?.colorTheme || isEditing) && (
            <div className="space-y-4">
              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                  <span className="text-xs text-gray-500 ml-2">(All color variations derived from this)</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.primary}
                    onChange={(e) => setTheme({ ...theme, primary: e.target.value })}
                    disabled={!isEditing}
                    className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={theme.primary}
                    onChange={(e) => setTheme({ ...theme, primary: e.target.value })}
                    disabled={!isEditing}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
                    placeholder="#3B82F6"
                  />
                  <div className="w-12 h-12 rounded-lg border border-gray-300" style={{ backgroundColor: theme.primary }} />
                </div>
              </div>

              {/* Text Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.text}
                    onChange={(e) => setTheme({ ...theme, text: e.target.value })}
                    disabled={!isEditing}
                    className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={theme.text}
                    onChange={(e) => setTheme({ ...theme, text: e.target.value })}
                    disabled={!isEditing}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
                    placeholder="#000000"
                  />
                  <div className="w-12 h-12 rounded-lg border border-gray-300" style={{ backgroundColor: theme.text }} />
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.background}
                    onChange={(e) => setTheme({ ...theme, background: e.target.value })}
                    disabled={!isEditing}
                    className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={theme.background}
                    onChange={(e) => setTheme({ ...theme, background: e.target.value })}
                    disabled={!isEditing}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
                    placeholder="#ffffff"
                  />
                  <div className="w-12 h-12 rounded-lg border border-gray-300" style={{ backgroundColor: theme.background }} />
                </div>
              </div>

              {/* Background Layout Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Layout
                </label>
                <select
                  value={theme.bgLayoutType}
                  onChange={(e) => setTheme({ ...theme, bgLayoutType: e.target.value as "radial" | "linear" | "solid" })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="solid">Solid</option>
                  <option value="radial">Radial Gradient</option>
                  <option value="linear">Linear Gradient</option>
                </select>
              </div>

              {/* Info Banner */}
              {isEditing && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Site-Wide Theme Update</p>
                    <p className="text-amber-700">
                      This will update ALL {totalComponents()} components across ALL pages to use this color scheme.
                      Individual component color variations will be automatically derived from the primary color.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!websiteData?.colorTheme && !isEditing && (
            <div className="text-center py-8 text-gray-500">
              <Palette className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No color theme set yet.</p>
              <p className="text-sm mt-1 mb-4">Create a theme to establish consistent colors across your entire website.</p>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Create Theme Now
              </button>
            </div>
          )}
        </div>

        {/* Website Stats */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Website Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Total Pages</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {websiteData?.pages
                  ? Object.keys(websiteData.pages).length
                  : 0}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Total Components</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalComponents()}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Template</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {websiteData?.templateName || "Not set"}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-lg font-semibold text-gray-900 mt-1 capitalize">
                {websiteData?.status || "draft"}
              </p>
            </div>
          </div>
        </div>

        {/* Edit History Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5" />
                Edit History
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                View all file changes made during this session
                {hasUnsavedChanges && (
                  <span className="ml-2 text-orange-600 font-medium">
                    ({unsavedEdits.length} unsaved)
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GitBranch className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Current Changes"}
            </button>
          </div>

          {fileChangeHistory.length === 0 && !hasUnsavedChanges ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No edits made yet.</p>
              <p className="text-sm mt-1">File changes will appear here when you make edits using the AI Assistant.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {fileChangeHistory.map((history, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {new Date(history.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {history.files.length} file{history.files.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {history.files.map((file, fileIdx) => (
                      <div
                        key={fileIdx}
                        className="flex items-start gap-2 text-sm bg-white rounded p-2 border border-gray-200"
                      >
                        {file.action === "create" && (
                          <Plus className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        )}
                        {file.action === "modify" && (
                          <Edit className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        )}
                        {file.action === "delete" && (
                          <Trash2 className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {file.path}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 capitalize">
                            {file.action}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
