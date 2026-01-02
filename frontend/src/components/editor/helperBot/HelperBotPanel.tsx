'use client';

import { useHelperBotStore } from '@/stores/helperBotStore';
import { TaskList } from './TaskList';
import { TaskDetail } from './TaskDetail';
import { TabIntroduction } from './TabIntroduction';
import { X, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function HelperBotPanel() {
  const { 
    isOpen, 
    closeHelperBot, 
    currentTask,
    activeTab,
    shouldShowTabIntroduction,
    markTabIntroduced
  } = useHelperBotStore();
  
  if (!isOpen) return null;
  
  // Show tab introduction if needed
  if (activeTab && shouldShowTabIntroduction(activeTab)) {
    return (
      <TabIntroduction 
        tab={activeTab}
        onDismiss={() => markTabIntroduced(activeTab)}
      />
    );
  }
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeHelperBot}
            className="fixed inset-0 bg-black/20 z-40"
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6" />
                <div>
                  <h2 className="text-lg font-bold">Helper Bot</h2>
                  <p className="text-xs text-white/80">Your website building guide</p>
                </div>
              </div>
              <button
                onClick={closeHelperBot}
                className="hover:bg-white/20 p-2 rounded-lg transition-all"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {currentTask ? (
                <TaskDetail task={currentTask} />
              ) : (
                <TaskList />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
