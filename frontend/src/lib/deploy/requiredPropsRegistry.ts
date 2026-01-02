/**
 * Registry of required props for each component type
 * Used to ensure all mandatory props are included in generated data files
 * 
 * Rules:
 * - Images: Use /placeholder.webp
 * - Strings: Use empty string ""
 * - Arrays: Use empty array with one empty object
 */

export interface RequiredPropsMap {
  [componentType: string]: {
    [propName: string]: any; // Default/placeholder value
  };
}

export const REQUIRED_PROPS_REGISTRY: RequiredPropsMap = {
  imageTextBox: {
    images: {
      main: {
        src: "/placeholder.webp",
        alt: "Image"
      }
    },
    buttonText: ""
  },
  profileCredentials: {
    images: {
      profile: {
        src: "/placeholder.webp",
        alt: "Profile"
      }
    },
    textArray: [
      {
        title: "",
        description: ""
      }
    ]
  },
  processSteps: {
    textArray: [
      {
        title: "",
        description: ""
      }
    ]
  },
  valueProposition: {
    textArray: [
      {
        title: "",
        description: ""
      }
    ],
    buttonText: ""
  },
  marketingShowcase: {
    textArray: [
      {
        title: "",
        description: ""
      }
    ],
    buttonText: ""
  },
  // Add more components as needed
};

/**
 * Get default values for required props that are missing
 */
export function getRequiredPropsDefaults(componentType: string): Record<string, any> {
  return REQUIRED_PROPS_REGISTRY[componentType] || {};
}

/**
 * Merge existing props with required props defaults
 * Only adds props that are missing from existingProps
 */
export function mergeRequiredProps(
  componentType: string,
  existingProps: Record<string, any>
): Record<string, any> {
  const defaults = getRequiredPropsDefaults(componentType);
  const merged = { ...existingProps };

  // Deep merge to handle nested objects
  Object.keys(defaults).forEach((key) => {
    if (!(key in merged)) {
      merged[key] = defaults[key];
    } else if (
      typeof defaults[key] === 'object' &&
      defaults[key] !== null &&
      !Array.isArray(defaults[key]) &&
      typeof merged[key] === 'object' &&
      merged[key] !== null &&
      !Array.isArray(merged[key])
    ) {
      // Deep merge nested objects
      merged[key] = {
        ...defaults[key],
        ...merged[key],
      };
    }
  });

  return merged;
}

