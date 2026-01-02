// app/api/assistant/update-colors/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { EditableField } from '@/types/editorial';

export type LlmColorOutput = {
  mainColor: string;
  textColor: string;
  baseBgColor?: string;
  bgLayout: {
    type: "radial" | "linear" | "solid";
    radialSize?: string;
    radialPosition?: string;
    radialBaseStop?: number;
    direction?: string;
    colorStops?: number[];
  };
};

export async function POST(req: NextRequest) {
  const { prompt, editableFields, currentColors, currentComponent, pageSlug } = await req.json();
  console.log("Received currentColors:", currentColors);
  console.log("Received editableFields:", editableFields);

  // Safety check: ensure editableFields is an array
  if (!editableFields || !Array.isArray(editableFields)) {
    console.error("editableFields is missing or not an array:", editableFields);
    return NextResponse.json(
      { error: "editableFields is required and must be an array" },
      { status: 400 }
    );
  }

  const allowedFields = editableFields.filter(
    (f: EditableField) => f.type === "color" || f.type === "gradient"
  );

  const keyGuidance = allowedFields
    .map((field: EditableField) => `- ${field.key}: ${field.description}. Type: ${field.type}.`)
    .join("\n");

    const systemPrompt = `
    You are a color and gradient designer for websites. Transform user requests into a structured color output.
    
    Rules:
    - Output MUST be valid JSON matching this TypeScript type:
    export type LlmColorOutput = {
      mainColor: string;
      textColor: string;
      baseBgColor?: string;
      bgLayout: {
        type: "radial" | "linear" | "solid";
        radialSize?: string;
        radialPosition?: string;
        radialBaseStop?: number;
        direction?: string;
        colorStops?: string[];
      };
    };
    - Use hex colors like "#00bfff" for all color fields.
    - For gradient fields: provide an array of hex colors only if the user explicitly requested a gradient change.
    - Only update "bgLayout" if the user explicitly mentions a gradient change.
    - IMPORTANT: If the "type" of bgLayout is not mentioned in the user request, keep it exactly as it was in the initial colors. Do not default to "solid".
    - Only update keys provided in editableFields: ${allowedFields.map((f: EditableField) => f.key).join(", ")}
    - Field guidance:
    ${keyGuidance}
    - Ensure good contrast for accessibility.
    - Return ONLY valid JSON, no extra text.
    
    ### Additional Guidance for Color Relationships
    
    When generating colors, follow these layout-specific principles:
    
    🎯 **1️⃣ Radial gradients**
    - The \`baseBgColor\` represents the **main background base**, usually the inner or outer color of the gradient.
    - The \`mainColor\` acts as the **accent or highlight** color that blends within the radial gradient.
    - Always maintain visual contrast between \`mainColor\` and \`baseBgColor\` (for example, a bright mainColor on a darker base, or vice versa).
    - Example: A "purple glow" might have a dark indigo \`baseBgColor\` with a light purple \`mainColor\`.
    
    🎯 **2️⃣ Linear gradients**
    - The \`baseBgColor\` should align closely with the **overall background tone** (the first color in the gradient).
    - The \`mainColor\` can serve as the second or accent color, providing directional variation.
    - If the user requests a "non-radial" (e.g., linear or solid) background, the \`baseBgColor\` should visually match the gradient's base color or solid background tone.
    - Example: "Orange linear gradient" → \`baseBgColor: "#FFA500"\`, \`bgLayout.colorStops: ["#FFA500", "#FF4500"]\`, and \`mainColor\` can be adjusted to complement or contrast that tone (e.g. blue text or highlight).
    
    🎯 **3️⃣ Solid backgrounds**
    - The \`baseBgColor\` is the primary visible background.
    - The \`mainColor\` should contrast well with it (for buttons, accents, etc.).
    - Example: A "black background with gold text" → \`baseBgColor: "#000000"\`, \`textColor: "#FFD700"\`, \`mainColor\` can stay in the same hue family or serve as a complementary accent.
    
    ⚖️ **Contrast Rule**
    - Always ensure enough luminance contrast between \`textColor\`, \`mainColor\`, and \`baseBgColor\` so text and accents remain readable and distinct.
    
    ### Examples
    
    1️⃣ **Radial gradient request**
    Initial bgLayout:
    {
      type: "radial",
      radialSize: "125% 125%",
      radialPosition: "50% 0%",
      radialBaseStop: 50
    }
    User asks: "Make a purple gradient"
    Output bgLayout:
    {
      type: "radial",
      radialSize: "125% 125%",
      radialPosition: "50% 0%",
      radialBaseStop: 50,
      colorStops: ["#8B5CF6", "#C084FC"]
    }
    baseBgColor: "#8B5CF6"
    mainColor: "#C084FC"
    
    2️⃣ **Linear gradient request**
    Initial bgLayout:
    {
      type: "linear",
      direction: "to bottom"
    }
    User asks: "Make a blue gradient"
    Output bgLayout:
    {
      type: "linear",
      direction: "to bottom",
      colorStops: ["#3B82F6", "#60A5FA"]
    }
    baseBgColor: "#3B82F6"
    mainColor: "#60A5FA"
    
    3️⃣ **Solid color request**
    Initial bgLayout:
    {
      type: "radial",
      radialSize: "125% 125%",
      radialPosition: "50% 0%",
      radialBaseStop: 50
    }
    User asks: "Change background to black"
    Output bgLayout:
    {
      type: "radial",
      radialSize: "125% 125%",
      radialPosition: "50% 0%",
      radialBaseStop: 50
    }
    baseBgColor: "#000000"
    mainColor: "#FFD700" // gold accent or text contrast
    `;
    
    
    

  // Safety check: ensure currentColors exists
  if (!currentColors) {
    console.error("currentColors is missing");
    return NextResponse.json(
      { error: "currentColors is required" },
      { status: 400 }
    );
  }

  // Start with current colors to preserve fields not touched by LLM
  const updatedColors: LlmColorOutput = {
    mainColor: currentColors.mainColor || "#00bfff",
    textColor: currentColors.textColor || "#111111",
    baseBgColor: currentColors.baseBgColor,
    bgLayout: currentColors.bgLayout || { type: "solid" },
  };

  console.log("Initial updatedColors before LLM:", updatedColors);

  try {
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
    if (content) {
      console.log("Raw LLM content:", content);
      const llmOutput = JSON.parse(content) as Partial<LlmColorOutput>;

      // Merge main fields
      if (llmOutput.mainColor) updatedColors.mainColor = llmOutput.mainColor;
      if (llmOutput.textColor) updatedColors.textColor = llmOutput.textColor;
      if (llmOutput.baseBgColor) updatedColors.baseBgColor = llmOutput.baseBgColor;

      // Merge bgLayout only if present
      if (llmOutput.bgLayout) {
        console.log("LLM provided bgLayout:", llmOutput.bgLayout);
        updatedColors.bgLayout = {
          ...currentColors.bgLayout,
          ...llmOutput.bgLayout,
        };
      } else {
        console.log("LLM did NOT provide bgLayout, keeping current:", currentColors.bgLayout);
      }
    }
  } catch (err) {
    console.error("OpenAI API error:", err);
  }

  console.log("Final updatedColors sent to frontend:", updatedColors);
  return NextResponse.json(updatedColors);
}

