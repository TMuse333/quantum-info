import type { WebsiteMaster } from "@/types/website";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate that a string is a valid hex color code
 */
export const validateColor = (color: string): boolean => {
  if (!color) return false;
  return /^#[0-9A-F]{6}$/i.test(color);
};

/**
 * Validate that text meets basic requirements
 */
export const validateText = (text: string, options?: {
  required?: boolean;
  maxLength?: number;
  minLength?: number;
}): boolean => {
  const { required = false, maxLength = 10000, minLength = 0 } = options || {};

  if (!text || !text.trim()) {
    return !required; // OK if not required, fail if required
  }

  const length = text.trim().length;
  return length >= minLength && length <= maxLength;
};

/**
 * Validate the entire WebsiteMaster data structure before saving
 */
export const validateWebsiteData = (data: WebsiteMaster | null): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if data exists
  if (!data) {
    errors.push("No website data to validate");
    return { valid: false, errors, warnings };
  }

  // Basic structure checks
  if (!data.pages) {
    errors.push("No pages defined in website data");
    return { valid: false, errors, warnings };
  }

  const pagesArray = Array.isArray(data.pages)
    ? data.pages
    : Object.values(data.pages);

  if (pagesArray.length === 0) {
    errors.push("Website must have at least one page");
  }

  // Validate color theme if present
  if (data.colorTheme) {
    if (data.colorTheme.primary && !validateColor(data.colorTheme.primary)) {
      errors.push(`Invalid primary color: "${data.colorTheme.primary}". Must be hex format like #FF0000`);
    }
    if (data.colorTheme.text && !validateColor(data.colorTheme.text)) {
      errors.push(`Invalid text color: "${data.colorTheme.text}". Must be hex format like #000000`);
    }
    if (data.colorTheme.background && !validateColor(data.colorTheme.background)) {
      errors.push(`Invalid background color: "${data.colorTheme.background}". Must be hex format like #FFFFFF`);
    }
  }

  // Validate each page
  pagesArray.forEach((page: any, pageIndex: number) => {
    const pageName = page.name || page.slug || `Page ${pageIndex}`;

    // Check page has components
    if (!page.components || !Array.isArray(page.components)) {
      errors.push(`${pageName}: Components array is missing or invalid`);
      return;
    }

    if (page.components.length === 0) {
      warnings.push(`${pageName}: Has no components (empty page)`);
    }

    // Validate each component
    page.components.forEach((comp: any, compIndex: number) => {
      const componentRef = `${pageName} > Component ${compIndex + 1} (${comp.type || 'unknown'})`;

      // Check component has required fields
      if (!comp.type) {
        errors.push(`${componentRef}: Missing component type`);
      }

      if (!comp.props) {
        errors.push(`${componentRef}: Missing props object`);
        return;
      }

      // Validate color props
      if (comp.props.mainColor && !validateColor(comp.props.mainColor)) {
        errors.push(`${componentRef}: Invalid mainColor "${comp.props.mainColor}"`);
      }
      if (comp.props.textColor && !validateColor(comp.props.textColor)) {
        errors.push(`${componentRef}: Invalid textColor "${comp.props.textColor}"`);
      }
      if (comp.props.baseBgColor && !validateColor(comp.props.baseBgColor)) {
        errors.push(`${componentRef}: Invalid baseBgColor "${comp.props.baseBgColor}"`);
      }

      // Validate component-specific required fields
      switch (comp.type) {
        case 'auroraImageHero':
        case 'hero':
          if (!validateText(comp.props.title, { required: false })) {
            warnings.push(`${componentRef}: Hero component has no title`);
          }
          break;

        case 'textAndList':
          if (!validateText(comp.props.title, { required: false })) {
            warnings.push(`${componentRef}: Text and list has no title`);
          }
          break;

        // Add more component-specific validation as needed
      }

      // Check for extremely long text that might cause issues
      if (comp.props.description && comp.props.description.length > 5000) {
        warnings.push(`${componentRef}: Description is very long (${comp.props.description.length} chars)`);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Format validation errors for display to user
 */
export const formatValidationErrors = (result: ValidationResult): string => {
  const parts: string[] = [];

  if (result.errors.length > 0) {
    parts.push("❌ Errors:");
    result.errors.forEach(err => parts.push(`  • ${err}`));
  }

  if (result.warnings.length > 0) {
    parts.push("\n⚠️ Warnings:");
    result.warnings.forEach(warn => parts.push(`  • ${warn}`));
  }

  return parts.join('\n');
};
