'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{
    title?: string;
    content: string;
    score: number;
  }>;
}

export default function KnowledgeChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your website knowledge assistant. Ask me anything about website building, component patterns, or best practices!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      console.log('[KnowledgeChatbot] Sending query:', {
        query: userMessage.content,
        collection: 'general-website-knowledge',
        limit: 3,
      });

      const response = await fetch('/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage.content,
          collection: 'general-website-knowledge',
          limit: 3,
          sessionId: 'test-user', // Session ID for tracking
        }),
      });

      console.log('[KnowledgeChatbot] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[KnowledgeChatbot] Response not OK:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      console.log('[KnowledgeChatbot] Response data:', {
        hasSuccess: 'success' in data,
        success: data.success,
        hasResults: 'results' in data,
        resultsLength: data.results?.length || 0,
        resultsType: Array.isArray(data.results) ? 'array' : typeof data.results,
        dataKeys: Object.keys(data),
        firstResult: data.results?.[0] ? {
          hasContent: !!data.results[0].content,
          contentLength: data.results[0].content?.length || 0,
          hasMetadata: !!data.results[0].metadata,
          hasScore: 'score' in data.results[0],
        } : null,
        error: data.error,
      });

      if (data.success !== false && (data.response || (data.results && Array.isArray(data.results) && data.results.length > 0))) {
        // Use the conversational response if available, otherwise fall back to raw content
        const responseContent = data.response || data.results?.[0]?.content || data.results?.[0]?.text || 'I found some information, but the content format is unexpected.';
        
        // Use sources from the response if available, otherwise extract from results
        const sources = data.sources || (data.results ? data.results.map((r: any) => ({
          title: r.metadata?.title || r.metadata?.name || 'Knowledge Point',
          content: r.content || r.text || '',
          score: r.score || r.similarity || 0,
        })) : []);

        console.log('[KnowledgeChatbot] Using response:', {
          hasResponse: !!data.response,
          responseLength: responseContent.length,
          sourcesCount: sources.length,
        });

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responseContent,
          timestamp: new Date(),
          sources: sources,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        console.warn('[KnowledgeChatbot] No results found or invalid response structure:', {
          success: data.success,
          resultsLength: data.results?.length || 0,
          hasResults: !!data.results,
          hasResponse: !!data.response,
          error: data.error,
        });

        // Use response if available (Claude might have generated a helpful message even with no results)
        const fallbackContent = data.response || data.error 
          ? `I encountered an issue: ${data.error || 'No information found'}. Could you try rephrasing your question?`
          : "I couldn't find specific information about that. Could you try rephrasing your question or asking about website building, component patterns, or page structure?";

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: fallbackContent,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('[KnowledgeChatbot] Error searching knowledge:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chatbot Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center gap-2"
        aria-label="Open chatbot"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="hidden sm:inline font-semibold">Ask Me</span>
      </button>

      {/* Chatbot Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl h-[600px] sm:h-[700px] bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Website Knowledge Assistant
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ask about website building & best practices
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Close chatbot"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Sources:
                        </p>
                        {message.sources.map((source, idx) => (
                          <div
                            key={idx}
                            className="text-xs text-gray-600 dark:text-gray-300 mb-1"
                          >
                            {source.title && (
                              <span className="font-semibold">{source.title}: </span>
                            )}
                            <span className="opacity-75">
                              {source.content.substring(0, 100)}...
                            </span>
                            <span className="ml-2 text-gray-400">
                              ({(source.score * 100).toFixed(0)}% match)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                    <Loader2 className="w-5 h-5 text-gray-500 dark:text-gray-400 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about website building, components, or best practices..."
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

