'use client';

import { TAB_INTRODUCTIONS } from '@/data/helperBotTasks';
import { useHelperBotStore } from '@/stores/helperBotStore';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TabIntroductionProps {
  tab: 'editor' | 'assistant' | 'versions';
  onDismiss: () => void;
}

export function TabIntroduction({ tab, onDismiss }: TabIntroductionProps) {
  const intro = TAB_INTRODUCTIONS[tab];
  const { startTask } = useHelperBotStore();
  
  if (!intro) return null;
  
  const handleAction = (action: { label: string; taskId?: string; action?: string }) => {
    if (action.taskId) {
      startTask(action.taskId);
    }
    onDismiss();
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">{intro.title}</h3>
            <button 
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">{intro.message}</p>
          
          <div className="flex gap-3">
            {intro.actions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleAction(action)}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                  action.taskId
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

