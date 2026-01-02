/**
 * Production Page Data Template
 *
 * This template is used to generate production page.data.ts files.
 * Placeholders will be replaced during the build process:
 * - {{TYPE_IMPORTS}} - Import statements for prop types (only for components used on this page)
 * - {{COMPONENT_PROPS_EXPORTS}} - Individual component prop exports
 * - {{COMPONENTS_ARRAY}} - Array of components with metadata
 */

export const PAGE_DATA_TEMPLATE = `/**
 * Generated page data file
 * This file contains the props and metadata for all components on this page
 */

{{TYPE_IMPORTS}}

// Component Props
{{COMPONENT_PROPS_EXPORTS}}

// Components Array with metadata
export const components = {{COMPONENTS_ARRAY}};
`;

/**
 * Normalize import path to point to directory (resolves to index.ts)
 * Removes filename if present
 * 
 * @param path - Import path (may include filename)
 * @returns Normalized path pointing to directory
 * 
 * @example
 * normalizeImportPath('@/components/designs/herobanners/auroraImageHero/auroraImageHero')
 * // Returns: '@/components/designs/herobanners/auroraImageHero'
 */
export function normalizeImportPath(path: string): string {
  // Remove trailing filename if it matches the directory name
  // e.g., '/auroraImageHero/auroraImageHero' -> '/auroraImageHero'
  const parts = path.split('/');
  const lastPart = parts[parts.length - 1];
  const secondLastPart = parts[parts.length - 2];
  
  // If last two parts are the same, remove the last one
  if (lastPart === secondLastPart) {
    return parts.slice(0, -1).join('/');
  }
  
  return path;
}

/**
 * Helper to generate type import statement
 * @param propsTypeName - The props type name (e.g., "AuroraImageHeroProps")
 * @param propsPath - The import path (e.g., "@/components/designs/herobanners/auroraImageHero")
 * @returns Import statement string
 */
export function generateTypeImport(propsTypeName: string, propsPath: string): string {
  const normalizedPath = normalizeImportPath(propsPath);
  return `import { ${propsTypeName} } from "${normalizedPath}";`;
}

/**
 * Helper to generate component props export
 * @param varName - The variable name (e.g., "component1Props")
 * @param propsTypeName - The props type name (e.g., "AuroraImageHeroProps")
 * @param propsData - The props data object
 * @returns Export statement string
 */
export function generatePropsExport(
  varName: string,
  propsTypeName: string,
  propsData: Record<string, any>
): string {
  const propsJson = JSON.stringify(propsData, null, 2);
  return `export const ${varName}: ${propsTypeName} = ${propsJson};`;
}

/**
 * Helper to format components array for template insertion
 * @param components - Array of component metadata
 * @returns Formatted JSON string
 */
export function formatComponentsArray(
  components: Array<{
    id: string;
    type: string;
    order: number;
    propsVar: string;
  }>
): string {
  return JSON.stringify(components, null, 2);
}
