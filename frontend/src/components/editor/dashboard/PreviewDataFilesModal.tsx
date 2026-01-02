"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Copy, Check, Loader2 } from 'lucide-react';

interface DataFile {
  path: string;
  content: string;
  size: number;
}

interface PreviewDataFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  websiteData: any;
}

export default function PreviewDataFilesModal({
  isOpen,
  onClose,
  websiteData,
}: PreviewDataFilesModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataFiles, setDataFiles] = useState<DataFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<DataFile | null>(null);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const handlePreview = async () => {
    setIsLoading(true);
    setError(null);
    setDataFiles([]);
    setSelectedFile(null);

    try {
      console.log('🔍 [PREVIEW] Fetching data file preview...');

      const response = await fetch('/api/production/preview-data-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate preview');
      }

      const result = await response.json();
      console.log('✅ [PREVIEW] Preview generated:', result);

      setDataFiles(result.files);
      if (result.files.length > 0) {
        setSelectedFile(result.files[0]);
      }
    } catch (err: any) {
      console.error('❌ [PREVIEW] Error:', err);
      setError(err.message || 'Failed to generate preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyContent = async (file: DataFile) => {
    try {
      await navigator.clipboard.writeText(file.content);
      setCopiedPath(file.path);
      setTimeout(() => setCopiedPath(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Generate preview when modal opens
  const handleOpen = () => {
    if (isOpen && dataFiles.length === 0 && !isLoading) {
      handlePreview();
    }
  };

  // Reset when closing
  const handleClose = () => {
    setDataFiles([]);
    setSelectedFile(null);
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            onAnimationComplete={handleOpen}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
          >
            <div className="w-full max-w-7xl h-full max-h-[85vh] bg-gray-900 rounded-lg shadow-2xl border border-gray-700 flex flex-col"
            >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-400" />
                <div>
                  <h2 className="text-xl font-bold text-white">Preview Data Files</h2>
                  <p className="text-sm text-gray-400">
                    {dataFiles.length > 0
                      ? `${dataFiles.length} .data.ts files generated`
                      : 'View generated .data.ts file contents without deploying'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* File List Sidebar */}
              {dataFiles.length > 0 && (
                <div className="w-64 border-r border-gray-700 flex flex-col">
                  <div className="p-4 border-b border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-300">Files ({dataFiles.length})</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {dataFiles.map((file) => (
                      <button
                        key={file.path}
                        onClick={() => setSelectedFile(file)}
                        className={`w-full p-3 text-left border-b border-gray-800 hover:bg-gray-800 transition-colors ${
                          selectedFile?.path === file.path ? 'bg-gray-800' : ''
                        }`}
                      >
                        <div className="text-sm font-mono text-white truncate">
                          {file.path.split('/').pop()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {(file.size / 1024).toFixed(1)} KB
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {isLoading && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
                      <p className="text-gray-400">Generating preview...</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-lg">
                      <div className="text-red-400 text-4xl mb-4">❌</div>
                      <h3 className="text-lg font-semibold text-red-400 mb-2">Preview Failed</h3>
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {!isLoading && !error && dataFiles.length === 0 && (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No preview generated yet</p>
                    </div>
                  </div>
                )}

                {selectedFile && (
                  <>
                    {/* File Header */}
                    <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-mono text-white">{selectedFile.path}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {selectedFile.content.split('\n').length} lines • {(selectedFile.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopyContent(selectedFile)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm text-gray-300"
                      >
                        {copiedPath === selectedFile.path ? (
                          <>
                            <Check className="w-4 h-4 text-green-400" />
                            <span className="text-green-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* File Content */}
                    <div className="flex-1 overflow-auto p-4 bg-gray-950">
                      <pre className="text-xs text-gray-300 font-mono">
                        <code>{selectedFile.content}</code>
                      </pre>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {dataFiles.length > 0 && (
                  <span>
                    📊 Total files: {dataFiles.length} • Total size:{' '}
                    {(dataFiles.reduce((acc, f) => acc + f.size, 0) / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                {dataFiles.length > 0 && (
                  <button
                    onClick={handlePreview}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors disabled:opacity-50"
                  >
                    Refresh Preview
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
