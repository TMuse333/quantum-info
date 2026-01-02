/**
 * ChatInput Component
 * Input area for chat messages
 */

import React, { useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import type { ChatMode } from './types';

interface ChatInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  selectedMode: ChatMode;
  isLoading: boolean;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputValue,
  setInputValue,
  selectedMode,
  isLoading,
  onSend,
  onKeyPress,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const getPlaceholder = () => {
    if (selectedMode === null) return "Select a mode above to get started...";
    if (selectedMode === 'colors') return "Describe the color changes you want...";
    if (selectedMode === 'text') return "Describe the text changes you want...";
    if (selectedMode === 'general') return "Ask a question about website building...";
    if (selectedMode === 'modify-component') return "Describe how you want to modify the component...";
    if (selectedMode === 'new-component') return "Describe the new component you want to create...";
    return "Tell me what you'd like to change about your website...";
  };

  return (
    <div className="border-t border-gray-200 bg-white px-6 py-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder={getPlaceholder()}
              disabled={isLoading}
              rows={1}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 resize-none"
              style={{ minHeight: '52px', maxHeight: '200px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 200) + 'px';
              }}
            />
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
          <button
            onClick={onSend}
            disabled={!inputValue.trim() || isLoading}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2 font-medium"
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
  );
};

