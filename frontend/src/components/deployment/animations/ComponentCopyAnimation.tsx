'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface ComponentCopyAnimationProps {
  phase: 'entry' | 'loop' | 'exit';
}

export default function ComponentCopyAnimation({ phase }: ComponentCopyAnimationProps) {
  const [transferredFiles, setTransferredFiles] = useState(0);
  const totalFiles = 9;

  useEffect(() => {
    if (phase === 'entry') {
      // Transfer files one by one
      const interval = setInterval(() => {
        setTransferredFiles((prev) => {
          if (prev >= totalFiles) {
            clearInterval(interval);
            return totalFiles;
          }
          return prev + 1;
        });
      }, 200);

      return () => clearInterval(interval);
    } else if (phase === 'loop') {
      setTransferredFiles(totalFiles);
    }
  }, [phase]);

  return (
    <div className="flex flex-col items-center justify-center h-64 bg-gray-900 rounded-lg p-8">
      <div className="text-orange-400 text-sm font-mono mb-6 tracking-wider">
        COPYING PRODUCTION COMPONENTS
      </div>

      <div className="flex items-center gap-8">
        {/* Source (left side) */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-mono text-gray-500 mb-2 text-center">
            EXPERIMENT
          </div>
          <div className="bg-gray-800 rounded-lg p-4 w-32 border border-orange-500/30">
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    opacity: transferredFiles > i * 2 ? 0.3 : 1,
                    x: transferredFiles > i * 2 ? 20 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2 text-xs font-mono text-orange-300"
                >
                  <span>📄</span>
                  <div className="h-2 bg-orange-500/50 rounded flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Transfer animation (middle) */}
        <div className="relative w-40 h-32">
          {/* Transfer line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-orange-500/30" />

          {/* Data packets */}
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 transform -translate-y-1/2"
              animate={{
                x: phase === 'loop' || phase === 'entry' ? [0, 160] : 160,
                opacity: phase === 'loop' || phase === 'entry' ? [0, 1, 1, 0] : 0,
              }}
              transition={{
                duration: 1.5,
                repeat: phase === 'loop' ? Infinity : phase === 'entry' ? 5 : 0,
                delay: i * 0.3,
                ease: 'linear',
              }}
            >
              <div
                className="w-3 h-3 rounded-sm rotate-45"
                style={{
                  backgroundColor: '#f59e0b',
                  boxShadow: '0 0 10px #f59e0b',
                }}
              />
            </motion.div>
          ))}

          {/* Progress indicator */}
          <div className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <div className="text-xs font-mono text-orange-400">
              {transferredFiles}/{totalFiles} files
            </div>
            <div className="w-32 h-1 bg-gray-800 rounded-full mt-1 overflow-hidden">
              <motion.div
                className="h-full bg-orange-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{
                  width: `${(transferredFiles / totalFiles) * 100}%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>

        {/* Destination (right side) */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-mono text-gray-500 mb-2 text-center">
            PRODUCTION
          </div>
          <div className="bg-gray-800 rounded-lg p-4 w-32 border border-green-500/30">
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{
                    opacity: transferredFiles > i * 2 ? 1 : 0,
                    x: transferredFiles > i * 2 ? 0 : -20,
                    scale: phase === 'exit' && transferredFiles > i * 2 ? [1, 1.1, 1] : 1,
                  }}
                  transition={{
                    opacity: { duration: 0.3 },
                    scale: { duration: 0.3, delay: i * 0.1 },
                  }}
                  className="flex items-center gap-2 text-xs font-mono text-green-300"
                >
                  <span>📄</span>
                  <div className="h-2 bg-green-500/50 rounded flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      {phase === 'loop' && (
        <motion.div
          className="mt-8 text-orange-400 text-xs font-mono"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          TRANSFERRING COMPONENTS...
        </motion.div>
      )}

      {phase === 'exit' && transferredFiles === totalFiles && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="mt-8 text-green-400 text-sm font-mono font-bold flex items-center gap-2"
        >
          <span className="text-2xl">✓</span>
          <span>COMPONENTS COPIED</span>
        </motion.div>
      )}
    </div>
  );
}
