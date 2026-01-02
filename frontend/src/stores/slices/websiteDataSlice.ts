import type { WebsiteMaster, WebsitePage } from "@/types/website";
import { StateCreator } from "zustand";
import { useEditHistoryStore } from "../editHistoryStore";
import { GITHUB_CONFIG } from "@/lib/config";

/**
 * WebsiteDataSlice - Manages website data from GitHub (source of truth)
 *
 * Responsibilities:
 * - Load websiteData.json from GitHub
 * - Save changes back to GitHub
 * - Manage loading/error states
 * - Handle caching (localStorage for offline support)
 */

export interface WebsiteDataSlice {
  // ===== STATE =====
  websiteData: WebsiteMaster | null;
  isLoading: boolean;   // Only true when LOADING data
  isSaving: boolean;    // Only true when SAVING data
  error: string | null;
  lastSyncedAt: Date | null;
  initialDataHash: string | null;  // Hash of data when loaded from GitHub
  hasUnsavedChanges: boolean;      // Computed from comparing current vs initial

  // ===== GITHUB OPERATIONS =====
  loadFromGitHub: (
    branch?: string,
    versionNumber?: number
  ) => Promise<void>;

  saveToGitHub: (
    branch?: string,
    commitMessage?: string
  ) => Promise<{ commitSha: string; versionNumber: string }>;

  refreshFromGitHub: (
    branch?: string
  ) => Promise<void>;

  initializeFromGitHub: () => Promise<void>;

  // ===== DATA MUTATIONS =====
  setWebsiteData: (data: WebsiteMaster | null) => void;
  updateComponentProps: (
    pageSlug: string,
    componentId: string,
    props: Record<string, any>,
    metadata?: { source?: string; prompt?: string }
  ) => void;

  // ===== COMPUTED GETTERS =====
  getPage: (slug: string) => WebsitePage | null;
  getComponent: (pageSlug: string, componentId: string) => any | null;

  // ===== INTERNAL HELPERS =====
  _clearCache: () => void;
  _loadFromCache: () => WebsiteMaster | null;
  _saveToCache: (data: WebsiteMaster) => void;
}

const CACHE_KEY = 'website-data-cache';

/**
 * Helper function to convert dot notation keys to nested objects
 * Example: { "images.profile": { src: "...", alt: "..." } }
 * Becomes: { images: { profile: { src: "...", alt: "..." } } }
 */
function convertDotNotationToNested(props: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const key in props) {
    const keys = key.split('.');

    if (keys.length === 1) {
      // No dot notation, use as-is
      result[key] = props[key];
    } else {
      // Has dot notation, create nested structure
      let current = result;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!current[k] || typeof current[k] !== 'object') {
          current[k] = {};
        }
        current = current[k];
      }

      // Set the final value
      const lastKey = keys[keys.length - 1];
      current[lastKey] = props[key];
    }
  }

  return result;
}

/**
 * Deep merge function to properly merge nested objects
 */
function deepMerge(target: any, source: any): any {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return source;
  }

  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

export const createWebsiteDataSlice: StateCreator<
  WebsiteDataSlice,
  [],
  [],
  WebsiteDataSlice
> = (set, get) => ({
  // ===== INITIAL STATE =====
  websiteData: null,
  isLoading: false,
  isSaving: false,
  error: null,
  lastSyncedAt: null,
  initialDataHash: null,
  hasUnsavedChanges: false,

  // ===== GITHUB OPERATIONS =====
  loadFromGitHub: async (
    branch?: string,
    versionNumber?: number
  ) => {
    const { CURRENT_BRANCH } = GITHUB_CONFIG;
    const actualBranch = branch || CURRENT_BRANCH;

    console.log("🔵 [websiteDataSlice] Loading from GitHub:", { branch: actualBranch, versionNumber });
    set({ isLoading: true, error: null });

    try {
      let response;
      const timestamp = Date.now(); // Cache buster

      if (versionNumber) {
        // Load specific version
        response = await fetch('/api/versions/switch-github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            versionNumber,
          }),
          cache: 'no-store', // Force fresh data
        });

        // Fallback to latest if version not found
        if (response.status === 404) {
          console.warn("⚠️ [websiteDataSlice] Version not found, falling back to latest");
          response = await fetch(
            `/api/versions/get-latest?branch=${actualBranch}&_t=${timestamp}`,
            { cache: 'no-store' }
          );
        }
      } else {
        // Load latest from branch
        response = await fetch(
          `/api/versions/get-latest?branch=${actualBranch}&_t=${timestamp}`,
          { cache: 'no-store' }
        );
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to load from GitHub: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ [websiteDataSlice] Loaded from GitHub:", {
        hasColorTheme: !!data.websiteData?.colorTheme,
        pagesCount: Array.isArray(data.websiteData?.pages) 
          ? data.websiteData.pages.length 
          : Object.keys(data.websiteData?.pages || {}).length,
        pagesIsArray: Array.isArray(data.websiteData?.pages),
      });

      // Transform pages from array to object if needed
      let pagesObject: Record<string, WebsitePage> = {};
      if (Array.isArray(data.websiteData?.pages)) {
        // Convert array to object keyed by slug with intelligent slug generation
        data.websiteData.pages.forEach((page: WebsitePage, index: number) => {
          let slug: string;

          // Priority 1: Use existing slug if present
          if (page.slug) {
            slug = page.slug;
          }
          // Priority 2: Convert pageName to slug
          else if (page.pageName) {
            slug = page.pageName
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '');
          }
          // Priority 3: Use index-based slug
          else {
            slug = index === 0 ? 'index' : `page-${index}`;
          }

          // Ensure uniqueness (handle duplicates)
          let uniqueSlug = slug;
          let counter = 1;
          while (pagesObject[uniqueSlug]) {
            uniqueSlug = `${slug}-${counter}`;
            counter++;
          }

          // Add the page with the unique slug
          pagesObject[uniqueSlug] = { ...page, slug: uniqueSlug };
        });
        console.log("🔄 [websiteDataSlice] Converted pages array to object:", Object.keys(pagesObject));
      } else if (data.websiteData?.pages && typeof data.websiteData.pages === 'object') {
        // Already an object, use as-is
        pagesObject = data.websiteData.pages;
      }

      // Transform to WebsiteMaster
      const websiteMaster: WebsiteMaster = {
        ...data.websiteData,
        templateName: data.websiteData?.templateName || "Default Template",
        formData: data.websiteData?.formData || {},
        status: data.websiteData?.status || "in-progress",
        pages: pagesObject,
        colorTheme: data.websiteData?.colorTheme,
        seoMetadata: data.websiteData?.seoMetadata,
        currentVersionNumber: versionNumber || data.websiteData?.currentVersionNumber,
        createdAt: data.websiteData?.createdAt ? new Date(data.websiteData.createdAt) : new Date(),
        updatedAt: data.websiteData?.updatedAt ? new Date(data.websiteData.updatedAt) : new Date(),
      };

      // Compute initial hash for change tracking
      const initialHash = JSON.stringify(websiteMaster);

      // Update state
      set({
        websiteData: websiteMaster,
        isLoading: false,
        lastSyncedAt: new Date(),
        initialDataHash: initialHash,
        hasUnsavedChanges: false, // Reset on fresh load
      });

      // Cache for offline support
      get()._saveToCache(websiteMaster);

      console.log("✅ [websiteDataSlice] Successfully loaded and cached");
      console.log("📸 [websiteDataSlice] Captured initial data hash for change tracking");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load from GitHub";
      console.error("❌ [websiteDataSlice] Error:", errorMessage);

      // Try to load from cache as fallback
      const cachedData = get()._loadFromCache();
      if (cachedData) {
        console.warn("⚠️ [websiteDataSlice] Using cached data as fallback");
        set({
          websiteData: cachedData,
          error: `Using cached data. ${errorMessage}`,
          isLoading: false,
        });
      } else {
        set({ error: errorMessage, isLoading: false });
      }
    }
  },

  saveToGitHub: async (
    branch?: string,
    commitMessage: string = "Update website data"
  ) => {
    const { CURRENT_BRANCH } = GITHUB_CONFIG;
    const actualBranch = branch || CURRENT_BRANCH;

    const state = get();
    if (!state.websiteData) {
      throw new Error("No website data to save");
    }

    console.log("💾 [websiteDataSlice] Saving to GitHub:", { branch: actualBranch });
    set({ isSaving: true, error: null }); // Use isSaving, not isLoading!

    try {
      // Determine file path
      const websiteDataPath = process.env.NEXT_PUBLIC_REPO_TYPE === 'monorepo'
        ? 'frontend/src/data/websiteData.json'
        : 'src/data/websiteData.json';

      // Serialize website data
      const serialized = JSON.stringify(state.websiteData, null, 2);

      // Commit to GitHub (no repo params needed - API knows from config)
      const response = await fetch('/api/versions/create-github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commitMessage,
          branch: actualBranch,
          files: [{
            path: websiteDataPath,
            content: serialized,
            encoding: 'utf-8',
          }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to commit to GitHub' }));
        throw new Error(errorData.error || 'Failed to commit to GitHub');
      }

      const data = await response.json();
      console.log(`✅ [websiteDataSlice] Committed to GitHub: ${data.commitSha}`);

      // Also write to local file so it stays in sync
      try {
        await fetch('/api/files/write-local', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: serialized }),
        });
        console.log(`✅ [websiteDataSlice] Updated local file: ${websiteDataPath}`);
      } catch (localWriteError) {
        console.warn(`⚠️ [websiteDataSlice] Failed to write local file (non-fatal):`, localWriteError);
      }

      // Update metadata without full reload (data is already in sync since we just saved it)
      const updatedWebsiteData = {
        ...state.websiteData,
        currentVersionNumber: parseInt(data.versionNumber),
        updatedAt: new Date(),
      };

      const newHash = JSON.stringify(updatedWebsiteData);

      set({
        websiteData: updatedWebsiteData,
        initialDataHash: newHash,
        hasUnsavedChanges: false,
        lastSyncedAt: new Date(),
        isSaving: false, // Use isSaving, not isLoading!
      });

      // Cache the updated data
      get()._saveToCache(updatedWebsiteData);

      console.log(`✅ [websiteDataSlice] Updated to version ${data.versionNumber} (no reload needed)`);

      // Return commit data for URL update
      return {
        commitSha: data.commitSha,
        versionNumber: data.versionNumber,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save to GitHub";
      console.error("❌ [websiteDataSlice] Error saving:", errorMessage);
      set({ error: errorMessage, isSaving: false }); // Use isSaving, not isLoading!
      throw error;
    }
  },

  refreshFromGitHub: async (
    branch?: string
  ) => {
    console.log("🔄 [websiteDataSlice] Force refresh from GitHub");

    // Clear all caches
    get()._clearCache();

    // Reload from GitHub
    await get().loadFromGitHub(branch);
  },

  initializeFromGitHub: async () => {
    const state = get();
    const { CURRENT_BRANCH } = GITHUB_CONFIG;

    // Don't initialize if already loading or if we already have data
    if (state.isLoading || state.websiteData) {
      console.log("🔵 [websiteDataSlice] Already loading or have data, skipping init");
      return;
    }

    set({ isLoading: true, error: null });
    console.log("🔵 [websiteDataSlice] Initializing from GitHub...");

    try {
      // Get optional params from URL
      const urlParams = new URLSearchParams(window.location.search);
      const versionNumber = urlParams.get("version");
      const branch = urlParams.get("branch") || CURRENT_BRANCH;

      console.log("🔵 [websiteDataSlice] Fetching from GitHub:", { branch, versionNumber });

      // Load from GitHub (repo info comes from config)
      await get().loadFromGitHub(
        branch,
        versionNumber ? parseInt(versionNumber) : undefined
      );

      console.log("🔵 [websiteDataSlice] Successfully initialized from GitHub");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to initialize from GitHub";
      console.error("🔵 [websiteDataSlice] Error initializing from GitHub:", errorMessage);
      set({ error: errorMessage, isLoading: false });
    }
  },

  // ===== DATA MUTATIONS =====
  setWebsiteData: (data) => {
    console.log("🟢 [websiteDataSlice] setWebsiteData:", {
      hasData: !!data,
      pagesCount: Object.keys(data?.pages || {}).length,
    });

    // Compute hasUnsavedChanges
    const state = get();
    let hasUnsavedChanges = false;
    if (data && state.initialDataHash !== null) {
      const currentHash = JSON.stringify(data);
      hasUnsavedChanges = currentHash !== state.initialDataHash;
    }

    set({
      websiteData: data,
      hasUnsavedChanges,
    });

    if (data) {
      get()._saveToCache(data);
    }
  },

  updateComponentProps: (
    pageSlug: string,
    componentId: string,
    props: Record<string, any>,
    metadata?: { source?: string; prompt?: string }
  ) => {
    const state = get();
    if (!state.websiteData) {
      console.warn("⚠️ [websiteDataSlice] updateComponentProps called but websiteData is null");
      return;
    }

    const pages = state.websiteData.pages;
    if (!pages) {
      console.warn("⚠️ [websiteDataSlice] pages is null or undefined");
      return;
    }

    // Normalize page slug
    const normalizedSlug = pageSlug === '/' || pageSlug === '' ? 'index' : pageSlug;

    let beforeComponent: any = null;
    let afterComponent: any = null;
    let componentIndex = -1;

    // Pages is an object keyed by slug, not an array
    const updatedPages = { ...pages };
    const page = updatedPages[normalizedSlug];

    if (page) {
      // Find component index and capture before state
      componentIndex = page.components?.findIndex((c: any) => c.id === componentId) ?? -1;
      if (componentIndex !== -1) {
        beforeComponent = page.components[componentIndex];
      }

      // Find and update component
      const updatedComponents = page.components?.map((comp: any, idx: number) => {
        if (comp.id === componentId) {
          // Convert dot notation to nested objects (e.g., "images.profile" -> { images: { profile: {...} } })
          const nestedProps = convertDotNotationToNested(props);
          // Deep merge to properly handle nested objects
          const mergedProps = deepMerge(comp.props || {}, nestedProps);
          const updated = { ...comp, props: mergedProps };
          if (idx === componentIndex) {
            afterComponent = updated;
          }
          return updated;
        }
        return comp;
      });

      // Update the specific page in the pages object
      updatedPages[normalizedSlug] = { ...page, components: updatedComponents };
    }

    // Update website data
    const updatedWebsiteData: WebsiteMaster = {
      ...state.websiteData,
      pages: updatedPages,
      updatedAt: new Date(),
    };

    console.log(`✅ [websiteDataSlice] Updated component ${componentId} in page ${pageSlug}:`, props);

    // Compute hasUnsavedChanges
    const currentHash = JSON.stringify(updatedWebsiteData);
    const hasUnsavedChanges = state.initialDataHash !== null && currentHash !== state.initialDataHash;

    set({
      websiteData: updatedWebsiteData,
      hasUnsavedChanges,
    });

    console.log(`🔍 [websiteDataSlice] Change detection: {hasUnsavedChanges: ${hasUnsavedChanges}}`);
    get()._saveToCache(updatedWebsiteData);

    // Track edit history (if we have before/after components)
    if (beforeComponent && afterComponent && componentIndex !== -1) {
      const beforeProps = beforeComponent?.props || {};
      const afterProps = afterComponent?.props || {};

      // Calculate what actually changed
      const changedProps: Record<string, { old: any; new: any }> = {};
      Object.keys(props).forEach((key) => {
        if (JSON.stringify(beforeProps[key]) !== JSON.stringify(afterProps[key])) {
          changedProps[key] = { old: beforeProps[key], new: afterProps[key] };
        }
      });

      // Track in edit history (unless it's a theme sync)
      if (Object.keys(changedProps).length > 0 && metadata?.source !== 'theme-sync') {
        try {
          const editHistory = useEditHistoryStore.getState();
          editHistory.addEdit({
            type: metadata?.source === 'ai-assistant' ? 'color' : 'manual',
            componentId,
            componentType: beforeComponent?.type || afterComponent?.type,
            pageSlug: normalizedSlug,
            changes: { props: changedProps },
            metadata: {
              source: (metadata?.source || 'manual') as 'manual' | 'ai-assistant' | 'claude-code',
              prompt: metadata?.prompt,
            },
          });
          console.log(`📝 [websiteDataSlice] Tracked edit in history:`, {
            componentId,
            changedProps: Object.keys(changedProps),
            source: metadata?.source || 'manual',
          });
        } catch (error) {
          console.warn("⚠️ [websiteDataSlice] Failed to track edit history:", error);
        }
      }
    }
  },

  // ===== COMPUTED GETTERS =====
  getPage: (slug: string) => {
    const state = get();
    if (!state.websiteData?.pages) return null;

    const normalizedSlug = slug === '/' || slug === '' ? 'index' : slug;
    const pages = state.websiteData.pages;

    // Pages is an object keyed by slug
    return pages[normalizedSlug] || null;
  },

  getComponent: (pageSlug: string, componentId: string) => {
    const page = get().getPage(pageSlug);
    if (!page) return null;

    return page.components?.find((c: any) => c.id === componentId) || null;
  },

  // ===== INTERNAL HELPERS =====
  _clearCache: () => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(CACHE_KEY);
    console.log("🗑️ [websiteDataSlice] Cache cleared");
  },

  _loadFromCache: () => {
    if (typeof window === 'undefined') return null;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      console.log("📦 [websiteDataSlice] Loaded from cache");
      return parsed;
    } catch (error) {
      console.warn("⚠️ [websiteDataSlice] Failed to load from cache:", error);
      return null;
    }
  },

  _saveToCache: (data: WebsiteMaster) => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      console.log("💾 [websiteDataSlice] Saved to cache");
    } catch (error) {
      console.warn("⚠️ [websiteDataSlice] Failed to save to cache:", error);
    }
  },
});
