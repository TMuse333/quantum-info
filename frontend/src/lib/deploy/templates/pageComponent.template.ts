/**
 * Page Component Template
 *
 * Template for generating page component files that render design components
 */

/**
 * Template for page component files
 *
 * Placeholders:
 * - {{COMPONENT_IMPORTS}} - Import statements for all components used on the page
 * - {{PROPS_IMPORTS}} - Import statements for props from data file
 * - {{PAGE_NAME}} - Page component name (e.g., HomePage, AboutPage)
 * - {{COMPONENT_RENDERS}} - Component render statements
 */
export const PAGE_COMPONENT_TEMPLATE = `{{COMPONENT_IMPORTS}}
{{PROPS_IMPORTS}}

export default function {{PAGE_NAME}}() {
  return (
    <main>
{{COMPONENT_RENDERS}}
    </main>
  );
}
`;

/**
 * Generate component import statement
 * 
 * Note: Props types are NOT imported here because they're not used in page components.
 * Page components just spread the props, so TypeScript types aren't needed at runtime.
 *
 * @param componentName - Component name (e.g., "AuroraImageHero")
 * @param componentPath - Import path for the component
 * @param propsTypeName - Props type name (unused, kept for API compatibility)
 * @param propsPath - Import path for the props type (unused, kept for API compatibility)
 * @returns Import statement string
 *
 * @example
 * generateComponentImport(
 *   'AuroraImageHero',
 *   '@/components/designs/herobanners/auroraImageHero/auroraImageHero',
 *   'AuroraImageHeroProps',
 *   '@/components/designs/herobanners/auroraImageHero/auroraImageHero'
 * )
 * // Returns: import AuroraImageHero from '@/components/designs/herobanners/auroraImageHero/auroraImageHero';
 */
export function generateComponentImport(
  componentName: string,
  componentPath: string,
  propsTypeName: string,
  propsPath: string
): string {
  // Only import the component, not the props type (it's not used in page components)
  return `import ${componentName} from '${componentPath}';`;
}

/**
 * Generate props import statement from data file
 *
 * @param propsVarNames - Array of prop variable names to import
 * @param pageSlug - Page slug (e.g., "home", "about")
 * @returns Import statement string
 *
 * @example
 * generatePropsImport(['component1Props', 'component2Props'], 'home')
 * // Returns: import { component1Props, component2Props } from '@/data/home.data';
 */
export function generatePropsImport(propsVarNames: string[], pageSlug: string): string {
  if (propsVarNames.length === 0) {
    return '';
  }

  return `import { ${propsVarNames.join(', ')} } from '@/data/${pageSlug}.data';`;
}

/**
 * Generate component render statement
 *
 * @param componentName - Component name (e.g., "AuroraImageHero")
 * @param propsVarName - Props variable name (e.g., "component1Props")
 * @returns Render statement string
 *
 * @example
 * generateComponentRender('AuroraImageHero', 'component1Props')
 * // Returns: '      <AuroraImageHero {...component1Props} />'
 */
export function generateComponentRender(
  componentName: string,
  propsVarName: string
): string {
  return `      <${componentName} {...${propsVarName}} />`;
}

/**
 * Capitalize page name for component name
 *
 * @param slug - Page slug (e.g., "home", "about", "contact-us")
 * @returns Capitalized page name (e.g., "HomePage", "AboutPage", "ContactUsPage")
 *
 * @example
 * capitalizePageName('home') // 'HomePage'
 * capitalizePageName('about') // 'AboutPage'
 * capitalizePageName('contact-us') // 'ContactUsPage'
 */
export function capitalizePageName(slug: string): string {
  // Handle special cases
  if (slug === 'index') {
    return 'HomePage';
  }

  // Split by hyphens, capitalize each word, join together
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('') + 'Page';
}
