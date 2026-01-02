"use client";

import { useEditHistoryStore, EditHistoryEntry, EditType } from '@/stores/editHistoryStore';
import { History, Filter, X, FileText, Palette, Sparkles, Code, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useMemo } from 'react';

const TYPE_ICONS = {
  text: FileText,
  color: Palette,
  theme: Sparkles,
  structural: Code,
  manual: Edit,
};

const TYPE_COLORS = {
  text: 'text-blue-600 bg-blue-50',
  color: 'text-purple-600 bg-purple-50',
  theme: 'text-indigo-600 bg-indigo-50',
  structural: 'text-green-600 bg-green-50',
  manual: 'text-gray-600 bg-gray-50',
};

export default function EditHistoryPanel() {
  const { history, clearHistory, getHistoryByType } = useEditHistoryStore();
  const [selectedType, setSelectedType] = useState<EditType | 'all'>('all');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const filteredHistory = useMemo(() => {
    if (selectedType === 'all') return history;
    return getHistoryByType(selectedType);
  }, [history, selectedType, getHistoryByType]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <History className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edit History</h2>
                <p className="text-sm text-gray-500">
                  {history.length} total edits
                </p>
              </div>
            </div>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear History
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'text', 'color', 'theme', 'structural', 'manual'] as const).map((type) => {
              const Icon = type === 'all' ? Filter : TYPE_ICONS[type];
              const count = type === 'all' ? history.length : getHistoryByType(type).length;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                    selectedType === type
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                  <span className="text-xs opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* History List */}
        <div className="space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center text-gray-500">
              <History className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No edits found</p>
              <p className="text-sm mt-1">
                {selectedType === 'all' 
                  ? 'Edits will appear here when you make changes to your website.'
                  : `No ${selectedType} edits found.`}
              </p>
            </div>
          ) : (
            filteredHistory.map((entry) => {
              const Icon = TYPE_ICONS[entry.type];
              const colorClass = TYPE_COLORS[entry.type];
              const isExpanded = expandedEntry === entry.id;

              return (
                <div
                  key={entry.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 capitalize">
                            {entry.type} Edit
                          </span>
                          {entry.componentType && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {entry.componentType}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {entry.componentId && `Component: ${entry.componentId}`}
                          {entry.componentId && entry.pageSlug && ' • '}
                          {entry.pageSlug && `Page: ${entry.pageSlug}`}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimestamp(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                      className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Hide
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Details
                        </>
                      )}
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                      {/* Changes */}
                      {entry.changes.props && Object.keys(entry.changes.props).length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Property Changes:</h4>
                          <div className="space-y-1">
                            {Object.entries(entry.changes.props).map(([key, { old, new: newVal }]) => (
                              <div key={key} className="text-sm bg-gray-50 rounded p-2 border border-gray-200">
                                <span className="font-medium text-gray-900">{key}:</span>{' '}
                                <span className="text-red-600 line-through">{JSON.stringify(old)}</span>{' '}
                                → <span className="text-green-600">{JSON.stringify(newVal)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Files (for structural) */}
                      {entry.changes.files && entry.changes.files.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Files Changed:</h4>
                          <div className="space-y-1">
                            {entry.changes.files.map((file, idx) => (
                              <div key={idx} className="text-sm bg-gray-50 rounded p-2 border border-gray-200">
                                <span className="font-medium capitalize text-gray-900">{file.action}:</span>{' '}
                                <span className="text-gray-700">{file.path}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Theme (for theme edits) */}
                      {entry.changes.theme && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Theme Changes:</h4>
                          <div className="space-y-1">
                            {Object.entries(entry.changes.theme).map(([key, change]) => {
                              if (!change) return null;
                              return (
                                <div key={key} className="text-sm bg-gray-50 rounded p-2 border border-gray-200">
                                  <span className="font-medium capitalize text-gray-900">{key}:</span>{' '}
                                  <span className="text-red-600">{change.old}</span> →{' '}
                                  <span className="text-green-600">{change.new}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      {entry.metadata && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Metadata:</h4>
                          <div className="space-y-2 text-sm bg-gray-50 rounded p-3 border border-gray-200">
                            {entry.metadata.prompt && (
                              <div>
                                <span className="font-medium text-gray-900">Prompt:</span>{' '}
                                <span className="text-gray-600">{entry.metadata.prompt}</span>
                              </div>
                            )}
                            {entry.metadata.source && (
                              <div>
                                <span className="font-medium text-gray-900">Source:</span>{' '}
                                <span className="text-gray-600 capitalize">{entry.metadata.source}</span>
                              </div>
                            )}
                            {entry.metadata.editMode && (
                              <div>
                                <span className="font-medium text-gray-900">Mode:</span>{' '}
                                <span className="text-gray-600 capitalize">{entry.metadata.editMode}</span>
                              </div>
                            )}
                            {entry.metadata.tokensUsed && (
                              <div>
                                <span className="font-medium text-gray-900">Tokens:</span>{' '}
                                <span className="text-gray-600">{entry.metadata.tokensUsed}</span>
                              </div>
                            )}
                            {entry.metadata.model && (
                              <div>
                                <span className="font-medium text-gray-900">Model:</span>{' '}
                                <span className="text-gray-600">{entry.metadata.model}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

