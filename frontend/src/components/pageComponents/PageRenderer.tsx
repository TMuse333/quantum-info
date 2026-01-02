"use client";

import React, { useMemo, Suspense } from "react";
import EditorialPageWrapper from "@/components/editor/EditorialPageWrapper";
import { EditorErrorBoundary } from "@/components/editor/ErrorBoundary";
import { createRenderComponent } from "./componentMap";
import useWebsiteStore from "@/stores/websiteStore";
import { getPageBySlug } from "./pages";

interface PageRendererProps {
  pageSlug: string;
}

/**
 * PageRenderer - Renders a page based on websiteData.json
 * 
 * Handles empty/blank websiteData.json gracefully.
 * Components will be injected by parent project via GitHub API.
 */
export default function PageRenderer({ pageSlug }: PageRendererProps) {
  const { websiteData } = useWebsiteStore();
  
  // Get page data - prioritize websiteData, then websiteData.json, then code-defined
  const { pageData, components } = useMemo(() => {
    let page = null;
    let comps: any[] = [];

    // 1. Try to get from websiteData first (loaded from API or localStorage)
    if (websiteData?.pages) {
      // Pages is an object keyed by slug
      page = websiteData.pages[pageSlug];

      if (page) {
        return {
          pageData: {
            pageName: page.pageName || pageSlug,
            slug: page.slug || pageSlug,
          },
          components: page.components || [],
        };
      }
    }

    // 2. Fallback to websiteData.json (static import)
    const jsonData = websiteData as any;
    if (jsonData?.pages) {
      // Pages is an object keyed by slug
      page = jsonData.pages[pageSlug];

      if (page) {
        return {
          pageData: {
            pageName: page.name || page.pageName || pageSlug,
            slug: page.slug || pageSlug,
          },
          components: page.components || [],
        };
      }
    }

    // 3. Fallback to code-defined pages
    const codePage = getPageBySlug(pageSlug);
    if (codePage) {
      return {
        pageData: {
          pageName: codePage.pageName,
          slug: codePage.slug,
        },
        components: codePage.components || [],
      };
    }

    // 4. Default empty page (for blank websiteData.json)
    return {
      pageData: {
        pageName: pageSlug,
        slug: pageSlug,
      },
      components: [], // Empty components array - parent project will populate
    };
  }, [pageSlug, websiteData]);

  const renderComponent = createRenderComponent();

  return (
    <EditorErrorBoundary>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
            <div className="text-lg font-medium text-gray-700">Loading page...</div>
          </div>
        </div>
      }>
        <EditorialPageWrapper
          pageSlug={pageSlug}
          components={components}
          pageData={pageData}
          renderComponent={renderComponent}
        />
      </Suspense>
    </EditorErrorBoundary>
  );
}

