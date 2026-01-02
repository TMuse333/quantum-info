export interface LLMUsageLog {
  _id?: string;
  
  // User/Project Identification
  userId?: string;
  projectId: string; // Repository identifier (repoOwner/repoName)
  websiteId?: string;
  
  // Session/Request Info
  sessionId: string;
  requestId: string;
  timestamp: Date;
  
  // Prompt Information
  prompt: string;
  promptType: 'text' | 'color' | 'structural' | 'classification' | 'knowledge-search' | 'seo-generation';
  
  // LLM Provider Info
  provider: 'openai' | 'anthropic' | 'qdrant';
  model: string;
  
  // Classification (for determine-edit route)
  classification?: {
    type: 'simple' | 'structural';
    editType?: 'text' | 'color';
    explanation: string;
  };
  
  // Request Details
  requestDetails: {
    systemPrompt?: string;
    userMessage: string;
    context?: {
      currentComponent?: {
        name: string;
        id: string;
      };
      websiteData?: any;
    };
  };
  
  // Response Details
  response: {
    content: string;
    explanation?: string;
    changes?: {
      type: 'text' | 'color' | 'structural';
      filesAffected?: string[];
      componentAffected?: string;
      propsChanged?: string[];
    };
  };
  
  // Token Usage
  tokens: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost?: number;
  };
  
  // Status
  status: 'pending' | 'success' | 'error' | 'rejected';
  error?: string;
  
  // Changes Applied
  changesApplied?: {
    applied: boolean;
    appliedAt?: Date;
    filesModified?: string[];
    websiteDataUpdated?: boolean;
    committed?: boolean;
    commitSha?: string;
  };
  
  // Metadata
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    branch?: string;
    version?: string;
    sessionId?: string;
    userId?: string;
    websiteId?: string;
  };
}

export interface LogUsageRequest {
  prompt: string;
  promptType: 'text' | 'color' | 'structural' | 'classification' | 'knowledge-search' | 'seo-generation';
  provider: 'openai' | 'anthropic' | 'qdrant';
  model: string;
  projectId: string;
  requestDetails: {
    systemPrompt?: string;
    userMessage: string;
    context?: any;
  };
  response: {
    content: string;
    explanation?: string;
    changes?: any;
  };
  tokens: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  status: 'pending' | 'success' | 'error' | 'rejected';
  error?: string;
  classification?: {
    type: 'simple' | 'structural';
    editType?: 'text' | 'color';
    explanation: string;
  };
  changesApplied?: {
    applied: boolean;
    filesModified?: string[];
    websiteDataUpdated?: boolean;
    committed?: boolean;
    commitSha?: string;
  };
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    branch?: string;
    version?: string;
    sessionId?: string;
    userId?: string;
    websiteId?: string;
  };
}

