import { getDatabase } from "@/lib/mongodb";
import { calculateCost } from "./tokenPricing";
import type { LogUsageRequest, LLMUsageLog } from "@/types/usage";
import { randomUUID } from "crypto";

/**
 * Directly log usage to MongoDB (for server-side use)
 * This avoids HTTP overhead when called from API routes
 */
export async function logUsageDirect(data: LogUsageRequest & {
  projectId: string;
  requestId: string;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    branch?: string;
    version?: string;
    sessionId?: string;
  };
}): Promise<void> {
  try {
    // Generate session ID if not provided
    const sessionId = data.metadata?.sessionId || randomUUID();

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
      requestId: data.requestId,
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
    
    await collection.insertOne(usageLog as any);
  } catch (error) {
    console.error("Error in logUsageDirect:", error);
    throw error; // Re-throw so caller can handle
  }
}

