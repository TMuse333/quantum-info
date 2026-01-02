import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, Code, FileText, Palette, Clock } from 'lucide-react';
import type { Message, ChatMode } from './types';
import type { EditableComponent } from '@/types/editorial';
import ComponentSelector from './ComponentSelector';

interface MessageBubbleProps {
  message: Message;
  pageComponents?: any[];
  onComponentSelect?: (component: EditableComponent, mode: ChatMode, messageId: string) => void;
}

// Message Bubble Component
const MessageBubble: React.FC<MessageBubbleProps> = ({ message, pageComponents = [], onComponentSelect }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const getStatusIcon = () => {
    if (!message.metadata?.status) return null;

    switch (message.metadata.status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'preview':
        return <Code className="w-4 h-4 text-purple-600" />;
      default:
        return null;
    }
  };

  const getEditTypeIcon = () => {
    if (!message.metadata?.editType) return null;

    switch (message.metadata.editType) {
      case 'text':
        return <FileText className="w-3 h-3" />;
      case 'color':
        return <Palette className="w-3 h-3" />;
      case 'structural':
        return <Code className="w-3 h-3" />;
      default:
        return null;
    }
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 text-gray-600 text-xs px-4 py-2 rounded-full border border-gray-200">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
              : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
          }`}
        >
          {/* Metadata badges */}
          {message.metadata && (
            <div className="flex items-center gap-2 mb-2 text-xs opacity-75">
              {message.metadata.editType && (
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                  isUser ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  {getEditTypeIcon()}
                  <span className="capitalize">{message.metadata.editType}</span>
                </span>
              )}
              {message.metadata.componentName && (
                <span className={`px-2 py-0.5 rounded-full ${
                  isUser ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  {message.metadata.componentName}
                </span>
              )}
            </div>
          )}

          {/* Message content */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </div>

          {/* Component Selector */}
          {message.metadata?.showComponentSelector && message.metadata.selectorMode && onComponentSelect && (
            <ComponentSelector
              components={pageComponents}
              onSelect={(component) => {
                // Call the parent handler which will set component and update messages
                onComponentSelect(component, message.metadata!.selectorMode!, message.id);
              }}
              mode={message.metadata.selectorMode}
            />
          )}

          {/* Knowledge sources */}
          {message.metadata?.sources && message.metadata.sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200/20">
              <p className="text-xs font-semibold mb-2 opacity-75">📚 Knowledge Sources:</p>
              <div className="space-y-1">
                {message.metadata.sources.slice(0, 3).map((source, idx) => (
                  <div key={idx} className="text-xs opacity-75">
                    {source.title && (
                      <span className="font-semibold">{source.title}: </span>
                    )}
                    <span>{source.content.substring(0, 80)}...</span>
                    <span className="ml-2 text-gray-400">
                      ({(source.score * 100).toFixed(0)}% match)
                    </span>
                  </div>
                ))}
                {message.metadata.sources.length > 3 && (
                  <div className="text-xs opacity-60">
                    +{message.metadata.sources.length - 3} more sources
                  </div>
                )}
              </div>
            </div>
          )}

          {/* File changes preview */}
          {message.metadata?.files && message.metadata.files.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200/20">
              <p className="text-xs font-semibold mb-2 opacity-75">Files affected:</p>
              <div className="space-y-1">
                {message.metadata.files.slice(0, 3).map((file, idx) => (
                  <div key={idx} className="text-xs opacity-75 flex items-center gap-2">
                    <span className="font-mono">{file.path.split('/').pop()}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      isUser ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      {file.action}
                    </span>
                  </div>
                ))}
                {message.metadata.files.length > 3 && (
                  <div className="text-xs opacity-60">
                    +{message.metadata.files.length - 3} more files
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Timestamp and status */}
        <div className={`flex items-center gap-2 mt-1 px-2 text-xs text-gray-500 ${
          isUser ? 'justify-end' : 'justify-start'
        }`}>
          {getStatusIcon()}
          <Clock className="w-3 h-3" />
          <span>
            {message.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
