import { NextRequest, NextResponse } from 'next/server';
import { logUsageDirect } from '@/lib/usage/logUsage';
import { extractOpenAITokens } from '@/lib/usage/tokenPricing';
import axios from 'axios';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, collection = 'general-website-knowledge', limit = 5, projectId: bodyProjectId } = body;

    console.log('[Knowledge Search] Received request:', {
      query,
      collection,
      limit,
      hasQuery: !!query,
      queryType: typeof query,
    });

    if (!query || typeof query !== 'string') {
      console.error('[Knowledge Search] Invalid query:', { query, type: typeof query });
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Get neural-network API URL from environment
    const neuralNetworkUrl = process.env.NEURAL_NETWORK_URL;
    if (!neuralNetworkUrl) {
      console.error('[Knowledge Search] NEURAL_NETWORK_URL not set');
      return NextResponse.json(
        { error: 'NEURAL_NETWORK_URL environment variable is not set' },
        { status: 500 }
      );
    }

    console.log('[Knowledge Search] Proxying to neural-network API:', {
      url: `${neuralNetworkUrl}/api/knowledge/search`,
      query,
      collection,
      limit,
    });

    // Proxy request to neural-network API
    const response = await fetch(`${neuralNetworkUrl}/api/knowledge/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        collection,
        limit,
        sessionId: 'test-user', // Use 'test-user' as session ID
      }),
    });

    console.log('[Knowledge Search] Neural-network API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Unknown error' };
      }
      
      console.error('[Knowledge Search] Neural-network API error:', {
        status: response.status,
        error: errorData,
        rawText: errorText,
      });

      return NextResponse.json(
        {
          success: false,
          error: errorData.error || `HTTP ${response.status}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    console.log('[Knowledge Search] Neural-network API response data:', {
      hasSuccess: 'success' in data,
      success: data.success,
      hasResults: 'results' in data,
      resultsLength: data.results?.length || 0,
      resultsType: Array.isArray(data.results) ? 'array' : typeof data.results,
      dataKeys: Object.keys(data),
      firstResult: data.results?.[0] ? {
        hasContent: !!data.results[0].content,
        hasMetadata: !!data.results[0].metadata,
        hasScore: 'score' in data.results[0],
        score: data.results[0].score,
        contentPreview: data.results[0].content?.substring(0, 100),
      } : null,
    });

    // Normalize response structure to ensure frontend compatibility
    const normalizedData = {
      success: data.success !== false, // Default to true if not explicitly false
      results: Array.isArray(data.results) ? data.results : (data.results ? [data.results] : []),
      ...(data.error && { error: data.error }),
      ...(data.message && { message: data.message }),
    };

    console.log('[Knowledge Search] Normalized response:', {
      success: normalizedData.success,
      resultsCount: normalizedData.results.length,
      hasError: !!normalizedData.error,
    });

    // Get project ID for logging
    let projectId = bodyProjectId;
    if (!projectId) {
      try {
        const repoInfoResponse = await fetch(`${request.nextUrl.origin}/api/git/repo-info`);
        if (repoInfoResponse.ok) {
          const repoInfo = await repoInfoResponse.json();
          if (repoInfo.repoOwner && repoInfo.repoName) {
            projectId = `${repoInfo.repoOwner}/${repoInfo.repoName}`;
          }
        }
      } catch (error) {
        console.warn('[Knowledge Search] Could not detect project ID:', error);
      }
    }
    // Fallback if still no project ID
    if (!projectId) {
      projectId = 'unknown';
    }

    const requestId = randomUUID();
    let responseContent = '';
    let llmTokens = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    // If we have Qdrant results, use OpenAI to generate a conversational response
    if (normalizedData.success && normalizedData.results.length > 0) {
      try {
        // Prepare Qdrant context
        const qdrantContext = normalizedData.results
          .map((r: any, idx: number) => {
            const content = r.content || r.text || '';
            const title = r.metadata?.title || r.metadata?.name || `Knowledge Point ${idx + 1}`;
            return `[${title}]\n${content}`;
          })
          .join('\n\n---\n\n');

        const systemPrompt = `You are a helpful website building assistant. Your role is to answer user questions about website structure, components, best practices, and design patterns.

When answering:
- Be conversational and friendly, not robotic
- Don't repeat the knowledge base content verbatim - synthesize it into natural, helpful advice
- Focus on answering the user's specific question
- Use the knowledge base as context, but write in your own words
- Be concise but thorough
- If the knowledge base doesn't fully answer the question, say what you can based on the context

The user is asking about website building, and you have access to relevant knowledge from your knowledge base. Use that knowledge to provide a helpful, natural-sounding answer.`;

        const userMessage = `User question: "${query}"

Relevant knowledge from knowledge base:
${qdrantContext}

Please provide a helpful, conversational answer to the user's question based on the knowledge above. Don't just repeat the knowledge base - synthesize it into natural advice.`;

        console.log('[Knowledge Search] Calling OpenAI to generate conversational response');

        const openaiResponse = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
            max_tokens: 1024,
            temperature: 0.7, // Slightly higher for more natural conversation
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.OPENAI_KEY}`,
            },
          }
        );

        // Extract tokens
        llmTokens = extractOpenAITokens(openaiResponse.data);

        // Get the response text
        responseContent = openaiResponse.data.choices?.[0]?.message?.content || 'I found some relevant information, but had trouble formatting the response.';

        console.log('[Knowledge Search] OpenAI generated response:', {
          responseLength: responseContent.length,
          tokens: llmTokens,
        });

        // Prepare knowledge used for logging (structured Qdrant results)
        const knowledgeUsed = normalizedData.results.map((r: any) => ({
          title: r.metadata?.title || r.metadata?.name || 'Knowledge Point',
          content: r.content || r.text || '',
          score: r.score || r.similarity || 0,
          metadata: r.metadata || {},
        }));

        // Log the LLM generation with knowledge used and ChatGPT response
        logUsageDirect({
          projectId,
          requestId: randomUUID(),
          prompt: query,
          promptType: 'knowledge-search',
          provider: 'openai',
          model: 'gpt-4o-mini',
          requestDetails: {
            systemPrompt,
            userMessage,
            context: {
              collection,
              qdrantResultsCount: normalizedData.results.length,
              knowledgeUsed: knowledgeUsed, // The actual Qdrant knowledge points used
            },
          },
          response: {
            content: responseContent, // The actual ChatGPT response
            explanation: `Generated conversational response from ${normalizedData.results.length} Qdrant result(s)`,
          },
          tokens: llmTokens,
          status: 'success',
          metadata: {
            sessionId: body.sessionId || 'test-user',
            userAgent: request.headers.get('user-agent') || undefined,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          },
        }).catch((error) => {
          console.error('[Knowledge Search] Failed to log LLM usage:', error);
        });

      } catch (error) {
        console.error('[Knowledge Search] Error generating conversational response:', error);
        // Fallback to raw Qdrant content if LLM fails
        const topResult = normalizedData.results[0];
        responseContent = topResult?.content || topResult?.text || 'I found some information, but had trouble processing it.';
      }
    } else {
      // No results or error - provide helpful fallback message
      if (normalizedData.error) {
        responseContent = `I encountered an issue: ${normalizedData.error}. Could you try rephrasing your question?`;
      } else {
        responseContent = "I couldn't find specific information about that in my knowledge base. Could you try rephrasing your question or asking about website building, component patterns, or page structure?";
      }
    }

    // Log the Qdrant search (for tracking)
    logUsageDirect({
      projectId,
      requestId,
      prompt: query,
      promptType: 'knowledge-search',
      provider: 'qdrant',
      model: collection,
      requestDetails: {
        userMessage: query,
        context: {
          collection,
          limit,
        },
      },
      response: {
        content: normalizedData.results.length > 0 
          ? `Found ${normalizedData.results.length} result(s) from ${collection} collection`
          : 'No results found',
        explanation: normalizedData.results.length > 0 
          ? `Retrieved ${normalizedData.results.length} relevant knowledge point(s)`
          : 'No matching knowledge points found',
      },
      tokens: {
        promptTokens: Math.ceil(query.length / 4), // Rough estimate: ~4 chars per token
        completionTokens: 0,
        totalTokens: Math.ceil(query.length / 4),
      },
      status: normalizedData.success && normalizedData.results.length > 0 ? 'success' : (normalizedData.error ? 'error' : 'success'),
      error: normalizedData.error,
      metadata: {
        sessionId: body.sessionId || 'test-user',
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      },
    }).catch((error) => {
      console.error('[Knowledge Search] Failed to log Qdrant usage:', error);
    });

    // Return the conversational response along with sources
    return NextResponse.json({
      success: normalizedData.success,
      results: normalizedData.results, // Keep sources for display
      response: responseContent, // The conversational response
      sources: normalizedData.results.map((r: any) => ({
        title: r.metadata?.title || r.metadata?.name || 'Knowledge Point',
        content: r.content || r.text || '',
        score: r.score || r.similarity || 0,
      })),
    });
  } catch (error) {
    console.error('[Knowledge Search] Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

