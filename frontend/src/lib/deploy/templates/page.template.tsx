/**
 * Production Page Template
 *
 * This template is used to generate production page.tsx files.
 * Placeholders will be replaced during the build process:
 * - {{COMPONENT_IMPORTS}} - Import statements for components used on this page
 * - {{METADATA_JSON}} - Next.js metadata object
 * - {{PAGE_NAME}} - Capitalized page name
 * - {{COMPONENT_RENDERS}} - JSX component renders
 */

export const PAGE_TEMPLATE = `"use client";

import { Metadata } from "next";
{{COMPONENT_IMPORTS}}

// SEO Metadata
export const metadata: Metadata = {{METADATA_JSON}};

export default function {{PAGE_NAME}}Page() {
  return (
    <main className="min-h-screen">
{{COMPONENT_RENDERS}}
    </main>
  );
}
`;

/**
 * Helper to generate component import statement
 * @param componentName - The PascalCase component name (e.g., "AuroraImageHero")
 * @param componentPath - The import path (e.g., "@/components/designs/herobanners/auroraImageHero/auroraImageHero")
 * @param propsTypeName - The props type name (e.g., "AuroraImageHeroProps")
 * @param propsPath - The props import path (e.g., "@/components/designs/herobanners/auroraImageHero")
 * @returns Import statement string
 */
export function generateComponentImport(
  componentName: string,
  componentPath: string,
  propsTypeName: string,
  propsPath: string
): string {
  return `import ${componentName} from "${componentPath}";\nimport { ${propsTypeName} } from "${propsPath}";`;
}

/**
 * Helper to generate component render JSX
 * @param componentName - The PascalCase component name
 * @param propsVarName - The variable name for props (e.g., "component1Props")
 * @returns JSX render string
 */
export function generateComponentRender(
  componentName: string,
  propsVarName: string
): string {
  return `      <${componentName} {...${propsVarName}} />`;
}

/**
 * Helper to format metadata as a JSON string for template insertion
 * @param metadata - The SEO metadata object
 * @returns Formatted JSON string
 */
export function formatMetadataForTemplate(metadata: {
  title?: string;
  description?: string;
  keywords?: string;
  openGraph?: {
    title?: string;
    description?: string;
    images?: string[];
    url?: string;
    siteName?: string;
    type?: string;
    locale?: string;
  };
}): string {
  return JSON.stringify(metadata, null, 2);
}

/**
 * Helper to capitalize page name
 * @param pageName - The page slug (e.g., "about", "index")
 * @returns Capitalized name (e.g., "About", "Index")
 */
export function capitalizePageName(pageName: string): string {
  if (pageName === 'index') return 'Home';
  return pageName.charAt(0).toUpperCase() + pageName.slice(1);
}
