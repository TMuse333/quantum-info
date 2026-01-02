'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ValidationAnimationProps {
  phase: 'entry' | 'loop' | 'exit';
}

const tetrisShapes = [
  { name: 'NavBar', color: '#06b6d4', cells: [[0, 0], [1, 0], [2, 0], [3, 0]] }, // I-piece
  { name: 'Hero', color: '#8b5cf6', cells: [[0, 0], [1, 0], [0, 1], [1, 1]] }, // O-piece
  { name: 'Footer', color: '#10b981', cells: [[0, 0], [1, 0], [2, 0], [2, 1]] }, // L-piece
  { name: 'Content', color: '#f59e0b', cells: [[0, 0], [1, 0], [1, 1], [2, 1]] }, // Z-piece
];

export default function ValidationAnimation({ phase }: ValidationAnimationProps) {
  const [completedBlocks, setCompletedBlocks] = useState<number[]>([]);

  useEffect(() => {
    if (phase === 'entry') {
      // Blocks drop in sequence
      tetrisShapes.forEach((_, index) => {
        setTimeout(() => {
          setCompletedBlocks((prev) => [...prev, index]);
        }, index * 400);
      });
    } else if (phase === 'exit') {
      // Flash all blocks green
      setCompletedBlocks([0, 1, 2, 3]);
    }
  }, [phase]);

  return (
    <div className="flex flex-col items-center justify-center h-64 bg-gray-900 rounded-lg p-8">
      <div className="text-cyan-400 text-sm font-mono mb-4 tracking-wider">
        VALIDATING COMPONENTS
      </div>

      {/* Tetris Grid */}
      <div className="grid grid-cols-4 gap-4">
        {tetrisShapes.map((shape, index) => (
          <motion.div
            key={shape.name}
            initial={{ y: -200, opacity: 0 }}
            animate={{
              y: completedBlocks.includes(index) ? 0 : phase === 'loop' ? [0, -10, 0] : -200,
              opacity: completedBlocks.includes(index) ? 1 : 0,
              scale: phase === 'exit' ? [1, 1.1, 1] : 1,
            }}
            transition={{
              y: {
                duration: completedBlocks.includes(index) ? 0.6 : phase === 'loop' ? 1 : 0,
                delay: completedBlocks.includes(index) ? index * 0.15 : 0,
                ease: 'easeOut',
                repeat: phase === 'loop' ? Infinity : 0,
                repeatDelay: 0.5,
              },
              scale: {
                duration: 0.3,
                repeat: phase === 'exit' ? 2 : 0,
              },
            }}
            className="relative"
          >
            {/* Tetris Block */}
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center relative overflow-hidden"
              style={{
                backgroundColor: phase === 'exit' ? '#10b981' : shape.color,
                boxShadow: `0 0 20px ${phase === 'exit' ? '#10b981' : shape.color}`,
              }}
            >
              {/* Block pattern */}
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 p-1">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="bg-white/10 rounded-sm" />
                ))}
              </div>

              {/* Checkmark on completion */}
              {completedBlocks.includes(index) && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                  className="relative z-10 text-white text-2xl font-bold"
                >
                  ✓
                </motion.div>
              )}
            </div>

            {/* Component Name */}
            <div className="text-center mt-2 text-xs font-mono text-gray-400">
              {shape.name}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress indicator */}
      {phase === 'loop' && (
        <motion.div
          className="mt-6 text-cyan-400 text-xs font-mono"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {completedBlocks.length} / {tetrisShapes.length} VALIDATED
        </motion.div>
      )}
    </div>
  );
}
