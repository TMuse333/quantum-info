'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface FileGenAnimationProps {
  phase: 'entry' | 'loop' | 'exit';
}

const codeLines = [
  'import { Component } from "react";',
  'export default function Page() {',
  '  return (',
  '    <div className="container">',
  '      <Hero {...props} />',
  '      <Content {...props} />',
  '    </div>',
  '  );',
  '}',
];

export default function FileGenAnimation({ phase }: FileGenAnimationProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [compiledBlocks, setCompiledBlocks] = useState<number>(0);

  useEffect(() => {
    if (phase === 'entry') {
      // Type out code lines
      codeLines.forEach((_, index) => {
        setTimeout(() => {
          setVisibleLines(index + 1);
        }, index * 200);
      });
    } else if (phase === 'loop') {
      // All lines visible during loop
      setVisibleLines(codeLines.length);
    } else if (phase === 'exit') {
      // Compile animation
      setVisibleLines(codeLines.length);
      const interval = setInterval(() => {
        setCompiledBlocks((prev) => {
          if (prev >= 3) {
            clearInterval(interval);
            return 3;
          }
          return prev + 1;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [phase]);

  return (
    <div className="flex flex-col items-center justify-center h-64 bg-gray-900 rounded-lg p-8">
      <div className="text-purple-400 text-sm font-mono mb-4 tracking-wider">
        GENERATING PAGE FILES
      </div>

      <div className="flex gap-8 items-center">
        {/* Code editor simulation */}
        <div className="bg-gray-800 rounded-lg p-4 w-80 h-48 overflow-hidden border border-purple-500/30">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-gray-500 ml-2 font-mono">page.tsx</span>
          </div>

          <div className="space-y-1">
            {codeLines.map((line, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: index < visibleLines ? 1 : 0,
                  x: index < visibleLines ? 0 : -20,
                }}
                transition={{ duration: 0.3 }}
                className="text-xs font-mono flex"
              >
                <span className="text-gray-600 w-6">{index + 1}</span>
                <span className="text-purple-300">{line}</span>

                {/* Typing cursor */}
                {phase === 'entry' && index === visibleLines - 1 && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="inline-block w-1 h-4 bg-purple-400 ml-1"
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Compilation blocks (Tetris-style stacking) */}
        <div className="flex flex-col-reverse gap-2">
          {[0, 1, 2].map((blockIndex) => (
            <motion.div
              key={blockIndex}
              initial={{ y: -50, opacity: 0 }}
              animate={{
                y: blockIndex < compiledBlocks || phase === 'loop' ? 0 : -50,
                opacity: blockIndex < compiledBlocks || phase === 'loop' ? 1 : 0,
                scale: phase === 'loop' ? [1, 1.05, 1] : 1,
              }}
              transition={{
                y: { duration: 0.4, delay: phase === 'exit' ? blockIndex * 0.15 : 0 },
                scale: {
                  duration: 1.5,
                  repeat: phase === 'loop' ? Infinity : 0,
                  delay: blockIndex * 0.3,
                },
              }}
              className="w-16 h-12 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: phase === 'exit' && blockIndex < compiledBlocks ? '#10b981' : '#8b5cf6',
                boxShadow: `0 0 15px ${phase === 'exit' && blockIndex < compiledBlocks ? '#10b981' : '#8b5cf6'}`,
              }}
            >
              <span className="text-white text-xs font-mono font-bold">
                {blockIndex === 0 && '📄'}
                {blockIndex === 1 && '📄'}
                {blockIndex === 2 && '📄'}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Status indicator */}
      {phase === 'loop' && (
        <motion.div
          className="mt-4 text-purple-400 text-xs font-mono"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          COMPILING {visibleLines} LINES...
        </motion.div>
      )}

      {phase === 'exit' && compiledBlocks === 3 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mt-4 text-green-400 text-xs font-mono flex items-center gap-2"
        >
          <span className="text-xl">✓</span>
          <span>FILES GENERATED</span>
        </motion.div>
      )}
    </div>
  );
}
