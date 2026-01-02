export type TaskCategory = 'editing' | 'saving' | 'versioning' | 'onboarding';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  instructions: string[];
  completed?: boolean;
  llmPrompt?: string; // Optional: For dynamic LLM-generated guidance
  relatedTab?: 'editor' | 'assistant' | 'versions'; // Which tab this task relates to
  prerequisites?: string[]; // Task IDs that must be completed first
  estimatedTime?: number; // In minutes
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

// Additional metadata for task tracking
export interface TaskProgress {
  taskId: string;
  startedAt?: Date;
  completedAt?: Date;
  attempts: number;
  lastAttemptAt?: Date;
  userNotes?: string;
}

export interface TaskCompletion {
  taskId: string;
  completed: boolean;
  completedAt: Date;
  timeSpent?: number; // In seconds
}

