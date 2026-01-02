import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, TaskProgress } from '@/types/helperBot';
import { CORE_TASKS } from '@/data/helperBotTasks';

interface HelperBotState {
  // Task Management
  tasks: Task[];
  completedTasks: Set<string>;
  taskProgress: Map<string, TaskProgress>;
  currentTask: Task | null;
  
  // UI State
  isOpen: boolean;
  activeTab: 'editor' | 'assistant' | 'versions' | null;
  showWelcome: boolean;
  dismissedTasks: Set<string>;
  
  // Tab Introductions (track which tabs have been introduced)
  tabIntroductions: {
    editor: boolean;
    assistant: boolean;
    versions: boolean;
  };
  
  // Actions - Task Management
  initializeTasks: () => void;
  startTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  resetTask: (taskId: string) => void;
  getTask: (taskId: string) => Task | undefined;
  getAvailableTasks: () => Task[];
  getCompletedTasks: () => Task[];
  getTaskProgress: (taskId: string) => TaskProgress | undefined;
  
  // Actions - UI State
  openHelperBot: () => void;
  closeHelperBot: () => void;
  setCurrentTask: (task: Task | null) => void;
  setActiveTab: (tab: 'editor' | 'assistant' | 'versions' | null) => void;
  dismissTask: (taskId: string) => void;
  
  // Actions - Tab Introductions
  markTabIntroduced: (tab: 'editor' | 'assistant' | 'versions') => void;
  shouldShowTabIntroduction: (tab: 'editor' | 'assistant' | 'versions') => boolean;
  
  // Actions - Progress Tracking
  updateTaskProgress: (taskId: string, progress: Partial<TaskProgress>) => void;
  getCompletionRate: () => number; // Percentage of tasks completed
  getNextRecommendedTask: () => Task | null;
}

// Custom storage for Sets and Maps
const customStorage = {
  getItem: (name: string) => {
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string) => {
    localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name);
  }
} as const;

export const useHelperBotStore = create<HelperBotState>()(
  persist(
    (set, get) => ({
      // Initial State
      tasks: CORE_TASKS,
      completedTasks: new Set(),
      taskProgress: new Map(),
      currentTask: null,
      isOpen: false,
      activeTab: null,
      showWelcome: true,
      dismissedTasks: new Set(),
      tabIntroductions: {
        editor: false,
        assistant: false,
        versions: false
      },
      
      // Initialize tasks from data
      initializeTasks: () => {
        // This is handled by persist middleware
      },
      
      // Task Management Actions
      startTask: (taskId: string) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const existingProgress = get().taskProgress.get(taskId);
        const progress: TaskProgress = {
          taskId,
          startedAt: existingProgress?.startedAt || new Date(),
          attempts: (existingProgress?.attempts || 0) + 1,
          lastAttemptAt: new Date()
        };
        
        set((state) => {
          const newProgress = new Map(state.taskProgress);
          newProgress.set(taskId, progress);
          return {
            taskProgress: newProgress,
            currentTask: task,
            isOpen: true
          };
        });
      },
      
      completeTask: (taskId: string) => {
        set((state) => {
          const newCompleted = new Set(state.completedTasks);
          newCompleted.add(taskId);
          
          const progress = state.taskProgress.get(taskId);
          const updatedProgress: TaskProgress = {
            ...progress!,
            taskId,
            completedAt: new Date()
          };
          
          const newProgress = new Map(state.taskProgress);
          newProgress.set(taskId, updatedProgress);
          
          return {
            completedTasks: newCompleted,
            taskProgress: newProgress,
            currentTask: state.currentTask?.id === taskId ? null : state.currentTask
          };
        });
      },
      
      resetTask: (taskId: string) => {
        set((state) => {
          const newCompleted = new Set(state.completedTasks);
          newCompleted.delete(taskId);
          
          const newProgress = new Map(state.taskProgress);
          newProgress.delete(taskId);
          
          return {
            completedTasks: newCompleted,
            taskProgress: newProgress
          };
        });
      },
      
      getTask: (taskId: string) => {
        return get().tasks.find(t => t.id === taskId);
      },
      
      getAvailableTasks: () => {
        const state = get();
        return state.tasks.filter(task => {
          // Check if prerequisites are met
          if (task.prerequisites && task.prerequisites.length > 0) {
            return task.prerequisites.every(prereqId => 
              state.completedTasks.has(prereqId)
            );
          }
          return true;
        }).filter(task => !state.completedTasks.has(task.id));
      },
      
      getCompletedTasks: () => {
        const state = get();
        return state.tasks.filter(task => 
          state.completedTasks.has(task.id)
        );
      },
      
      getTaskProgress: (taskId: string) => {
        return get().taskProgress.get(taskId);
      },
      
      // UI State Actions
      openHelperBot: () => set({ isOpen: true }),
      closeHelperBot: () => set({ isOpen: false, currentTask: null }),
      setCurrentTask: (task) => set({ currentTask: task }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      dismissTask: (taskId: string) => {
        set((state) => {
          const newDismissed = new Set(state.dismissedTasks);
          newDismissed.add(taskId);
          return { dismissedTasks: newDismissed };
        });
      },
      
      // Tab Introduction Actions
      markTabIntroduced: (tab) => {
        set((state) => ({
          tabIntroductions: {
            ...state.tabIntroductions,
            [tab]: true
          }
        }));
      },
      
      shouldShowTabIntroduction: (tab) => {
        const state = get();
        return !state.tabIntroductions[tab];
      },
      
      // Progress Tracking
      updateTaskProgress: (taskId: string, progress: Partial<TaskProgress>) => {
        set((state) => {
          const existing = state.taskProgress.get(taskId) || {
            taskId,
            attempts: 0
          };
          const updated: TaskProgress = { ...existing, ...progress };
          const newProgress = new Map(state.taskProgress);
          newProgress.set(taskId, updated);
          return { taskProgress: newProgress };
        });
      },
      
      getCompletionRate: () => {
        const state = get();
        if (state.tasks.length === 0) return 0;
        return (state.completedTasks.size / state.tasks.length) * 100;
      },
      
      getNextRecommendedTask: () => {
        const available = get().getAvailableTasks();
        if (available.length === 0) return null;
        
        // Prioritize tasks with no prerequisites or all prerequisites met
        // Sort by difficulty (beginner first) and estimated time
        return available.sort((a, b) => {
          const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };
          const diff = difficultyOrder[a.difficulty || 'beginner'] - difficultyOrder[b.difficulty || 'beginner'];
          if (diff !== 0) return diff;
          return (a.estimatedTime || 0) - (b.estimatedTime || 0);
        })[0];
      }
    }),
    {
      name: 'helper-bot-store',
      storage: customStorage as any,
      partialize: (state) => ({
        completedTasks: Array.from(state.completedTasks),
        taskProgress: Array.from(state.taskProgress.entries()),
        dismissedTasks: Array.from(state.dismissedTasks),
        tabIntroductions: state.tabIntroductions,
        showWelcome: state.showWelcome
      }),
      // Custom merge function to handle Sets and Maps
      merge: (persistedState: any, currentState: HelperBotState) => {
        if (!persistedState) return currentState;
        return {
          ...currentState,
          ...persistedState,
          completedTasks: persistedState.completedTasks 
            ? new Set(persistedState.completedTasks) 
            : new Set(),
          taskProgress: persistedState.taskProgress 
            ? new Map(persistedState.taskProgress) 
            : new Map(),
          dismissedTasks: persistedState.dismissedTasks 
            ? new Set(persistedState.dismissedTasks) 
            : new Set()
        };
      }
    }
  )
);

