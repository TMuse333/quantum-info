import { Task } from '@/types/helperBot';

export const CORE_TASKS: Task[] = [
  {
    id: 'edit-text',
    title: 'How to Edit Text',
    description: 'Learn how to change text content in your website components',
    category: 'editing',
    instructions: [
      'Click on any text element in your website preview',
      'The text will become editable - type your changes directly',
      'Changes are saved automatically as you type',
      'You can also use the Component Editor panel for more control'
    ],
    completed: false,
    llmPrompt: 'Explain how to edit text in a website component. Be concise and step-by-step.',
    relatedTab: 'editor',
    prerequisites: [],
    estimatedTime: 2,
    difficulty: 'beginner'
  },
  {
    id: 'edit-colors',
    title: 'How to Edit Colors',
    description: 'Change colors and styling of your website components',
    category: 'editing',
    instructions: [
      'Click on a component you want to style',
      'Open the Component Editor panel (click the menu button)',
      'Use the Color Editor section to adjust colors',
      'Changes update in real-time - see them instantly',
      'Try different color combinations to match your brand'
    ],
    completed: false,
    llmPrompt: 'Explain how to change colors in a website component using the Component Editor. Include steps for opening the editor panel.',
    relatedTab: 'editor',
    prerequisites: ['edit-text'], // Should know how to select components first
    estimatedTime: 3,
    difficulty: 'beginner'
  },
  {
    id: 'edit-images',
    title: 'How to Edit Images',
    description: 'Replace and update images in your website',
    category: 'editing',
    instructions: [
      'Click on any image in your website preview',
      'You\'ll see options to upload a new image',
      'Drag and drop an image file, or click to browse',
      'Your new image will replace the old one immediately',
      'Make sure your image is optimized (under 2MB recommended)'
    ],
    completed: false,
    llmPrompt: 'Explain how to change images in a website. Include information about image upload limits and file types.',
    relatedTab: 'editor',
    prerequisites: [],
    estimatedTime: 2,
    difficulty: 'beginner'
  },
  {
    id: 'save-changes',
    title: 'How to Save Your Changes',
    description: 'Save your work and create a version you can revert to',
    category: 'saving',
    instructions: [
      'Click the "Save Changes" button in the top-right corner',
      'Enter a commit message describing what you changed',
      'Click "Confirm" to create a new version',
      'Your changes are now saved and you can revert to this point anytime',
      'Each save creates a new version in your version history'
    ],
    completed: false,
    llmPrompt: 'Explain the save process and why version control is important. Keep it simple and encouraging.',
    relatedTab: 'versions',
    prerequisites: ['edit-text', 'edit-colors'], // Should have made some edits first
    estimatedTime: 2,
    difficulty: 'beginner'
  },
  {
    id: 'version-control',
    title: 'Understanding Version Control',
    description: 'Learn how to view and restore previous versions',
    category: 'versioning',
    instructions: [
      'Open the Version Control panel from the dashboard',
      'You\'ll see a list of all your saved versions',
      'Each version has a commit message describing the changes',
      'Click "Switch to This Version" to view a previous state',
      'You can always return to your current version',
      'Versions are read-only - you can\'t edit them, only view'
    ],
    completed: false,
    llmPrompt: 'Explain version control in simple terms. Help users understand why it\'s useful and how to use it.',
    relatedTab: 'versions',
    prerequisites: ['save-changes'],
    estimatedTime: 3,
    difficulty: 'intermediate'
  }
];

// Tab Introduction Messages
export const TAB_INTRODUCTIONS = {
  editor: {
    title: 'Component Editor',
    message: 'Welcome to the Component Editor! Here you can customize colors, styles, and properties of your selected component. Changes update in real-time.',
    actions: [
      { label: 'Start "Edit Colors" Task', taskId: 'edit-colors' },
      { label: 'Got it, thanks!', action: 'dismiss' }
    ]
  },
  assistant: {
    title: 'AI Assistant',
    message: 'This is your AI Assistant! Ask me anything about editing your website, or use me to make changes with natural language.',
    actions: [
      { label: 'Show me how to edit text', taskId: 'edit-text' },
      { label: 'Got it, thanks!', action: 'dismiss' }
    ]
  },
  versions: {
    title: 'Version Control',
    message: 'Version Control lets you see all your saved versions and switch between them. Each time you save, a new version is created.',
    actions: [
      { label: 'Start "Version Control" Task', taskId: 'version-control' },
      { label: 'Got it, thanks!', action: 'dismiss' }
    ]
  }
};

