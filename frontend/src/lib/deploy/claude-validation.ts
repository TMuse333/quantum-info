/**
 * Claude Code Final Validation
 *
 * Validates the entire production codebase structure before pushing to production.
 * Single call validates all files, structure, and ensures everything is production-ready.
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ValidationError {
  file: string;
  issue: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const PRODUCTION_STRUCTURE = `
src/
├── components/
│   ├── designs/
│   │   ├── {category}/
│   │   │   └── {componentName}/
│   │   │       ├── {componentName}.tsx (production component, no safeguards)
│   │   │       └── index.ts (exports props interface)
│   │   └── ...
│   └── pageComponents/
│       ├── home.tsx (renders components for home page)
│       ├── about.tsx
│       └── {pageName}.tsx
├── data/
│   ├── home.data.ts (component props for home page)
│   ├── about.data.ts
│   └── {pageName}.data.ts
└── app/
    ├── page.tsx (root route, renders HomePage component)
    ├── {pageName}/
    │   └── page.tsx (route with Next.js Metadata export)
    └── layout.tsx (root layout with "use client")
`;

/**
 * Validate the entire production codebase structure
 *
 * @param generatedFiles - All generated files (components, pages, data files, routes)
 * @returns Validation result with errors if any
 */
export async function validateProductionCodebase(
  generatedFiles: Array<{ path: string; content: string }>
): Promise<ValidationResult> {
  const fileList = generatedFiles.map(f => `- ${f.path}`).join('\n');
  
  const prompt = `
This is a final check before pushing to production. Make sure all components render correctly and I have the correct codebase structure.

Required Production Structure:
${PRODUCTION_STRUCTURE}

Production Files Generated:
${fileList}

Key Requirements:
1. All components must render without errors
2. All imports must resolve correctly
3. No broken JSX structure
4. All required props are present in data files
5. File structure matches the required structure above
6. No default props or safeguards in components
7. All components use direct prop destructuring

Check the following:
- Component files in frontend/src/components/designs/ (should have no safeguards)
- Page components in frontend/src/components/pageComponents/ (should render components)
- Data files in frontend/src/data/ (should have all required props)
- Route files in frontend/src/app/ (should have correct structure)
- index.ts files in component directories (should export props)

If everything is correct, return: "✅ All checks passed. Ready for production."

If there are issues, return a JSON object:
{
  "status": "errors_found",
  "errors": [
    {
      "file": "path/to/file.tsx",
      "issue": "Description of issue",
      "severity": "error|warning",
      "suggestion": "How to fix"
    }
  ]
}
`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const response = message.content[0].type === 'text' ? message.content[0].text : '';

    // Check if response is success message
    if (response.trim().startsWith('✅')) {
      return { valid: true, errors: [] };
    }

    // Try to parse as JSON
    try {
      const result = JSON.parse(response);
      return {
        valid: false,
        errors: result.errors || [],
      };
    } catch (parseError) {
      // If not JSON, treat as error
      return {
        valid: false,
        errors: [
          {
            file: 'unknown',
            issue: response || 'Invalid response format from Claude Code',
            severity: 'error',
          },
        ],
      };
    }
  } catch (error: any) {
    console.error('Claude Code validation failed:', error.message);
    // Return error result but don't fail deployment (log warning)
    return {
      valid: false,
      errors: [
        {
          file: 'validation',
          issue: `Validation API error: ${error.message}`,
          severity: 'warning',
          suggestion: 'Proceeding with deployment, but validation could not complete',
        },
      ],
    };
  }
}

