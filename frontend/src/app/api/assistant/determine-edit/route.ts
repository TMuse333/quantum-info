import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { extractOpenAITokens } from "@/lib/usage/tokenPricing";
import { randomUUID } from "crypto";

interface ClassificationResponse {
  type: "simple" | "structural";
  editType?: "text" | "color" | null;
  reason: string;
}

export async function POST(req: NextRequest) {
  const { prompt, currentComponent, projectId, websiteData }: {
    prompt: string;
    currentComponent?: any;
    projectId?: string;
    websiteData?: any;
  } = await req.json();

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json(
      { error: "Prompt is required" },
      { status: 400 }
    );
  }

  // Get project ID from request or try to detect from git
  let detectedProjectId = projectId;
  if (!detectedProjectId) {
    try {
      const repoInfoResponse = await fetch(`${req.nextUrl.origin}/api/git/repo-info`);
      if (repoInfoResponse.ok) {
        const repoInfo = await repoInfoResponse.json();
        if (repoInfo.repoOwner && repoInfo.repoName) {
          detectedProjectId = `${repoInfo.repoOwner}/${repoInfo.repoName}`;
        }
      }
    } catch (error) {
      console.warn("Could not detect project ID:", error);
    }
  }

  const requestId = randomUUID();

  // Use OpenAI to classify the edit type
  const systemPrompt = `You are an AI assistant that classifies website edit requests.

Classify the user's request into one of these categories:
- "simple-text": Simple text content changes that can be updated in JSON/props (e.g., "make title more engaging", "change button text", "update description", "rewrite headline")
- "simple-color": Simple color/style changes that can be updated in JSON/props (e.g., "make background blue", "change text color to red", "update primary color", "make gradient purple")
- "structural": Structural changes requiring code modification, file changes, or component restructuring (e.g., "swap element order", "reorder h2 and p tags", "add new section", "modify component structure", "change component layout", "add new component", "remove component", "reorder components")

Guidelines:
- If the change only affects text content (words, sentences, headlines) → "simple-text"
- If the change only affects colors, gradients, or styling values → "simple-color"
- If the change requires modifying component structure, element order, adding/removing elements, or changing component files → "structural"

Return JSON with:
{
  "type": "simple" | "structural",
  "editType": "text" | "color" | null,  // Only if type is "simple", otherwise null
  "reason": "Brief explanation of why this classification was chosen"
}`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `User request: "${prompt}"${currentComponent ? `\nCurrent component: ${currentComponent.name || currentComponent}` : ""}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Lower temperature for more consistent classification
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_KEY}`,
        },
      }
    );

    const content: string | undefined = response.data.choices?.[0]?.message?.content;

    // Extract token usage from axios response
    const tokens = extractOpenAITokens(response.data);
    // const estimatedCost = calculateCost("openai", "gpt-4o-mini", tokens.promptTokens, tokens.completionTokens);

    if (content) {
      try {
        const classification = JSON.parse(content) as ClassificationResponse;

        // Validate classification structure
        let result: ClassificationResponse;
        if (
          classification.type === "simple" &&
          classification.editType &&
          (classification.editType === "text" || classification.editType === "color")
        ) {
          result = classification;
        } else if (classification.type === "structural") {
          result = {
            type: "structural",
            editType: null,
            reason: classification.reason || "Requires code modification",
          };
        } else {
          // Invalid classification, default to structural for safety
          console.warn("Invalid classification received, defaulting to structural:", classification);
          result = {
            type: "structural",
            editType: null,
            reason: "Unable to determine edit type, defaulting to structural change",
          };
        }

        // Log usage asynchronously (don't block the response)
        if (detectedProjectId) {
          logUsageAsync({
            prompt,
            promptType: "classification",
            provider: "openai",
            model: "gpt-4o-mini",
            requestDetails: {
              systemPrompt,
              userMessage: `User request: "${prompt}"${currentComponent ? `\nCurrent component: ${currentComponent.name || currentComponent}` : ""}`,
              context: {
                currentComponent,
                websiteData,
              },
            },
            response: {
              content: JSON.stringify(result),
              explanation: result.reason,
            },
            tokens,
            status: "success",
            classification: {
              type: result.type,
              editType: result.editType || undefined,
              explanation: result.reason,
            },
            projectId: detectedProjectId,
            requestId,
            metadata: {
              userAgent: req.headers.get("user-agent") || undefined,
              branch: req.nextUrl.searchParams.get("branch") || undefined,
            },
          }).catch((error) => {
            console.error("Failed to log usage (non-blocking):", error);
          });
        }

        return NextResponse.json(result);
      } catch (parseError) {
        console.error("Error parsing classification response:", parseError);
        
        // Log error usage
        if (detectedProjectId) {
          logUsageAsync({
            prompt,
            promptType: "classification",
            provider: "openai",
            model: "gpt-4o-mini",
            requestDetails: {
              systemPrompt,
              userMessage: `User request: "${prompt}"${currentComponent ? `\nCurrent component: ${currentComponent.name || currentComponent}` : ""}`,
              context: {
                currentComponent,
                websiteData,
              },
            },
            response: {
              content: "Parse error",
            },
            tokens,
            status: "error",
            error: parseError instanceof Error ? parseError.message : "Failed to parse classification",
            projectId: detectedProjectId,
            requestId,
            metadata: {
              userAgent: req.headers.get("user-agent") || undefined,
              branch: req.nextUrl.searchParams.get("branch") || undefined,
            },
          }).catch((err) => {
            console.error("Failed to log error usage:", err);
          });
        }

        // Default to structural if parsing fails
        return NextResponse.json({
          type: "structural",
          editType: null,
          reason: "Failed to parse classification, defaulting to structural change",
        });
      }
    }

    // Default to structural if no content
    const defaultResult = {
      type: "structural" as const,
      editType: null,
      reason: "No classification received, defaulting to structural change",
    };

    // Log usage for default case
    if (detectedProjectId) {
      logUsageAsync({
        prompt,
        promptType: "classification",
        provider: "openai",
        model: "gpt-4o-mini",
        requestDetails: {
          systemPrompt,
          userMessage: `User request: "${prompt}"${currentComponent ? `\nCurrent component: ${currentComponent.name || currentComponent}` : ""}`,
          context: {
            currentComponent,
            websiteData,
          },
        },
        response: {
          content: JSON.stringify(defaultResult),
          explanation: defaultResult.reason,
        },
        tokens: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        status: "success",
        classification: {
          type: "structural",
          explanation: defaultResult.reason,
        },
        projectId: detectedProjectId,
        requestId,
        metadata: {
          userAgent: req.headers.get("user-agent") || undefined,
          branch: req.nextUrl.searchParams.get("branch") || undefined,
        },
      }).catch((err) => {
        console.error("Failed to log usage:", err);
      });
    }

    return NextResponse.json(defaultResult);
  } catch (error) {
    console.error("Error classifying edit:", error);
    
    // Log error usage
    if (detectedProjectId) {
      logUsageAsync({
        prompt,
        promptType: "classification",
        provider: "openai",
        model: "gpt-4o-mini",
        requestDetails: {
          systemPrompt,
          userMessage: `User request: "${prompt}"${currentComponent ? `\nCurrent component: ${currentComponent.name || currentComponent}` : ""}`,
          context: {
            currentComponent,
            websiteData,
          },
        },
        response: {
          content: "Error occurred",
        },
        tokens: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        projectId: detectedProjectId,
        requestId,
        metadata: {
          userAgent: req.headers.get("user-agent") || undefined,
          branch: req.nextUrl.searchParams.get("branch") || undefined,
        },
      }).catch((err) => {
        console.error("Failed to log error usage:", err);
      });
    }

    // Default to structural on error (safer to require preview for unknown cases)
    return NextResponse.json(
      {
        type: "structural",
        editType: null,
        reason: "Error during classification, defaulting to structural change for safety",
      },
      { status: 200 } // Return 200 with default classification rather than error
    );
  }
}

// Helper function to log usage asynchronously
async function logUsageAsync(data: {
  prompt: string;
  promptType: "classification";
  provider: "openai";
  model: string;
  requestDetails: any;
  response: any;
  tokens: { promptTokens: number; completionTokens: number; totalTokens: number };
  status: "success" | "error";
  error?: string;
  classification?: any;
  projectId: string;
  requestId: string;
  metadata?: any;
}) {
  try {
    // Import the logging function directly to avoid HTTP overhead
    const { logUsageDirect } = await import("@/lib/usage/logUsage");
    await logUsageDirect(data);
  } catch (error) {
    // Silently fail - logging shouldn't break the main flow
    console.error("Usage logging error:", error);
  }
}

