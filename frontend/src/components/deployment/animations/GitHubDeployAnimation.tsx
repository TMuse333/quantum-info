'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface GitHubDeployAnimationProps {
  phase: 'entry' | 'loop' | 'exit';
}

export default function GitHubDeployAnimation({ phase }: GitHubDeployAnimationProps) {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { label: 'Create blobs', icon: '📦' },
    { label: 'Build tree', icon: '🌳' },
    { label: 'Create commit', icon: '💾' },
    { label: 'Update branch', icon: '🔀' },
    { label: 'Create tag', icon: '🏷️' },
  ];

  useEffect(() => {
    if (phase === 'entry') {
      // Activate steps sequentially
      steps.forEach((_, index) => {
        setTimeout(() => {
          setActiveStep(index + 1);
        }, index * 400);
      });
    } else if (phase === 'loop' || phase === 'exit') {
      setActiveStep(steps.length);
    }
  }, [phase]);

  return (
    <div className="flex flex-col items-center justify-center h-64 bg-gray-900 rounded-lg p-8">
      <div className="text-indigo-400 text-sm font-mono mb-6 tracking-wider flex items-center gap-2">
        <span className="text-xl">⚙️</span>
        <span>GITHUB API DEPLOYMENT</span>
      </div>

      {/* Git graph visualization */}
      <div className="relative">
        {/* Commit nodes */}
        <div className="flex items-center gap-4">
          {steps.map((step, index) => (
            <div key={step.label} className="flex flex-col items-center gap-2">
              {/* Connection line */}
              {index > 0 && (
                <div className="absolute top-[18px] h-0.5 w-12 bg-gray-700"
                  style={{
                    left: `${index * 80 - 36}px`,
                  }}
                >
                  {/* Data pulse animation */}
                  {(activeStep > index || phase === 'loop') && (
                    <motion.div
                      className="absolute top-0 left-0 h-full bg-indigo-500"
                      initial={{ width: '0%' }}
                      animate={{
                        width: activeStep > index ? '100%' : '0%',
                      }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.4,
                      }}
                    />
                  )}

                  {/* Loop pulse */}
                  {phase === 'loop' && (
                    <motion.div
                      className="absolute top-0 h-full w-2 bg-indigo-400 rounded-full"
                      animate={{
                        left: ['0%', '100%'],
                        opacity: [1, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: index * 0.3,
                        ease: 'linear',
                      }}
                      style={{
                        boxShadow: '0 0 10px #818cf8',
                      }}
                    />
                  )}
                </div>
              )}

              {/* Commit node */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: activeStep > index ? 1 : 0,
                  opacity: activeStep > index ? 1 : 0,
                }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.4,
                  type: 'spring',
                  stiffness: 200,
                }}
                className="relative z-10"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  style={{
                    backgroundColor: phase === 'exit' && activeStep > index ? '#10b981' : '#6366f1',
                    boxShadow: `0 0 20px ${phase === 'exit' && activeStep > index ? '#10b981' : '#6366f1'}`,
                    border: '2px solid rgba(255,255,255,0.2)',
                  }}
                >
                  {step.icon}
                </div>

                {/* Pulse effect during loop */}
                {phase === 'loop' && activeStep > index && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      backgroundColor: '#6366f1',
                    }}
                    animate={{
                      scale: [1, 1.5, 1.5],
                      opacity: [0.5, 0, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.4,
                    }}
                  />
                )}
              </motion.div>

              {/* Step label */}
              <div className="text-xs font-mono text-gray-400 text-center w-20">
                {step.label}
              </div>

              {/* Checkmark */}
              {phase === 'exit' && activeStep > index && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.5 + index * 0.1,
                    type: 'spring',
                    stiffness: 200,
                  }}
                  className="absolute -top-2 -right-2 text-green-400 text-sm bg-gray-900 rounded-full"
                >
                  ✓
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Status text */}
      <div className="mt-12">
        {phase === 'entry' && activeStep < steps.length && (
          <div className="text-indigo-400 text-xs font-mono">
            {steps[activeStep]?.label.toUpperCase()}...
          </div>
        )}

        {phase === 'loop' && (
          <motion.div
            className="text-indigo-400 text-xs font-mono"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            PUSHING TO PRODUCTION BRANCH...
          </motion.div>
        )}

        {phase === 'exit' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1, type: 'spring' }}
            className="text-green-400 text-sm font-mono font-bold flex items-center gap-2"
          >
            <span className="text-2xl">✓</span>
            <span>DEPLOYED TO GITHUB</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
