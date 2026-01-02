/**
 * ModeSelector Component
 * Displays mode selection buttons
 */

import React from 'react';
import { MODE_OPTIONS } from './constants';
import type { ChatMode } from './types';

interface ModeSelectorProps {
  selectedMode: ChatMode;
  onModeSelect: (mode: ChatMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ selectedMode, onModeSelect }) => {
  if (selectedMode !== null) return null;

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MODE_OPTIONS.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeSelect(mode.id)}
            className={`bg-gradient-to-r ${mode.color} text-white rounded-xl p-4 hover:shadow-lg transition-all transform hover:scale-[1.02] text-left group`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                {mode.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">{mode.label}</h3>
                <p className="text-xs text-white/80">{mode.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

