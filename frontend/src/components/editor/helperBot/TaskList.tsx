'use client';

import { useHelperBotStore } from '@/stores/helperBotStore';
import { CheckCircle2, Circle, Clock, Sparkles } from 'lucide-react';

export function TaskList() {
  const {
    getAvailableTasks,
    getCompletedTasks,
    startTask,
    getCompletionRate
  } = useHelperBotStore();
  
  const available = getAvailableTasks();
  const completed = getCompletedTasks();
  const completionRate = getCompletionRate();
  
  return (
    <div className="p-4 space-y-4">
      {/* Progress Section */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">Your Progress</span>
          </div>
          <span className="text-sm font-bold text-blue-600">{Math.round(completionRate)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-2">
          {completed.length} of {available.length + completed.length} tasks completed
        </p>
      </div>
      
      {/* Available Tasks */}
      {available.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Available Tasks</h3>
          <div className="space-y-2">
            {available.map(task => (
              <button
                key={task.id}
                onClick={() => startTask(task.id)}
                className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 hover:border-blue-300"
              >
                <div className="flex items-start gap-3">
                  <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900">{task.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{task.estimatedTime} min</span>
                      </div>
                      {task.prerequisites && task.prerequisites.length > 0 && (
                        <span className="text-gray-400">
                          Requires {task.prerequisites.length} task(s)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Completed Tasks */}
      {completed.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Completed Tasks</h3>
          <div className="space-y-2">
            {completed.map(task => (
              <div
                key={task.id}
                className="w-full p-3 bg-green-50 rounded-lg border border-green-200"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{task.title}</h4>
                    <p className="text-xs text-gray-600 mt-1 line-through opacity-60">{task.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Complete */}
      {available.length === 0 && completed.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="font-semibold text-gray-900">Congratulations! 🎉</p>
          <p className="text-sm text-gray-600 mt-1">You've completed all available tasks!</p>
        </div>
      )}
    </div>
  );
}

