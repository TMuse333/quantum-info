import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { SEOMetadata } from "@/types/website";

export async function POST(req: NextRequest) {
  try {
    const { prompt, websiteInfo, pageSlug } = await req.json();

    // Build context from website info
    const websiteContext = websiteInfo
      ? Object.entries(websiteInfo)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n")
      : "";

    const systemPrompt = `
You are an expert SEO strategist and metadata writer for small business websites.

${websiteContext ? `WEBSITE INFORMATION:\n${websiteContext}\n` : ""}

Generate a **metadata object** in valid JSON format exactly like this example:

{
  "title": "Web Design Halifax | Focusflow Software",
  "description": "Win over clients in the online market with a custom coded website strategically designed to put you on top and elevate your online presence.",
  "keywords": "web design halifax, custom web design services, creative web page design, web designer halifax",
  "openGraph": {
    "title": "Focus Flow Software | Web Design Halifax",
    "description": "Win over clients in the online market with a custom coded website strategically designed to put you on top and elevate your online presence.",
    "url": "https://www.focusflowsoftware.com",
    "images": [
      {
        "url": "https://www.focusflowsoftware.com/focusflow-hero.png",
        "width": 1200,
        "height": 630,
        "alt": "Focus Flow Software - Creative and Fast Web Design"
      }
    ],
    "type": "website",
    "locale": "en_US",
    "siteName": "FocusFlow Software | Web Design Halifax"
  },
  "icons": {
    "icon": ["/favicon.ico?v=4"]
  }
}

Rules:
- Keep "title" under 60 characters.
- Keep "description" under 160 characters.
- "keywords" should be 5–10 high-performing SEO keywords, comma-separated.
- Always include the business name and location (if possible) in "title" and "description".
- "openGraph.title" and "openGraph.description" should match or closely reflect "title" and "description".
- "openGraph.url" should be formatted as: https://www.{businessNameNoSpaces}.com (use lowercase, no spaces or special chars).
- "openGraph.siteName" should be the business name and optionally the main keyword or location.
- "openGraph.images[0].alt" should summarize the business visually (e.g. "Modern Website for Halifax Real Estate Company").
- "openGraph.locale" should be appropriate (e.g., "en_US", "en_CA", "en_GB").
- Return ONLY valid JSON, no commentary or extra text.
`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt || "Generate optimized SEO metadata for this page." },
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_KEY}`,
        },
      }
    );

    let content = response.data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content received from LLM");

    // Robust parsing: Strip any markdown wrappers like ```json ... ```
    content = content.trim();
    if (content.startsWith("```json")) {
      content = content.slice(7).trim();
    }
    if (content.endsWith("```")) {
      content = content.slice(0, -3).trim();
    }

    const metadata = JSON.parse(content) as SEOMetadata;

    // Log usage
    const { logUsageDirect } = await import("@/lib/usage/logUsage");
    const usage = response.data.usage || {};
    await logUsageDirect({
      prompt: prompt || "Generate SEO metadata",
      promptType: "seo-generation",
      provider: "openai",
      model: "gpt-4o-mini",
      requestDetails: {
        systemPrompt,
        userMessage: prompt || "Generate optimized SEO metadata for this page.",
      },
      response: {
        content: JSON.stringify(metadata),
      },
      tokens: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
      },
      status: "success",
      projectId: "default", // TODO: Get from request context
      requestId: crypto.randomUUID(),
    });

    return NextResponse.json({
      success: true,
      metadata,
    });
  } catch (err: any) {
    console.error("[Generate SEO Metadata] ❌", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to generate metadata",
      },
      { status: 500 }
    );
  }
}

