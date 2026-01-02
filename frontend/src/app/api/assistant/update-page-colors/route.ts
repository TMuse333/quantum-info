// app/api/assistant/update-page-colors/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import type { LlmColorOutput } from "../update-color/route";

interface ComponentColorData {
  id: string;
  type: string;
  currentColors: {
    mainColor?: string;
    textColor?: string;
    baseBgColor?: string;
    bgLayout?: {
      type: "radial" | "linear" | "solid";
      radialSize?: string;
      radialPosition?: string;
      radialBaseStop?: number;
      direction?: string;
      colorStops?: number[];
    };
  };
}

interface PageColorUpdateRequest {
  prompt: string;
  componentColors: ComponentColorData[];
  currentTheme?: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
    bgLayout: any;
  };
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, componentColors, currentTheme }: PageColorUpdateRequest = await req.json();

    if (!componentColors || !Array.isArray(componentColors) || componentColors.length === 0) {
      return NextResponse.json(
        { error: "componentColors is required and must be a non-empty array" },
        { status: 400 }
      );
    }

    // Build system prompt for page-wide theme update
    const componentSummary = componentColors.map((comp, idx) => {
      const colors = comp.currentColors;
      return `Component ${idx + 1} (${comp.type}):
- Main Color: ${colors.mainColor || "not set"}
- Text Color: ${colors.textColor || "not set"}
- Background: ${colors.baseBgColor || "not set"}
- Layout: ${colors.bgLayout?.type || "not set"}`;
    }).join("\n\n");

    const themeContext = currentTheme 
      ? `\n\nCurrent Website Theme:
- Primary: ${currentTheme.primary}
- Secondary: ${currentTheme.secondary}
- Text: ${currentTheme.text}
- Background: ${currentTheme.background}
- Layout: ${currentTheme.bgLayout?.type || "solid"}`
      : "";

    const systemPrompt = `You are a color and gradient designer for websites. Transform a user's theme request into a cohesive color scheme that will be applied to ALL components on a page.

Rules:
- Output MUST be valid JSON matching this structure:
{
  "theme": {
    "primary": "#hexcolor",
    "secondary": "#hexcolor",
    "text": "#hexcolor",
    "background": "#hexcolor",
    "bgLayout": {
      "type": "radial" | "linear" | "solid",
      // ... gradient config based on type
    }
  },
  "componentUpdates": [
    {
      "id": "component-id",
      "colors": {
        "mainColor": "#hexcolor",
        "textColor": "#hexcolor",
        "baseBgColor": "#hexcolor",
        "bgLayout": { ... }
      }
    }
  ]
}

- The "theme" object represents the overall website theme that should be saved
- The "componentUpdates" array contains color updates for each component
- Each component should follow the theme but can have slight variations for visual interest
- Use hex colors like "#00bfff" for all color fields
- Ensure good contrast for accessibility
- Maintain visual hierarchy (hero sections can be more vibrant, content sections more subtle)
- Return ONLY valid JSON, no extra text.

Current Components on Page:
${componentSummary}${themeContext}

The user wants to apply a theme across ALL these components. Generate a cohesive color scheme.`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_KEY}`,
        },
      }
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const llmOutput = JSON.parse(content) as {
      theme: {
        primary: string;
        secondary: string;
        text: string;
        background: string;
        bgLayout: any;
      };
      componentUpdates: Array<{
        id: string;
        colors: LlmColorOutput;
      }>;
    };

    return NextResponse.json({
      theme: llmOutput.theme,
      componentUpdates: llmOutput.componentUpdates,
    });
  } catch (error: any) {
    console.error("Error updating page colors:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update page colors" },
      { status: 500 }
    );
  }
}

