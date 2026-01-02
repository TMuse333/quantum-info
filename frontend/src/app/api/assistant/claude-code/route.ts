import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { componentGenerationInstructions } from "@/lib/prompts/componentGenerationInstructions";

interface ClaudeCodeRequest {
  prompt: string;
  currentComponent?: {
    name?: string;
    type?: string;
    id?: string;
  };
  websiteData?: any; // WebsiteMaster or similar
}

interface FileChange {
  path: string;
  changes: string; // New file content
  diff: string; // Diff representation
  action: "modify" | "create" | "delete";
}

interface ClaudeCodeResponse {
  files: FileChange[];
  preview: string; // Human-readable description of changes
  originalPrompt: string;
  explanation: string; // What Claude will do
}

export async function POST(req: NextRequest) {
  const { prompt, currentComponent, websiteData }: ClaudeCodeRequest = await req.json();

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Build context about the current website structure
  const websiteContext = websiteData
    ? `Current website structure:
- Pages: ${websiteData.pages?.map((p: any) => p.slug || p.pageName).join(", ") || "none"}
- Current component: ${currentComponent?.name || currentComponent?.type || "none"}
- Component ID: ${currentComponent?.id || "none"}
`
    : "";

  const systemPrompt = `You are a code generation assistant that helps modify website components and structure.

Your task is to analyze the user's request and generate the necessary code changes to implement structural modifications to a Next.js/React website.

The website uses:
- Next.js App Router
- React components in TypeScript
- Components are located in \`src/components/designs/\`
- Website data structure is in \`src/data/websiteData.json\`
- Editorial components (for editing) are in \`src/components/designs/*/*Edit.tsx\`
- Design components (production) are in \`src/components/designs/*/[componentName].tsx\`
- Component definitions and exports are in \`src/components/designs/*/[componentName]/index.ts\`

            When generating changes:
            1. Identify which files need to be modified
            2. Provide the complete updated file content (not just diffs)
            3. Include both editorial and design components if needed
            4. Update websiteData.json if component structure changes
            5. **CRITICAL: If creating a new component, you MUST also update src/components/pageComponents/componentMap.tsx**
               - Add import: import { ComponentNameEdit } from "@/components/designs/[category]/[componentName]";
               - Add entry: componentName: ComponentNameEdit,
               - The map key must match the type used in websiteData.json
               - Without this, the component will not render
            6. Maintain TypeScript types and interfaces
            7. Preserve existing functionality unless explicitly requested to change

Return your response as JSON with this structure:
{
  "explanation": "Clear explanation of what changes will be made",
  "files": [
    {
      "path": "relative/path/to/file.tsx",
      "changes": "complete file content with modifications",
      "diff": "brief description of what changed (e.g., 'Reordered h2 and p tags in hero section')",
      "action": "modify" | "create" | "delete"
    }
  ],
  "preview": "Human-readable summary of all changes"
}

Important:
- Always provide complete file content, not partial diffs
- Maintain code formatting and style
- Ensure TypeScript types are correct
- If modifying component order in websiteData.json, update the components array
- If adding new components, create both Edit and design versions

${componentGenerationInstructions}`;

  try {
    const userMessage = `${websiteContext}User request: "${prompt}"

Please generate the code changes needed to implement this request. Return the response as valid JSON matching the structure specified above.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514", // Updated to latest Sonnet
      max_tokens: 8192, // Increased for better code generation
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    // Extract content from Claude's response
    const content = message.content[0];
    let textContent = "";

    if (content.type === "text") {
      textContent = content.text;
    } else {
      return NextResponse.json(
        { error: "Unexpected response format from Claude" },
        { status: 500 }
      );
    }

    // Try to parse JSON from the response
    // Claude might wrap JSON in markdown code blocks
    let jsonText = textContent.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    try {
      const parsed = JSON.parse(jsonText) as Omit<ClaudeCodeResponse, "originalPrompt">;

      // Validate response structure
      if (!parsed.files || !Array.isArray(parsed.files)) {
        return NextResponse.json(
          { error: "Invalid response structure: missing or invalid files array" },
          { status: 500 }
        );
      }

      // Validate each file change
      for (const file of parsed.files) {
        if (!file.path || !file.changes || !file.action) {
          return NextResponse.json(
            { error: "Invalid file change structure: missing required fields" },
            { status: 500 }
          );
        }
        if (!["modify", "create", "delete"].includes(file.action)) {
          return NextResponse.json(
            { error: `Invalid file action: ${file.action}` },
            { status: 500 }
          );
        }
      }

      const response: ClaudeCodeResponse = {
        ...parsed,
        originalPrompt: prompt,
        preview: parsed.preview || parsed.explanation || "Structural changes generated",
      };

      return NextResponse.json(response);
    } catch (parseError) {
      console.error("Error parsing Claude response as JSON:", parseError);
      console.error("Raw response:", textContent);

      // If JSON parsing fails, try to extract information from text
      return NextResponse.json(
        {
          error: "Failed to parse Claude response as JSON",
          rawResponse: textContent.substring(0, 500), // First 500 chars for debugging
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error calling Claude API:", error);
    return NextResponse.json(
      {
        error: "Failed to generate code changes",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

