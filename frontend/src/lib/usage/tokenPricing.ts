// Token pricing for LLM providers (as of 2024)
// Prices are per 1M tokens

export const OPENAI_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': {
    input: 0.15 / 1000000, // $0.15 per 1M input tokens
    output: 0.60 / 1000000, // $0.60 per 1M output tokens
  },
  'gpt-4o': {
    input: 2.50 / 1000000, // $2.50 per 1M input tokens
    output: 10.00 / 1000000, // $10.00 per 1M output tokens
  },
  // Add other models as needed
};

export const ANTHROPIC_PRICING: Record<string, { input: number; output: number }> = {
  'claude-3-5-sonnet': {
    input: 3.00 / 1000000, // $3.00 per 1M input tokens
    output: 15.00 / 1000000, // $15.00 per 1M output tokens
  },
  'claude-3-opus': {
    input: 15.00 / 1000000, // $15.00 per 1M input tokens
    output: 75.00 / 1000000, // $75.00 per 1M output tokens
  },
  // Add other models as needed
};

/**
 * Calculate the cost of an LLM API call based on token usage
 */
export function calculateCost(
  provider: 'openai' | 'anthropic' | 'qdrant',
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  // Qdrant (vector search) has no cost
  if (provider === 'qdrant') {
    return 0;
  }
  
  const pricing = provider === 'openai' ? OPENAI_PRICING[model] : ANTHROPIC_PRICING[model];
  
  if (!pricing) {
    console.warn(`No pricing found for ${provider} model: ${model}`);
    return 0;
  }
  
  const inputCost = inputTokens * pricing.input;
  const outputCost = outputTokens * pricing.output;
  return inputCost + outputCost;
}

/**
 * Get token usage from OpenAI API response
 */
export function extractOpenAITokens(response: any): {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
} {
  const usage = response.usage || {};
  return {
    promptTokens: usage.prompt_tokens || 0,
    completionTokens: usage.completion_tokens || 0,
    totalTokens: usage.total_tokens || 0,
  };
}

/**
 * Get token usage from Anthropic API response
 */
export function extractAnthropicTokens(response: any): {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
} {
  const usage = response.usage || {};
  return {
    promptTokens: usage.input_tokens || 0,
    completionTokens: usage.output_tokens || 0,
    totalTokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
  };
}

