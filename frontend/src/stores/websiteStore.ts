import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createWebsiteDataSlice, WebsiteDataSlice } from "./slices/websiteDataSlice";
import { createEditorSlice, EditorSlice } from "./slices/editorSlice";

/**
 * Unified Website Store - Combines all slices
 *
 * Architecture:
 * - websiteData slice: GitHub data (source of truth)
 * - editor slice: UI state (page navigation, editor mode, selection)
 *
 * Data Flow:
 * GitHub (websiteData.json) → API → Store → Components
 *
 * Usage:
 * ```tsx
 * // Load data
 * const loadFromGitHub = useWebsiteStore(state => state.loadFromGitHub);
 * useEffect(() => {
 *   loadFromGitHub('owner', 'repo', 'branch');
 * }, []);
 *
 * // Access data
 * const websiteData = useWebsiteStore(state => state.websiteData);
 * const currentPage = useWebsiteStore(state => state.getPage(state.currentPageSlug));
 *
 * // UI state
 * const editorMode = useWebsiteStore(state => state.editorMode);
 * const setEditorMode = useWebsiteStore(state => state.setEditorMode);
 * ```
 */

export type WebsiteStore = WebsiteDataSlice & EditorSlice;

const useWebsiteStore = create<WebsiteStore>()(
  devtools(
    (set, get, ...a) => {
      const websiteDataSlice = createWebsiteDataSlice(set, get, ...a);
      const editorSlice = createEditorSlice(set, get, ...a);

      return {
        ...websiteDataSlice,
        ...editorSlice,
        // Backward compatibility: Add currentPageData as computed property
        get currentPageData() {
          const state = get();
          return state.getPage(state.currentPageSlug);
        },
      };
    },
    {
      name: 'WebsiteStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

export default useWebsiteStore;

/**
 * Convenience selectors for common use cases
 */

// Get current page data
export const useCurrentPage = () =>
  useWebsiteStore((state) => state.getPage(state.currentPageSlug));

// Backward compatibility: currentPageData selector (DEPRECATED)
// This matches the old store API for existing hooks
export const useCurrentPageData = () =>
  useWebsiteStore((state) => {
    const page = state.getPage(state.currentPageSlug);
    return page;
  });

// Get component from current page
export const useComponent = (componentId: string) =>
  useWebsiteStore((state) => {
    const page = state.getPage(state.currentPageSlug);
    if (!page) return null;
    return page.components?.find((c: any) => c.id === componentId) || null;
  });

// Get all pages
export const usePages = () =>
  useWebsiteStore((state) => state.websiteData?.pages || []);

// Get color theme
export const useColorTheme = () =>
  useWebsiteStore((state) => state.websiteData?.colorTheme);

// Get SEO metadata
export const useSeoMetadata = () =>
  useWebsiteStore((state) => state.websiteData?.seoMetadata);

// Get loading state
export const useIsLoading = () =>
  useWebsiteStore((state) => state.isLoading);

// Get error state
export const useError = () =>
  useWebsiteStore((state) => state.error);
