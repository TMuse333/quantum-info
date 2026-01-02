import React from 'react';
import { FileText, Palette, Code } from 'lucide-react';

// Simple legend for edit types
const EditTypeLegend: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <p className="text-xs font-semibold text-blue-900 mb-2">💡 I can help with:</p>
      <div className="text-xs text-blue-800 space-y-1.5">
        <div className="flex items-center gap-2">
          <FileText className="w-3 h-3" />
          <span><strong>Text edits</strong> - Change any content on your site</span>
        </div>
        <div className="flex items-center gap-2">
          <Palette className="w-3 h-3" />
          <span><strong>Color edits</strong> - Update colors and styles</span>
        </div>
        <div className="flex items-center gap-2">
          <Code className="w-3 h-3" />
          <span><strong>Structural changes</strong> - Reorder or modify layout</span>
        </div>
      </div>
    </div>
  );
};

export default EditTypeLegend;
