/**
 * Next.js Page Template
 *
 * Template for generating Next.js page.tsx files with Metadata and page component imports
 */

import { SEOMetadata } from '@/types/website';

/**
 * Template for Next.js page.tsx files
 *
 * Placeholders:
 * - {{PAGE_COMPONENT_IMPORT}} - Import statement for the page component
 * - {{PAGE_COMPONENT_NAME}} - Name of the page component (e.g., HomePage)
 * - {{METADATA_EXPORT}} - Complete Metadata export with SEO data
 */
export const PAGE_TEMPLATE = `{{PAGE_COMPONENT_IMPORT}}
import { Metadata } from 'next';

{{METADATA_EXPORT}}

export default function Page() {
  return <{{PAGE_COMPONENT_NAME}} />;
}
`;

/**
 * Get the page component import name (without "Page" suffix)
 * 
 * @param slug - Page slug (e.g., "home", "about", "contact-us")
 * @returns Component name for import (e.g., "Home", "About", "ContactUs")
 * 
 * @example
 * getPageComponentName('home') // 'Home'
 * getPageComponentName('about') // 'About'
 * getPageComponentName('contact-us') // 'ContactUs'
 */
export function getPageComponentName(slug: string): string {
  // Handle special cases
  if (slug === 'index') {
    return 'Home';
  }

  // Split by hyphens, capitalize each word, join together
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Format SEO metadata for Next.js Metadata export
 *
 * @param metadata - SEO metadata object
 * @returns Formatted metadata export string
 */
export function formatMetadataForRoute(metadata: SEOMetadata): string {
  const metadataObj: Record<string, any> = {
    title: metadata.title,
    description: metadata.description,
  };

  // Add keywords if present
  if (metadata.keywords) {
    metadataObj.keywords = metadata.keywords;
  }

  // Add OpenGraph metadata
  if (metadata.openGraph) {
    metadataObj.openGraph = {
      title: metadata.openGraph.title,
      description: metadata.openGraph.description,
      url: metadata.openGraph.url,
      siteName: metadata.openGraph.siteName,
      type: metadata.openGraph.type,
      locale: metadata.openGraph.locale,
    };

    // Add images if present
    if (metadata.openGraph.images && metadata.openGraph.images.length > 0) {
      metadataObj.openGraph.images = metadata.openGraph.images;
    }
  }

  // Add Twitter metadata if present
  // if (metadata.twitter) {
  //   metadataObj.twitter = {
  //     card: metadata.twitter.card,
  //     title: metadata.twitter.title,
  //     description: metadata.twitter.description,
  //   };

  //   if (metadata.twitter.images && metadata.twitter.images.length > 0) {
  //     metadataObj.twitter.images = metadata.twitter.images;
  //   }
  // }

  // Add icons if present
  if (metadata.icons) {
    metadataObj.icons = metadata.icons;
  }

  // Convert to formatted string
  const formatted = JSON.stringify(metadataObj, null, 2)
    .replace(/"([^"]+)":/g, '$1:') // Remove quotes from keys
    .replace(/: "([^"]+)"/g, ': "$1"'); // Keep quotes on string values

  return `export const metadata: Metadata = ${formatted};`;
}

/**
 * Generate the complete page.tsx file content
 *
 * @param pageSlug - Page slug (e.g., "home", "about")
 * @param metadata - SEO metadata
 * @returns Complete page.tsx file content
 */
export function generatePageFile(pageSlug: string, metadata: SEOMetadata): string {
  const pageComponentName = getPageComponentName(pageSlug);
  const importSlug = pageSlug === 'index' ? 'home' : pageSlug;

  const pageComponentImport = `import ${pageComponentName} from '@/components/pageComponents/${importSlug}';`;
  const metadataExport = formatMetadataForRoute(metadata);

  let pageContent = PAGE_TEMPLATE;
  pageContent = pageContent.replace('{{PAGE_COMPONENT_IMPORT}}', pageComponentImport);
  pageContent = pageContent.replace(/{{PAGE_COMPONENT_NAME}}/g, pageComponentName);
  pageContent = pageContent.replace('{{METADATA_EXPORT}}', metadataExport);

  return pageContent;
}
