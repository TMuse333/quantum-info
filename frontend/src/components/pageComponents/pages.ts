/**
 * Page Definitions - Code-defined pages (fallback)
 * 
 * This is a fallback for when websiteData.json is not available.
 * In normal operation, pages come from websiteData.json.
 */

export interface CodePage {
  pageName: string;
  slug: string;
  components?: any[];
}

const codePages: Record<string, CodePage> = {
  index: {
    pageName: "Home",
    slug: "index",
    components: [], // Empty - will be populated from websiteData.json
  },
};

/**
 * Get a page by slug from code-defined pages
 * Returns null if not found (should use websiteData.json instead)
 */
export function getPageBySlug(slug: string): CodePage | null {
  return codePages[slug] || null;
}

/**
 * Get all code-defined pages
 */
export function getAllCodePages(): CodePage[] {
  return Object.values(codePages);
}

