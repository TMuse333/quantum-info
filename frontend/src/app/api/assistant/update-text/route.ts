import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import {  StandardText, TestimonialText } from '@/types/editorial';
import { LlmTextOutput } from "@/types/llmOutputs";

interface EditableFieldWithArray {
  key: string;
  label: string;
  description: string;
  type: "text" | "color" | "image" | "gradient" | "standardArray" | "testimonialArray";
  wordLimit?: number;
  arrayLength?: { fixed?: number; min?: number; max?: number };
}

export async function POST(req: NextRequest) {
  const { prompt, editableFields, currentComponent, pageSlug, currentProps }: { 
    prompt: string; 
    editableFields: EditableFieldWithArray[];
    currentComponent?: { id: string; name: string };
    pageSlug?: string;
    currentProps?: Record<string, any>;
  } = await req.json();

  // Only allow text or array fields
  const allowedFields = editableFields.filter(
    (f): f is EditableFieldWithArray & { type: "text" | "standardArray" | "testimonialArray" } =>
      f.type === "text" || f.type === "standardArray" || f.type === "testimonialArray"
  );

  const allowedKeys = allowedFields.map((f) => f.key);

  const buildFieldGuidance = (
    fields: (EditableFieldWithArray & { type: "text" | "standardArray" | "testimonialArray" })[],
    prefix = ""
  ): string =>
    fields
      .map((field) => {
        let guidance = `- ${prefix}${field.key}: ${field.label}. ${field.description}. Type: ${field.type}.`;
        if (field.wordLimit) guidance += ` Max word limit: ${field.wordLimit} words.`;
        if (
          (field.type === "standardArray" || field.type === "testimonialArray") &&
          field.arrayLength
        ) {
          guidance += ` Array constraints:`;
          if (field.arrayLength.fixed !== undefined)
            guidance += ` Exactly ${field.arrayLength.fixed} items.`;
          else {
            if (field.arrayLength.min !== undefined)
              guidance += ` At least ${field.arrayLength.min} items.`;
            if (field.arrayLength.max !== undefined)
              guidance += ` At most ${field.arrayLength.max} items.`;
          }
          guidance += field.type === "standardArray"
            ? ` Each item must have "title" and "description".`
            : ` Each item must have "name", "role", "quote", optional "src" and "alt".`;
        }
        return guidance;
      })
      .join("\n");

  const keyGuidance = buildFieldGuidance(allowedFields);

  const systemPrompt = `
You are a website copywriting AI assistant. Transform user instructions into engaging website copy.

Rules:
- Output MUST be valid JSON matching this exact TypeScript type:

export type LlmTextOutput = {
  title: string;
  description: string;
  subTitle: string;
  buttonText: string;
  array?: Array<StandardText | TestimonialText>;
};

- CRITICAL: Always use the key "array" for array fields, never "textArray", "items", or any other name.
- Only populate keys listed in 'Allowed keys': ${allowedKeys.join(", ")}.
- For text fields:
  - Generate concise, benefit-driven copy.
  - Respect word limits.
- For array fields:
  - Use a single unified "array" property (NOT "textArray" or "items").
  - If field type is "standardArray", each item must have "title" and "description".
  - If field type is "testimonialArray", each item must have "name", "role", "quote", optional "src" and "alt".
  - Respect arrayLength constraints.
- For non-text fields (color, image, gradient), always return "".
- Return ONLY valid JSON; no extra text.
- ${keyGuidance}
`;

  // Initialize base structure
  let updatedProps: LlmTextOutput = {
    title: "",
    description: "",
    subTitle: "",
    buttonText: "",
    array: [],
  };

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

    const content: string | undefined = response.data.choices?.[0]?.message?.content;

    console.log("\n[Route] 🔹 Raw LLM output:");
    console.log(content);

    if (content) {
      try {
        // Parse and handle potential key mismatches (textArray, items, etc.)
        const parsed = JSON.parse(content) as LlmTextOutput & { 
          textArray?: unknown[]; 
          items?: unknown[];
        };

        updatedProps = {
          title: parsed.title ?? "",
          description: parsed.description ?? "",
          subTitle: parsed.subTitle ?? "",
          buttonText: parsed.buttonText ?? "",
          // Check multiple possible array key names for robustness
          array: (parsed.array ?? parsed.textArray ?? parsed.items ?? []) as (StandardText | TestimonialText)[],
        };

        console.log("\n[Route] ✅ Final mapped updatedProps:");
        console.log(JSON.stringify(updatedProps, null, 2));
      } catch (err) {
        console.error("❌ JSON parse error:", err);
        console.log("Raw content:", content);
      }
    }
  } catch (err) {
    console.error("❌ OpenAI API request error:", err);
  }

  return NextResponse.json(updatedProps);
}

