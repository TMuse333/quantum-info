import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { calculateCost } from "@/lib/usage/tokenPricing";
import type { LogUsageRequest, LLMUsageLog } from "@/types/usage";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const data: LogUsageRequest = await req.json();

    // Validate required fields
    if (!data.prompt || !data.provider || !data.model ) {
      return NextResponse.json(
        { error: "Missing required fields: prompt, provider, model, projectId" },
        { status: 400 }
      );
    }

    // Generate unique IDs
    const requestId = randomUUID();
    const sessionId = data.metadata?.sessionId || randomUUID(); // Use provided sessionId or generate new one

    // Calculate cost
    const estimatedCost = calculateCost(
      data.provider,
      data.model,
      data.tokens.promptTokens,
      data.tokens.completionTokens
    );

    // Create usage log document
    const usageLog: Omit<LLMUsageLog, '_id'> = {
      userId: data.metadata?.userId,
      projectId: data.projectId,
      websiteId: data.metadata?.websiteId,
      sessionId,
      requestId,
      timestamp: new Date(),
      prompt: data.prompt,
      promptType: data.promptType,
      provider: data.provider,
      model: data.model,
      classification: data.classification,
      requestDetails: {
        systemPrompt: data.requestDetails.systemPrompt,
        userMessage: data.requestDetails.userMessage,
        context: data.requestDetails.context,
      },
      response: {
        content: data.response.content,
        explanation: data.response.explanation,
        changes: data.response.changes,
      },
      tokens: {
        promptTokens: data.tokens.promptTokens,
        completionTokens: data.tokens.completionTokens,
        totalTokens: data.tokens.totalTokens,
        estimatedCost,
      },
      status: data.status,
      error: data.error,
      changesApplied: data.changesApplied,
      metadata: {
        userAgent: data.metadata?.userAgent,
        ipAddress: data.metadata?.ipAddress,
        branch: data.metadata?.branch,
        version: data.metadata?.version,
      },
    };

    // Insert into database
    const db = await getDatabase();
    const collection = db.collection<LLMUsageLog>("llm_usage_logs");
    
    const result = await collection.insertOne(usageLog as any);

    return NextResponse.json({
      success: true,
      logId: result.insertedId.toString(),
      estimatedCost,
    });
  } catch (error: any) {
    console.error("Error logging usage:", error);
    return NextResponse.json(
      { error: error.message || "Failed to log usage" },
      { status: 500 }
    );
  }
}

