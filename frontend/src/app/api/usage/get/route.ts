import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import type { LLMUsageLog } from "@/types/usage";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const provider = searchParams.get("provider");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<LLMUsageLog>("llm_usage_logs");

    // Build query
    const query: any = {
      projectId,
    };

    if (userId) {
      query.userId = userId;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    if (provider) {
      query.provider = provider;
    }

    if (type) {
      query.promptType = type;
    }

    if (status) {
      query.status = status;
    }

    // Get total count
    const total = await collection.countDocuments(query);

    // Get logs with pagination
    const logs = await collection
      .find(query)
      .sort({ timestamp: -1 }) // Most recent first
      .skip(offset)
      .limit(limit)
      .toArray();

    // Calculate summary statistics
    const allLogs = await collection.find({ projectId }).toArray();
    
    const summary = {
      totalRequests: allLogs.length,
      totalTokens: allLogs.reduce((sum, log) => sum + (log.tokens?.totalTokens || 0), 0),
      totalCost: allLogs.reduce((sum, log) => sum + (log.tokens?.estimatedCost || 0), 0),
      byProvider: {
        openai: {
          requests: allLogs.filter((log) => log.provider === "openai").length,
          tokens: allLogs
            .filter((log) => log.provider === "openai")
            .reduce((sum, log) => sum + (log.tokens?.totalTokens || 0), 0),
          cost: allLogs
            .filter((log) => log.provider === "openai")
            .reduce((sum, log) => sum + (log.tokens?.estimatedCost || 0), 0),
        },
        anthropic: {
          requests: allLogs.filter((log) => log.provider === "anthropic").length,
          tokens: allLogs
            .filter((log) => log.provider === "anthropic")
            .reduce((sum, log) => sum + (log.tokens?.totalTokens || 0), 0),
          cost: allLogs
            .filter((log) => log.provider === "anthropic")
            .reduce((sum, log) => sum + (log.tokens?.estimatedCost || 0), 0),
        },
      },
      byType: {
        text: allLogs.filter((log) => log.promptType === "text").length,
        color: allLogs.filter((log) => log.promptType === "color").length,
        structural: allLogs.filter((log) => log.promptType === "structural").length,
        classification: allLogs.filter((log) => log.promptType === "classification").length,
      },
    };

    return NextResponse.json({
      logs: logs.map((log) => ({
        ...log,
        _id: log._id?.toString(),
      })),
      total,
      summary,
    });
  } catch (error: any) {
    console.error("Error fetching usage:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch usage" },
      { status: 500 }
    );
  }
}

