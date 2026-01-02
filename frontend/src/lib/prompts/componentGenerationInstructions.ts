/**
 * Component Generation Instructions for Claude Code
 * 
 * This file reads the component instructions from the markdown file.
 * The markdown file can be updated from the easy-money app or other sources.
 * 
 * To update instructions: Edit frontend/docs/components/component-intructions.md
 */

import { readFileSync } from "fs";
import { join } from "path";

/**
 * Reads component generation instructions from the markdown file
 * Falls back to a basic instruction set if file cannot be read
 */
export function getComponentGenerationInstructions(): string {
  try {
    // Try multiple possible paths (Next.js API routes run from project root)
    const possiblePaths = [
      // Current location after docs reorganization
      join(process.cwd(), "frontend", "docs", "components", "component-intructions.md"),
      // From project root (when running Next.js) - old location
      join(process.cwd(), "frontend", "docs", "component-intructions.md"),
      // From frontend directory
      join(process.cwd(), "docs", "component-intructions.md"),
      // Relative to this file's location - new location
      join(__dirname, "..", "..", "..", "docs", "components", "component-intructions.md"),
      // Relative to this file's location - old location
      join(__dirname, "..", "..", "..", "docs", "component-intructions.md"),
      // Alternative relative path
      join(__dirname, "..", "..", "docs", "component-intructions.md"),
    ];

    for (const filePath of possiblePaths) {
      try {
        const instructions = readFileSync(filePath, "utf-8");
        console.log(`✅ Loaded component instructions from: ${filePath}`);
        return instructions;
      } catch (err) {
        // Try next path
        continue;
      }
    }

    throw new Error("Could not find component-intructions.md in any expected location");
  } catch (error) {
    console.warn("⚠️ Could not read component-intructions.md, using fallback instructions:", error);
    // Fallback to basic instructions if file not found
    return `# Component Generation Guide

If you encounter issues or need clarification, you can see examples in the designs folder.

## Basic Component Structure

Every component must have three files:
1. Production component: \`componentName.tsx\`
2. Editorial component: \`componentNameEdit.tsx\`
3. Index file: \`index.ts\` with EditableComponent definition

See existing components in \`src/components/designs/\` for examples.
`;
  }
}

/**
 * Export as a constant for backward compatibility
 * This reads the file synchronously - for API routes this is fine
 */
export const componentGenerationInstructions = getComponentGenerationInstructions();
