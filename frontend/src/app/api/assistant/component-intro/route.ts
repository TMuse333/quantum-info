// app/api/assistant/component-intro/route.ts
import { NextRequest } from "next/server";

export type EditablePropPayload = {
  key: string;
  label: string;
  description: string;
  type: "text" | "color" | "image" | "gradient" | "standardArray" | "testimonialArray";
};

export type ComponentIntroPayload = {
  title: string;
  overview: string;
  editableProps: EditablePropPayload[];
};

export type AssistantResponse = {
  message: string;
};

export async function POST(request: NextRequest) {
  try {
    const body: ComponentIntroPayload = await request.json();

    let message = `✨ Component: "${body.title}"\n\n`;
    message += `${body.overview}\n\n`;

    // Text and array fields
    const textFields = body.editableProps.filter(
      (p) => p.type === "text" || p.type === "standardArray" || p.type === "testimonialArray"
    );

    // Color fields
    const colorFields = body.editableProps.filter(
      (p) => p.type === "color" || p.type === "gradient"
    );

    if (textFields.length > 0) {
      message += `Let's start by setting the text:\n`;
      textFields.forEach((field) => {
        const typeLabel = field.type === "standardArray" ? "(list of items)" : field.type === "testimonialArray" ? "(testimonials)" : "";
        message += `• ${field.label} ${typeLabel}: ${field.description}\n`;
      });
    } else {
      message += `This component has no text to edit.\n\n`;
    }

    if (colorFields.length > 0) {
      message += `Now let's look at the colors:\n`;
      colorFields.forEach((field) => {
        message += `• ${field.label}: ${field.description}\n`;
      });
      message += `\n🎨 What colors would you like to use?`;
    } else {
      message += `No colors to edit in this component.`;
    }

    const response: AssistantResponse = { message };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in component-intro API route:", err);
    return new Response(JSON.stringify({ error: "Failed to process request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

