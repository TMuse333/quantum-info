import React from 'react';

// Chat mode types
export type ChatMode = 'colors' | 'text' | 'general' | 'modify-component' | 'new-component' | null;

// Message interface for chat messages
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    editType?: 'text' | 'color' | 'structural' | 'knowledge';
    componentName?: string;
    status?: 'pending' | 'success' | 'error' | 'preview';
    files?: Array<{ path: string; action: string }>;
    sources?: Array<{
      title?: string;
      content: string;
      score: number;
    }>;
    showComponentSelector?: boolean;
    selectorMode?: 'colors' | 'text';
  };
}

// Mode option interface for mode selection buttons
export interface ModeOption {
  id: ChatMode;
  label: string;
  icon: React.ReactNode;
  description: string;
  collection?: string;
  color: string;
}
