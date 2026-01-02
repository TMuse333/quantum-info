import React from 'react';
import { Palette, FileText, HelpCircle, Settings, Plus } from 'lucide-react';
import type { ModeOption } from './types';

/**
 * Mode Options Configuration
 * 
 * Defines the available chat modes for the website assistant.
 * This is static and doesn't need to be updated by the parent project.
 */
export const MODE_OPTIONS: ModeOption[] = [
  {
    id: 'colors',
    label: 'Edit Colors',
    icon: React.createElement(Palette, { className: "w-5 h-5" }),
    description: 'Change colors and styles',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'text',
    label: 'Edit Text',
    icon: React.createElement(FileText, { className: "w-5 h-5" }),
    description: 'Update content and copy',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'general',
    label: 'General Question',
    icon: React.createElement(HelpCircle, { className: "w-5 h-5" }),
    description: 'Ask about website building',
    collection: 'general-website-knowledge',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'modify-component',
    label: 'Modify Component',
    icon: React.createElement(Settings, { className: "w-5 h-5" }),
    description: 'Change component structure',
    collection: 'component-knowledge',
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'new-component',
    label: 'Make New Component',
    icon: React.createElement(Plus, { className: "w-5 h-5" }),
    description: 'Create a new component',
    collection: 'component-knowledge',
    color: 'from-indigo-500 to-purple-500',
  },
];
