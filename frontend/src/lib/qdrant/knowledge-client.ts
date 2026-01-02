import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';

// Initialize clients
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY,
  checkCompatibility: false,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

export interface KnowledgeResult {
  id: string;
  score: number;
  content: string;
  metadata: {
    type: string;
    source: string;
    tags: string[];
    title?: string;
    description?: string;
    [key: string]: any;
  };
}

/**
 * Generate embedding for a text query
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  
  return response.data[0].embedding;
}

/**
 * Search the knowledge base using semantic similarity
 */
export async function searchKnowledge(
  query: string,
  collectionName: string = 'general_website_knowledge',
  limit: number = 5
): Promise<KnowledgeResult[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    const searchParams = {
      vector: queryEmbedding,
      limit,
      with_payload: true,
    };

    // Search Qdrant
    const searchResult = await qdrant.search(collectionName, searchParams);

    // Transform results
    return searchResult.map((result) => {
      const payload = result.payload as any;
      let metadata = payload.metadata || {};
      let content = payload.content || '';
      
      // Handle different payload structures
      if (!payload.metadata && payload) {
        metadata = {
          type: payload.type || 'unknown',
          source: payload.source || 'unknown',
          tags: payload.tags || [],
          title: payload.title,
          description: payload.description,
        };
        if (!content && payload.text) {
          content = payload.text;
        }
      }
      
      // Ensure required metadata fields exist
      if (!metadata.type) metadata.type = 'unknown';
      if (!metadata.source) metadata.source = 'unknown';
      if (!metadata.tags) metadata.tags = [];
      
      // Normalize score from [-1, 1] to [0, 1] for cosine similarity
      const normalizedScore = (result.score + 1) / 2;
      
      return {
        id: result.id as string,
        score: normalizedScore,
        content: content,
        metadata: metadata as KnowledgeResult['metadata'],
      };
    });
  } catch (error) {
    console.error('Error searching knowledge:', error);
    return [];
  }
}

