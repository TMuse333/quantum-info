'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import ValidationAnimation from './animations/ValidationAnimation';
import FileGenAnimation from './animations/FileGenAnimation';
import CodeReviewAnimation from './animations/CodeReviewAnimation';
import ComponentCopyAnimation from './animations/ComponentCopyAnimation';
import GitHubDeployAnimation from './animations/GitHubDeployAnimation';
import VercelDeployAnimation from './animations/VercelDeployAnimation';

interface AnimatedDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  websiteData: any;
  dryRun?: boolean;
  appName?: string;
  pushToMain?: boolean; // If true, only push to GitHub (no Vercel)
}

interface StageConfig {
  id: string;
  name: string;
  animation: typeof ValidationAnimation;
  minDuration: number; // Minimum time stage should be visible (ms)
  entryDuration: number; // Entry animation duration (ms)
  loopDuration: number; // Loop animation cycle (ms)
  exitDuration: number; // Exit animation duration (ms)
}

const STAGES: StageConfig[] = [
  {
    id: 'validation',
    name: 'Validation',
    animation: ValidationAnimation,
    minDuration: 1500, // Minimum time to show animation (entry + loop + exit)
    entryDuration: 300,
    loopDuration: 800,
    exitDuration: 200,
  },
  {
    id: 'componentCopy',
    name: 'Component Copy',
    animation: ComponentCopyAnimation,
    minDuration: 1500,
    entryDuration: 300,
    loopDuration: 800,
    exitDuration: 200,
  },
  {
    id: 'fileGen',
    name: 'File Generation',
    animation: FileGenAnimation,
    minDuration: 1500,
    entryDuration: 300,
    loopDuration: 800,
    exitDuration: 200,
  },
  {
    id: 'codeReview',
    name: 'Code Review',
    animation: CodeReviewAnimation,
    minDuration: 2000, // Code review might be faster, but show animation longer
    entryDuration: 300,
    loopDuration: 1200,
    exitDuration: 200,
  },
  {
    id: 'githubDeploy',
    name: 'GitHub Deploy',
    animation: GitHubDeployAnimation,
    minDuration: 2500, // GitHub operations might be quick, but show full animation
    entryDuration: 400,
    loopDuration: 1500,
    exitDuration: 300,
  },
  {
    id: 'vercelDeploy',
    name: 'Vercel Deploy',
    animation: VercelDeployAnimation,
    minDuration: 2500, // Vercel deploy might be quick, but show full animation
    entryDuration: 400,
    loopDuration: 1500,
    exitDuration: 300,
  },
];

export default function AnimatedDeployModal({
  isOpen,
  onClose,
  websiteData,
  dryRun = false,
  appName = '',
  pushToMain = false,
}: AnimatedDeployModalProps) {
  console.log('🎭 [MODAL] AnimatedDeployModal render, isOpen:', isOpen);

  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [stagePhase, setStagePhase] = useState<'entry' | 'loop' | 'exit'>('entry');
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentComplete, setDeploymentComplete] = useState(false);
  const [deploymentError, setDeploymentError] = useState<string | null>(null);
  const [stageProgress, setStageProgress] = useState(0); // 0-100 for loading bar
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);

  const stageStartTime = useRef<number>(0);
  const apiCompleteTime = useRef<number | null>(null);
  const stageCompleteRef = useRef(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const currentStage = STAGES[currentStageIndex];
  const CurrentAnimation = currentStage?.animation;

  // Start deployment when modal opens
  useEffect(() => {
    console.log('🎭 [MODAL] useEffect triggered, isOpen:', isOpen, 'isDeploying:', isDeploying);
    if (isOpen && !isDeploying) {
      console.log('🎭 [MODAL] Starting deployment...');
      startDeployment();
    }

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isOpen]);

  // Stage timing controller - ensures animations play out fully
  useEffect(() => {
    if (!isDeploying || !currentStage) return;

    if (stagePhase === 'entry') {
      stageStartTime.current = Date.now();
      apiCompleteTime.current = null;
      stageCompleteRef.current = false;
      setStageProgress(10); // Start progress

      // Transition to loop after entry animation completes
      const timer = setTimeout(() => {
        if (!stageCompleteRef.current) {
          setStagePhase('loop');
          setStageProgress(30); // Show progress during loop
        }
      }, currentStage.entryDuration);

      return () => clearTimeout(timer);
    } else if (stagePhase === 'loop') {
      // Animate progress during loop (gradual increase)
      // Only if API hasn't completed yet
      if (!apiCompleteTime.current) {
        const progressInterval = setInterval(() => {
          setStageProgress(prev => {
            // Gradually increase progress, but cap at 90% until API completes
            const newProgress = Math.min(prev + 2, 90);
            return newProgress;
          });
        }, 100);

        return () => clearInterval(progressInterval);
      } else {
        // API completed, but waiting for minimum duration
        // Keep progress at 100% and continue loop animation
        setStageProgress(100);
      }
    }
  }, [currentStageIndex, stagePhase, isDeploying, currentStage]);

  const completeCurrentStage = () => {
    if (stageCompleteRef.current) return;

    const elapsed = Date.now() - stageStartTime.current;
    const remainingTime = Math.max(0, currentStage.minDuration - elapsed);

    // Mark API as complete
    apiCompleteTime.current = Date.now();
    setStageProgress(100); // Complete loading bar

    // If we haven't reached minimum duration, wait before showing exit
    if (remainingTime > 0) {
      // Continue showing loop animation until minimum duration is reached
      setTimeout(() => {
        if (!stageCompleteRef.current) {
          stageCompleteRef.current = true;
          setStagePhase('exit');

          // Move to next stage after exit animation
          setTimeout(() => {
            setCompletedStages((prev) => [...prev, currentStage.id]);
            setStageProgress(0); // Reset progress for next stage

            if (currentStageIndex < STAGES.length - 1) {
              setCurrentStageIndex((prev) => prev + 1);
              setStagePhase('entry');
            } else {
              // All stages complete
              setIsDeploying(false);
              setDeploymentComplete(true);
            }
          }, currentStage.exitDuration);
        }
      }, remainingTime);
    } else {
      // Minimum duration already elapsed, proceed to exit immediately
      stageCompleteRef.current = true;
      setStagePhase('exit');

      // Move to next stage after exit animation
      setTimeout(() => {
        setCompletedStages((prev) => [...prev, currentStage.id]);
        setStageProgress(0); // Reset progress for next stage

        if (currentStageIndex < STAGES.length - 1) {
          setCurrentStageIndex((prev) => prev + 1);
          setStagePhase('entry');
        } else {
          // All stages complete
          setIsDeploying(false);
          setDeploymentComplete(true);
        }
      }, currentStage.exitDuration);
    }
  };

  const startDeployment = async () => {
    setIsDeploying(true);
    setDeploymentComplete(false);
    setDeploymentError(null);
    setCurrentStageIndex(0);
    setStagePhase('entry');
    setCompletedStages([]);
    setStageProgress(0);

    // Map SSE stage names to our stage IDs
    const stageMap: Record<string, number> = {
      'Validation': 0,
      'Component Copying': 1,
      'File Generation': 2,
      'Final Validation': 2, // Treat as part of file generation
      'Code Review': 3,
      'Git Operations': 4, // Maps to githubDeploy
      'GitHub Deploy': 4,
      'Vercel Deploy': 5,
    };

    try {
      // Use SSE stream instead of regular fetch
      // Use push-to-main endpoint if pushToMain is true (GitHub only, no Vercel)
      const endpoint = pushToMain ? '/api/production/push-to-main' : '/api/production/deploy-stream';

      const requestBody = pushToMain
        ? { websiteData, dryRun }
        : { websiteData, skipCodeReview: false, skipVercelDeploy: false, dryRun, appName };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() || '';

        for (const chunk of chunks) {
          if (!chunk.trim()) continue;
          
          let eventType = '';
          let dataStr = '';
          
          for (const line of chunk.split('\n')) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              dataStr = line.slice(6).trim();
            }
          }

          if (dataStr) {
            try {
              const data = JSON.parse(dataStr);
              
              if (eventType === 'stage' && data.stage) {
                // Update progress based on stage status
                if (data.status === 'in-progress') {
                  setStageProgress(50);
                  // Switch to the correct stage if we're behind
                  const stageIndex = stageMap[data.name];
                  if (stageIndex !== undefined && stageIndex > currentStageIndex) {
                    // Jump to the correct stage immediately (skip animations for speed)
                    setCurrentStageIndex(stageIndex);
                    setStagePhase('loop');
                    setStageProgress(50);
                  }
                } else if (data.status === 'completed' || data.status === 'skipped') {
                  setStageProgress(100);
                  // Complete the current stage immediately (no minDuration wait)
                  completeCurrentStage();
                } else if (data.status === 'failed') {
                  setDeploymentError(data.message || 'Deployment failed');
                  setIsDeploying(false);
                  return;
                }
              } else if (eventType === 'complete' || data.success !== undefined) {
                // Deployment complete
                if (data.success) {
                  // Store deployment URL from details
                  if (data.details?.deploymentUrl) {
                    setDeploymentUrl(data.details.deploymentUrl);
                  }
                  setDeploymentComplete(true);
                  setIsDeploying(false);
                } else {
                  setDeploymentError(data.errors?.join(', ') || 'Deployment failed');
                  setIsDeploying(false);
                }
                return;
              } else if (eventType === 'error') {
                setDeploymentError(data.message || 'Deployment error');
                setIsDeploying(false);
                return;
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e, dataStr);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Deployment error:', error);
      setDeploymentError(error.message || 'Deployment failed');
      setIsDeploying(false);
    }
  };

  const handleClose = () => {
    if (!isDeploying) {
      onClose();
      // Reset state
      setTimeout(() => {
        setCurrentStageIndex(0);
        setStagePhase('entry');
        setCompletedStages([]);
        setDeploymentComplete(false);
        setDeploymentError(null);
        setDeploymentUrl(null);
      }, 300);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeploying) {
              handleClose();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="bg-gray-950 rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden border border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: isDeploying ? 360 : 0 }}
                    transition={{ duration: 2, repeat: isDeploying ? Infinity : 0, ease: 'linear' }}
                    className="text-3xl"
                  >
                    🚀
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {dryRun ? 'Dry Run Deployment' : 'Production Deployment'}
                    </h2>
                    <p className="text-sm text-purple-200">
                      {deploymentComplete
                        ? 'Deployment Complete!'
                        : deploymentError
                        ? 'Deployment Failed'
                        : `Stage ${currentStageIndex + 1} of ${STAGES.length}`}
                    </p>
                  </div>
                </div>

                {!isDeploying && (
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Main animation area */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {!deploymentComplete && !deploymentError && CurrentAnimation && (
                  <motion.div
                    key={currentStageIndex}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.1 }}
                    className="relative"
                  >
                    <CurrentAnimation phase={stagePhase} />
                    
                    {/* Loading Bar */}
                    <div className="mt-4 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${stageProgress}%` }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      />
                    </div>
                  </motion.div>
                )}

                {deploymentComplete && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="flex flex-col items-center justify-center min-h-96 bg-gradient-to-b from-gray-900 to-gray-950 rounded-lg p-8"
                  >
                    {/* Success Icon with Confetti Effect */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2, duration: 0.5 }}
                      className="relative mb-6"
                    >
                      <motion.div
                        animate={{
                          rotate: [0, 10, -10, 10, 0],
                          scale: [1, 1.1, 1.1, 1.1, 1]
                        }}
                        transition={{ duration: 0.8, repeat: 2 }}
                        className="text-9xl"
                      >
                        🚀
                      </motion.div>
                      {/* Sparkle effects */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 2] }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="absolute -top-4 -right-4 text-4xl"
                      >
                        ✨
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 2] }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="absolute -bottom-4 -left-4 text-4xl"
                      >
                        ✨
                      </motion.div>
                    </motion.div>

                    {/* Success Message */}
                    <motion.h3
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 mb-3"
                    >
                      {dryRun ? 'Dry Run Complete!' : 'Live on the Internet!'}
                    </motion.h3>
                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-gray-300 text-center max-w-md mb-8 text-lg"
                    >
                      {dryRun
                        ? 'Dry run completed successfully. No changes were made.'
                        : 'Your website is now live and accessible to everyone!'}
                    </motion.p>

                    {/* Preview Placeholder (Future: iframe) */}
                    {!dryRun && deploymentUrl && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="w-full max-w-2xl mb-6"
                      >
                        <div className="bg-gray-800 border-2 border-green-500/30 rounded-xl p-6 shadow-2xl">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                              <span className="text-sm font-semibold text-green-400">LIVE</span>
                            </div>
                            <span className="text-xs text-gray-500 font-mono">Production</span>
                          </div>

                          {/* iframe Preview */}
                          <div className="mb-4 rounded-lg overflow-hidden border border-gray-700 bg-white">
                            <iframe
                              src={deploymentUrl}
                              className="w-full h-64"
                              title="Site Preview"
                              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                            />
                          </div>

                          {/* URL Display */}
                          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
                            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Your website URL</p>
                            <a
                              href={deploymentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-center text-xl font-mono text-purple-400 hover:text-purple-300 transition-colors break-all font-semibold"
                            >
                              {deploymentUrl}
                            </a>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3">
                            <button
                              onClick={() => window.open(deploymentUrl, '_blank')}
                              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
                            >
                              🌐 Visit Your Site
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(deploymentUrl);
                                // Optional: Add toast notification
                              }}
                              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all border border-gray-600"
                            >
                              📋 Copy Link
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Close hint */}
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      className="text-gray-500 text-sm mt-4"
                    >
                      Click outside to close
                    </motion.p>
                  </motion.div>
                )}

                {deploymentError && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center justify-center h-64 bg-gray-900 rounded-lg"
                  >
                    <div className="text-6xl mb-4">❌</div>
                    <h3 className="text-2xl font-bold text-red-400 mb-2">Deployment Failed</h3>
                    <p className="text-gray-400 text-center max-w-md text-sm">{deploymentError}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Stage list */}
            <div className="bg-gray-900 border-t border-gray-800 p-6">
              <div className="grid grid-cols-6 gap-2">
                {STAGES.map((stage, index) => (
                  <div
                    key={stage.id}
                    className={`text-center p-2 rounded-lg border transition-all ${
                      completedStages.includes(stage.id)
                        ? 'bg-green-500/20 border-green-500/50'
                        : index === currentStageIndex && isDeploying
                        ? 'bg-purple-500/20 border-purple-500/50 animate-pulse'
                        : 'bg-gray-800 border-gray-700'
                    }`}
                  >
                    <div className="text-2xl mb-1">
                      {completedStages.includes(stage.id) ? '✓' : index === currentStageIndex && isDeploying ? '⏳' : '○'}
                    </div>
                    <div className="text-xs font-mono text-gray-400">{stage.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
