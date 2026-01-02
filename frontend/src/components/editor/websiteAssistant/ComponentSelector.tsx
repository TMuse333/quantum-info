import React, { useMemo } from 'react';
import { Component, ChevronDown } from 'lucide-react';
import type { EditableComponent } from '@/types/editorial';
import { convertToEditableComponent } from './componentDetails';

interface ComponentSelectorProps {
  components: any[];
  onSelect: (component: EditableComponent) => void;
  mode: 'colors' | 'text';
}

/**
 * ComponentSelector Component
 * Allows users to select a component from the page
 */
const ComponentSelector: React.FC<ComponentSelectorProps> = ({ components, onSelect, mode }) => {
  // Sort components by order
  const sortedComponents = useMemo(() => {
    return [...components].sort((a, b) => {
      const orderA = a.order ?? a.props?.order ?? 0;
      const orderB = b.order ?? b.props?.order ?? 0;
      return orderA - orderB;
    });
  }, [components]);

  return (
    <div className="mt-3">
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {sortedComponents.length === 0 ? (
          <p className="text-sm text-gray-500">No components found on this page.</p>
        ) : (
          sortedComponents.map((comp) => {
            const componentName = comp.name || comp.type || `Component ${comp.id}`;
            return (
              <button
                key={comp.id}
                onClick={() => onSelect(convertToEditableComponent(comp))}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all flex items-center gap-3 group"
              >
                <div className="p-2 bg-gray-200 group-hover:bg-gray-300 rounded-lg transition-colors">
                  <Component className="w-4 h-4 text-gray-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{componentName}</p>
                  <p className="text-xs text-gray-500">{comp.type || 'Component'}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors rotate-[-90deg]" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ComponentSelector;
