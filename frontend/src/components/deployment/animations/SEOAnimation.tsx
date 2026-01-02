'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SEOAnimationProps {
  phase: 'entry' | 'loop' | 'exit';
}

const seoKeywords = [
  'meta-tags', 'keywords', 'description', 'title',
  'og:image', 'canonical', 'robots', 'sitemap',
  'schema.org', 'json-ld', 'analytics', 'performance'
];

export default function SEOAnimation({ phase }: SEOAnimationProps) {
  const [activeColumns, setActiveColumns] = useState<number[]>([]);

  useEffect(() => {
    if (phase === 'entry' || phase === 'loop') {
      // Activate columns in sequence
      const intervals = seoKeywords.map((_, index) =>
        setTimeout(() => {
          setActiveColumns((prev) => [...prev, index]);
        }, index * 150)
      );

      return () => intervals.forEach(clearTimeout);
    }
  }, [phase]);

  return (
    <div className="flex flex-col items-center justify-center h-64 bg-gray-900 rounded-lg p-8 overflow-hidden">
      <div className="text-green-400 text-sm font-mono mb-6 tracking-wider">
        GENERATING SEO METADATA
      </div>

      {/* Matrix-style cascading keywords */}
      <div className="flex gap-3 justify-center items-end h-32">
        {seoKeywords.slice(0, 8).map((keyword, colIndex) => (
          <div key={colIndex} className="flex flex-col-reverse gap-1">
            {/* Cascading keyword */}
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{
                y: activeColumns.includes(colIndex) ? 0 : -100,
                opacity: activeColumns.includes(colIndex) ? 1 : 0,
              }}
              transition={{
                duration: 0.6,
                delay: colIndex * 0.1,
                ease: 'easeOut',
              }}
              className="relative"
            >
              <div
                className="px-2 py-1 rounded text-xs font-mono whitespace-nowrap"
                style={{
                  backgroundColor: phase === 'exit' ? '#10b981' : '#10b98120',
                  color: phase === 'exit' ? '#fff' : '#10b981',
                  border: `1px solid ${phase === 'exit' ? '#10b981' : '#10b98140'}`,
                  boxShadow: `0 0 10px ${phase === 'exit' ? '#10b981' : '#10b98130'}`,
                }}
              >
                {keyword}
              </div>

              {/* Trailing particles during loop */}
              {phase === 'loop' && activeColumns.includes(colIndex) && (
                <motion.div
                  className="absolute -top-2 left-1/2 transform -translate-x-1/2"
                  animate={{
                    y: [0, -20, -40],
                    opacity: [0.8, 0.4, 0],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatDelay: 1 + colIndex * 0.2,
                  }}
                >
                  <div className="w-1 h-1 bg-green-400 rounded-full" />
                </motion.div>
              )}
            </motion.div>
          </div>
        ))}
      </div>

      {/* Metadata structure visualization */}
      {phase === 'exit' && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="mt-6 text-green-400 text-xs font-mono flex items-center gap-2"
        >
          <span className="text-2xl">✓</span>
          <span>METADATA OPTIMIZED</span>
        </motion.div>
      )}

      {/* Loop indicator */}
      {phase === 'loop' && (
        <motion.div
          className="mt-6 text-green-400 text-xs font-mono"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ANALYZING {activeColumns.length} PROPERTIES...
        </motion.div>
      )}
    </div>
  );
}
