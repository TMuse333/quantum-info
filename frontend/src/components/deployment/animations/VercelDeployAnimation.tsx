'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface VercelDeployAnimationProps {
  phase: 'entry' | 'loop' | 'exit';
}

export default function VercelDeployAnimation({ phase }: VercelDeployAnimationProps) {
  const [countdown, setCountdown] = useState(3);
  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    if (phase === 'entry') {
      // Countdown before launch
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setLaunched(true);
            return 0;
          }
          return prev - 1;
        });
      }, 600);

      return () => clearInterval(interval);
    } else if (phase === 'exit') {
      setLaunched(true);
      setCountdown(0);
    }
  }, [phase]);

  return (
    <div className="flex flex-col items-center justify-center h-64 bg-gray-900 rounded-lg p-8 overflow-hidden relative">
      <div className="text-purple-400 text-sm font-mono mb-6 tracking-wider flex items-center gap-2">
        <span className="text-xl">🚀</span>
        <span>VERCEL DEPLOYMENT</span>
      </div>

      {/* Rocket */}
      <div className="relative h-40 flex items-end justify-center">
        <motion.div
          animate={{
            y: launched ? -300 : 0,
            rotate: launched ? [0, -5, 5, 0] : 0,
          }}
          transition={{
            y: { duration: 2, ease: 'easeIn' },
            rotate: { duration: 0.5, repeat: launched ? Infinity : 0 },
          }}
          className="relative z-10"
        >
          {/* Rocket body */}
          <div className="relative">
            <svg
              width="60"
              height="80"
              viewBox="0 0 60 80"
              className="drop-shadow-lg"
            >
              {/* Rocket body */}
              <path
                d="M30 0 L20 50 L20 70 L30 80 L40 70 L40 50 Z"
                fill="#8b5cf6"
                stroke="#a78bfa"
                strokeWidth="2"
              />
              {/* Window */}
              <circle cx="30" cy="25" r="8" fill="#1e293b" stroke="#60a5fa" strokeWidth="2" />
              <circle cx="30" cy="25" r="4" fill="#60a5fa" opacity="0.5" />
              {/* Details */}
              <path d="M25 45 L35 45" stroke="#a78bfa" strokeWidth="2" />
              <path d="M25 55 L35 55" stroke="#a78bfa" strokeWidth="2" />
              {/* Fins */}
              <path d="M20 50 L10 65 L20 60 Z" fill="#6366f1" />
              <path d="M40 50 L50 65 L40 60 Z" fill="#6366f1" />
            </svg>

            {/* Flame/exhaust */}
            {(launched || phase === 'loop') && (
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                {/* Main flame */}
                <motion.div
                  animate={{
                    scaleY: [1, 1.3, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 0.2,
                    repeat: Infinity,
                  }}
                  className="relative"
                >
                  <svg width="30" height="40" viewBox="0 0 30 40">
                    <path
                      d="M15 0 L10 20 L5 35 L15 40 L25 35 L20 20 Z"
                      fill="url(#flameGradient)"
                    />
                    <defs>
                      <linearGradient id="flameGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="50%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                  </svg>
                </motion.div>

                {/* Exhaust particles */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute top-8 left-1/2 w-2 h-2 rounded-full"
                    style={{
                      background: i % 2 === 0 ? '#fbbf24' : '#f97316',
                    }}
                    animate={{
                      y: [0, 30, 50],
                      x: [0, (Math.random() - 0.5) * 20],
                      opacity: [1, 0.5, 0],
                      scale: [1, 0.5, 0],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: 'easeOut',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Launch pad */}
        <div className="absolute bottom-0 w-full">
          <div className="w-32 h-2 bg-gray-700 mx-auto rounded-t-lg" />
          <div className="w-40 h-4 bg-gray-800 mx-auto" />
        </div>

        {/* Countdown */}
        {!launched && countdown > 0 && (
          <motion.div
            key={countdown}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <div
              className="text-6xl font-bold text-purple-400"
              style={{
                textShadow: '0 0 20px #a78bfa',
              }}
            >
              {countdown}
            </div>
          </motion.div>
        )}
      </div>

      {/* Status */}
      <div className="mt-8">
        {phase === 'entry' && !launched && (
          <div className="text-purple-400 text-xs font-mono">
            PREPARING LAUNCH...
          </div>
        )}

        {phase === 'loop' && (
          <motion.div
            className="text-purple-400 text-xs font-mono"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            DEPLOYING TO VERCEL...
          </motion.div>
        )}

        {phase === 'exit' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="flex flex-col items-center gap-2"
          >
            <div className="text-green-400 text-sm font-mono font-bold flex items-center gap-2">
              <span className="text-2xl">✓</span>
              <span>LIVE ON VERCEL</span>
            </div>
            <div className="text-xs text-gray-500 font-mono">
              🌐 Your site is now live!
            </div>
          </motion.div>
        )}
      </div>

      {/* Background stars during launch */}
      {launched && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 50}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
