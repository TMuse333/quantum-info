/**
 * Page File Generator
 * 
 * Generates production files for pages:
 * 1. {pageName}.data.ts - Component props data in frontend/src/data/
 * 2. pageComponents/{pageName}.tsx - Page component in frontend/src/components/pageComponents/
 * 3. app/{slug}/page.tsx - Next.js page route in frontend/src/app/
 */

import { WebsiteMaster, WebsitePage } from '@/types/website';
import { SEOMetadata } from '@/types/website';
import { PAGE_COMPONENT_TEMPLATE, generateComponentImport, generatePropsImport, generateComponentRender, capitalizePageName } from '../templates/pageComponent.template';

export interface GeneratedFile {
  path: string;
  content: string;
}

/**
 * Get component name from component type
 * Converts kebab-case to PascalCase
 */
function getComponentName(componentType: string): string {
  return componentType
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Clean component props to remove duplicate flat properties
 * Removes properties like "images.main" when "images.main" exists in nested structure
 */
function cleanComponentProps(props: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  const nestedKeys = new Set<string>();
  
  // First pass: identify nested structures and collect their keys
  for (const [key, value] of Object.entries(props)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // This is a nested object (like "images")
      nestedKeys.add(key);
      cleaned[key] = value;
      
      // Collect all nested property paths (e.g., "images.main", "images.secondary")
      for (const nestedKey of Object.keys(value)) {
        nestedKeys.add(`${key}.${nestedKey}`);
      }
    }
  }
  
  // Second pass: only include flat properties that don't duplicate nested structure
  for (const [key, value] of Object.entries(props)) {
    // Skip if this key is a nested object (already added in first pass)
    if (nestedKeys.has(key) && typeof value === 'object' && !Array.isArray(value)) {
      continue;
    }
    
    // Skip if this is a flat property that duplicates a nested structure
    // e.g., skip "images.main" if "images" object exists with "main" property
    if (nestedKeys.has(key)) {
      continue;
    }
    
    // Include all other properties
    cleaned[key] = value;
  }
  
  return cleaned;
}

/**
 * Get component info from registry
 */
import { getComponentInfo } from '@/lib/componentRegistry';

/**
 * Get component import path from component type
 * IMPORTANT: In production, files are renamed from .prod.tsx to .tsx
 * So imports should NOT include .prod - use the registry path directly
 */
function getComponentPath(componentType: string): { componentPath: string; componentName: string; propsTypeName: string } | null {
  const componentInfo = getComponentInfo(componentType);
  if (!componentInfo) {
    return null;
  }
  
  // Use the registry path directly (without .prod)
  // In production branch, files are named .tsx (not .prod.tsx)
  // copyComponents.ts renames .prod.tsx → .tsx when deploying
  const componentPath = componentInfo.componentImportPath;
  
  return {
    componentPath: componentPath,
    componentName: componentInfo.componentName,
    propsTypeName: componentInfo.propsTypeName,
  };
}

/**
 * Generate data file for a page ({pageName}.data.ts)
 */
function generateDataFile(page: WebsitePage, pageSlug: string): GeneratedFile {
  const typeImports: string[] = [];
  const propsExports: string[] = [];
  const importedTypes = new Set<string>();
  
  // Sort components by order if available
  const sortedComponents = [...page.components].sort((a: any, b: any) => {
    const aOrder = (a as any).order ?? 0;
    const bOrder = (b as any).order ?? 0;
    return aOrder - bOrder;
  });
  
  sortedComponents.forEach((component: any, index: number) => {
    const componentInfo = getComponentPath(component.type);
    
    if (!componentInfo) {
      console.warn(`Warning: Component type "${component.type}" not found in registry`);
      return;
    }
    
    const propsVarName = `component${index + 1}Props`;
    const propsTypeName = componentInfo.propsTypeName;
    
    // Add type import if not already imported
    if (!importedTypes.has(componentInfo.componentPath)) {
      typeImports.push(`import { ${propsTypeName} } from '${componentInfo.componentPath}';`);
      importedTypes.add(componentInfo.componentPath);
    }
    
    // Clean props: Remove flat properties that duplicate nested structure
    // e.g., remove "images.main" if "images.main" exists in nested "images" object
    const cleanedProps = cleanComponentProps(component.props || {});
    
    // Export the props object
    propsExports.push(`export const ${propsVarName}: ${propsTypeName} = ${JSON.stringify(cleanedProps, null, 2)};`);
  });

  const content = `/**
 * Page Data for ${page.pageName || pageSlug}
 * 
 * Auto-generated from websiteData.json
 * DO NOT EDIT MANUALLY - This file is regenerated on each deployment
 */

${typeImports.join('\n')}

${propsExports.join('\n\n')}
`;

  return {
    path: `frontend/src/data/${pageSlug}.data.ts`,
    content,
  };
}

/**
 * Generate page component file (pageComponents/{pageName}.tsx)
 */
function generatePageComponent(page: WebsitePage, pageSlug: string): GeneratedFile {
  const componentImports: string[] = [];
  const propsVarNames: string[] = [];
  const componentRenders: string[] = [];

  // Sort components by order if available
  const sortedComponents = [...page.components].sort((a: any, b: any) => {
    const aOrder = (a as any).order ?? 0;
    const bOrder = (b as any).order ?? 0;
    return aOrder - bOrder;
  });

  sortedComponents.forEach((component: any, index: number) => {
    const componentInfo = getComponentPath(component.type);
    
    if (!componentInfo) {
      console.warn(`Warning: Component type "${component.type}" not found in registry`);
      return;
    }
    
    const propsVarName = `component${index + 1}Props`;

    // Generate import
    componentImports.push(generateComponentImport(
      componentInfo.componentName, 
      componentInfo.componentPath, 
      componentInfo.propsTypeName, 
      componentInfo.componentPath
    ));
    
    // Track props variable name
    propsVarNames.push(propsVarName);
    
    // Generate render
    componentRenders.push(generateComponentRender(componentInfo.componentName, propsVarName));
  });

  const pageName = capitalizePageName(pageSlug);
  const propsImport = generatePropsImport(propsVarNames, pageSlug);

  // Add "use client" directive since page components use client-side components
  const content = `"use client";

${PAGE_COMPONENT_TEMPLATE
    .replace('{{COMPONENT_IMPORTS}}', componentImports.join('\n'))
    .replace('{{PROPS_IMPORTS}}', propsImport)
    .replace('{{PAGE_NAME}}', pageName)
    .replace('{{COMPONENT_RENDERS}}', componentRenders.join('\n'))}`;

  return {
    path: `frontend/src/components/pageComponents/${pageSlug}.tsx`,
    content,
  };
}

/**
 * Generate Next.js page route (app/{slug}/page.tsx)
 */
function generatePageRoute(page: WebsitePage, pageSlug: string, seoMetadata?: SEOMetadata): GeneratedFile {
  const pageName = capitalizePageName(pageSlug);

  // Generate metadata
  const metadata = seoMetadata ? {
    title: seoMetadata.title,
    description: seoMetadata.description,
    keywords: seoMetadata.keywords,
    openGraph: seoMetadata.openGraph,
  } : {
    title: page.pageName || pageName.replace('Page', ''),
    description: `Page: ${page.pageName || pageName.replace('Page', '')}`,
  };

  const content = `import { Metadata } from "next";
import ${pageName} from "@/components/pageComponents/${pageSlug}";

export const metadata: Metadata = ${JSON.stringify(metadata, null, 2)};

export default function Page() {
  return <${pageName} />;
}
`;

  // Handle index page specially - it goes in app/page.tsx (root)
  const routePath = pageSlug === 'index' ? 'page.tsx' : `${pageSlug}/page.tsx`;

  return {
    path: `frontend/src/app/${routePath}`,
    content,
  };
}

/**
 * Generate all page files for a website
 */
export function generateAllPageFiles(
  websiteData: WebsiteMaster,
  seoMetadata: Record<string, SEOMetadata> = {}
): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  // Handle both array and object formats for pages
  const pagesArray = Array.isArray(websiteData.pages)
    ? websiteData.pages
    : Object.entries(websiteData.pages || {}).map(([slug, page]) => ({
        ...page,
        slug: page.slug || slug,
      }));

  pagesArray.forEach((page) => {
    const pageSlug = page.slug || 'index';
    const pageSeo = seoMetadata[pageSlug];

    // Skip if page has no components
    if (!page.components || page.components.length === 0) {
      console.warn(`Warning: Page "${pageSlug}" has no components, skipping...`);
      return;
    }

    // Generate data file
    files.push(generateDataFile(page, pageSlug));

    // Generate page component
    files.push(generatePageComponent(page, pageSlug));

    // Generate page route
    files.push(generatePageRoute(page, pageSlug, pageSeo));
  });

  return files;
}

/**
 * Validate that all component types exist
 */
export function validateComponentTypes(websiteData: WebsiteMaster): {
  valid: boolean;
  missingTypes: string[];
  usedTypes: string[];
} {
  const usedTypes = new Set<string>();
  const missingTypes: string[] = [];

  // Import component registry
  const { getComponentInfo } = require('@/lib/componentRegistry');

  // Handle both array and object formats for pages
  const pagesArray = Array.isArray(websiteData.pages)
    ? websiteData.pages
    : Object.values(websiteData.pages || {});

  console.log(`\n🔍 [VALIDATION] Starting component type validation...`);
  console.log(`   Pages to check: ${pagesArray.length}`);

  pagesArray.forEach((page) => {
    if (page.components) {
      page.components.forEach((component: any) => {
        const componentType = component.type;
        usedTypes.add(componentType);
        
        // Check if component type exists in registry
        const componentInfo = getComponentInfo(componentType);
        if (!componentInfo) {
          console.error(`   ❌ Missing component type: "${componentType}"`);
          if (!missingTypes.includes(componentType)) {
            missingTypes.push(componentType);
          }
        } else {
          console.log(`   ✅ Found component type: "${componentType}"`);
        }
      });
    }
  });

  console.log(`\n📊 [VALIDATION] Summary:`);
  console.log(`   Total component types used: ${usedTypes.size}`);
  console.log(`   Missing types: ${missingTypes.length}`);
  if (missingTypes.length > 0) {
    console.log(`   Missing: ${missingTypes.join(', ')}`);
  }
  console.log(`   Valid: ${missingTypes.length === 0}\n`);

  return {
    valid: missingTypes.length === 0,
    missingTypes,
    usedTypes: Array.from(usedTypes),
  };
}

/**
 * Get all used component types from website data
 */
export function getUsedComponentTypes(websiteData: WebsiteMaster): Set<string> {
  const usedTypes = new Set<string>();

  // Handle both array and object formats for pages
  const pagesArray = Array.isArray(websiteData.pages)
    ? websiteData.pages
    : Object.values(websiteData.pages || {});

  pagesArray.forEach((page) => {
    if (page.components) {
      page.components.forEach((component: any) => {
        usedTypes.add(component.type);
      });
    }
  });

  return usedTypes;
}
