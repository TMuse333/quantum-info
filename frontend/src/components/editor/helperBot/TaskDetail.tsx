'use client';

import { useHelperBotStore } from '@/stores/helperBotStore';
import { CheckCircle2, ArrowLeft, Sparkles } from 'lucide-react';
import { Task } from '@/types/helperBot';

interface TaskDetailProps {
  task: Task;
}

export function TaskDetail({ task }: TaskDetailProps) {
  const { completeTask, setCurrentTask } = useHelperBotStore();
  
  const handleComplete = () => {
    completeTask(task.id);
    setCurrentTask(null);
  };
  
  return (
    <div className="p-4 space-y-4">
      <button
        onClick={() => setCurrentTask(null)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to Tasks</span>
      </button>
      
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{task.title}</h2>
        <p className="text-gray-600">{task.description}</p>
      </div>
      
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Step-by-Step Instructions</h3>
        </div>
        <ol className="space-y-3">
          {task.instructions.map((instruction, index) => (
            <li key={index} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
              <span className="text-gray-700 flex-1 pt-0.5">{instruction}</span>
            </li>
          ))}
        </ol>
      </div>

      {task.estimatedTime && (
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
          <span className="font-semibold">Estimated time:</span> {task.estimatedTime} minutes
        </div>
      )}
      
      <button
        onClick={handleComplete}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        <CheckCircle2 className="w-5 h-5" />
        Mark as Complete
      </button>
    </div>
  );
}

