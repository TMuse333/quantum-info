'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface CodeReviewAnimationProps {
  phase: 'entry' | 'loop' | 'exit';
}

export default function CodeReviewAnimation({ phase }: CodeReviewAnimationProps) {
  const [scanProgress, setScanProgress] = useState(0);
  const [checksCompleted, setChecksCompleted] = useState<string[]>([]);

  const checks = [
    { label: 'Syntax', icon: '{ }' },
    { label: 'Security', icon: '🔒' },
    { label: 'Performance', icon: '⚡' },
    { label: 'Accessibility', icon: '♿' },
  ];

  useEffect(() => {
    if (phase === 'entry' || phase === 'loop') {
      // Scan progress animation
      const interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) return phase === 'loop' ? 0 : 100;
          return prev + 5;
        });
      }, 50);

      // Complete checks during entry
      if (phase === 'entry') {
        checks.forEach((check, index) => {
          setTimeout(() => {
            setChecksCompleted((prev) => [...prev, check.label]);
          }, (index + 1) * 500);
        });
      }

      return () => clearInterval(interval);
    }
  }, [phase]);

  return (
    <div className="flex flex-col items-center justify-center h-64 bg-gray-900 rounded-lg p-8">
      <div className="text-blue-400 text-sm font-mono mb-6 tracking-wider">
        REVIEWING GENERATED CODE
      </div>

      <div className="w-full max-w-md">
        {/* Scan line visualization */}
        <div className="relative bg-gray-800 rounded-lg p-6 mb-6 overflow-hidden h-40">
          {/* Code lines background */}
          <div className="absolute inset-0 p-6 space-y-2 text-xs font-mono text-gray-600">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-gray-700">{i + 1}</span>
                <div className="flex-1 h-3 bg-gray-700/30 rounded" />
              </div>
            ))}
          </div>

          {/* Scanning beam */}
          <motion.div
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
            style={{
              boxShadow: '0 0 20px #60a5fa, 0 0 40px #60a5fa',
            }}
            animate={{
              top: phase === 'entry' ? [0, 160] : phase === 'loop' ? [0, 160] : 160,
            }}
            transition={{
              duration: phase === 'entry' ? 1.5 : 2,
              repeat: phase === 'loop' ? Infinity : 0,
              ease: 'linear',
            }}
          />

          {/* Scan progress indicator */}
          <div className="absolute bottom-4 right-4 text-blue-400 text-xs font-mono">
            {scanProgress}%
          </div>
        </div>

        {/* Check results */}
        <div className="grid grid-cols-2 gap-3">
          {checks.map((check, index) => (
            <motion.div
              key={check.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: checksCompleted.includes(check.label) || phase === 'exit' ? 1 : 0.3,
                x: 0,
                scale: phase === 'exit' ? [1, 1.05, 1] : 1,
              }}
              transition={{
                opacity: { delay: index * 0.5 },
                scale: { duration: 0.3, delay: index * 0.1 },
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                checksCompleted.includes(check.label) || phase === 'exit'
                  ? 'bg-green-500/20 border-green-500/50'
                  : 'bg-gray-800 border-gray-700'
              }`}
            >
              <span className="text-lg">{check.icon}</span>
              <span className="text-xs font-mono text-gray-300">{check.label}</span>
              {(checksCompleted.includes(check.label) || phase === 'exit') && (
                <motion.span
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="ml-auto text-green-400 text-sm"
                >
                  ✓
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Status text */}
      {phase === 'loop' && (
        <motion.div
          className="mt-6 text-blue-400 text-xs font-mono"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ANALYZING CODE QUALITY...
        </motion.div>
      )}

      {phase === 'exit' && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          className="mt-6 text-green-400 text-sm font-mono font-bold flex items-center gap-2"
        >
          <span className="text-2xl">✓</span>
          <span>CODE REVIEW PASSED</span>
        </motion.div>
      )}
    </div>
  );
}
