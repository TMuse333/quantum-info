// editorComponents/ColorEditor.tsx
"use client";

import { BaseColorProps, GradientConfig, GradientType } from '@/types/editorial';
import { useState } from "react";

interface ColorEditorProps {
  colors: Partial<BaseColorProps>;
  onChange: (colors: Partial<BaseColorProps>) => void;
  availableFields: string[];
}

export default function ColorEditor({ colors, onChange, availableFields }: ColorEditorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const config: GradientConfig = colors.bgLayout || { 
    type: "radial", 
    radialSize: "125% 125%", 
    radialPosition: "50% 0%", 
    radialBaseStop: 50 
  };

  const updateColor = (key: keyof BaseColorProps, value: string) => {
    onChange({ ...colors, [key]: value });
  };

  const updateGradientConfig = (updates: Partial<GradientConfig>) => {
    onChange({ 
      ...colors, 
      bgLayout: { ...config, ...updates } 
    });
  };

  // Parse position values for sliders
  const getPosX = () => parseInt(config.radialPosition?.split(' ')[0] || '50');
  const getPosY = () => parseInt(config.radialPosition?.split(' ')[1] || '0');

  return (
    <div className="space-y-4">
      {/* Gradient Type Selector */}
      {availableFields.includes('bgLayout') && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Background Type</label>
            <select
              value={config.type}
              onChange={(e) => updateGradientConfig({ type: e.target.value as GradientType })}
              className="w-full px-3 py-2 border rounded text-sm bg-white"
            >
              <option value="radial">Radial Gradient</option>
              <option value="linear">Linear Gradient</option>
              <option value="solid">Solid Color</option>
            </select>
          </div>

          {/* Radial Gradient Controls */}
          {config.type === "radial" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Position X: {getPosX()}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={getPosX()}
                  onChange={(e) => {
                    const x = e.target.value;
                    const y = getPosY();
                    updateGradientConfig({ radialPosition: `${x}% ${y}%` });
                  }}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Position Y: {getPosY()}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={getPosY()}
                  onChange={(e) => {
                    const x = getPosX();
                    const y = e.target.value;
                    updateGradientConfig({ radialPosition: `${x}% ${y}%` });
                  }}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Base Color Stop: {config.radialBaseStop || 50}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.radialBaseStop || 50}
                  onChange={(e) => updateGradientConfig({ radialBaseStop: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Advanced radial controls */}
              <div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-blue-600 hover:text-blue-700 underline"
                >
                  {showAdvanced ? "Hide" : "Show"} advanced settings
                </button>
                {showAdvanced && (
                  <input
                    type="text"
                    value={config.radialSize || "125% 125%"}
                    onChange={(e) => updateGradientConfig({ radialSize: e.target.value })}
                    placeholder="125% 125%"
                    className="w-full mt-2 px-2 py-1 border rounded text-sm text-black"
                  />
                )}
              </div>
            </>
          )}

          {/* Linear Gradient Controls */}
          {config.type === "linear" && (
            <div>
              <label className="block text-sm font-medium mb-2">Direction</label>
              <select
                value={config.direction || "to bottom"}
                onChange={(e) => updateGradientConfig({ direction: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm bg-white"
              >
                <option value="to bottom">Top to Bottom ↓</option>
                <option value="to top">Bottom to Top ↑</option>
                <option value="to right">Left to Right →</option>
                <option value="to left">Right to Left ←</option>
                <option value="to bottom right">Diagonal ↘</option>
                <option value="to bottom left">Diagonal ↙</option>
                <option value="to top right">Diagonal ↗</option>
                <option value="to top left">Diagonal ↖</option>
              </select>
            </div>
          )}
        </>
      )}

      {/* Main Color */}
      {availableFields.includes('mainColor') && (
        <div>
          <label className="block text-sm font-medium mb-1">Main Color</label>
          <input
            type="color"
            value={colors.mainColor || '#0000ff'}
            onChange={(e) => updateColor('mainColor', e.target.value)}
            className="w-full h-10 rounded cursor-pointer"
          />
          <input
            type="text"
            value={colors.mainColor || ''}
            onChange={(e) => updateColor('mainColor', e.target.value)}
            placeholder="#0000ff"
            className="w-full mt-1 px-2 py-1 border rounded text-sm text-black"
          />
        </div>
      )}

      {/* Text Color */}
      {availableFields.includes('textColor') && (
        <div>
          <label className="block text-sm font-medium mb-1">Text Color</label>
          <input
            type="color"
            value={colors.textColor || '#000000'}
            onChange={(e) => updateColor('textColor', e.target.value)}
            className="w-full h-10 rounded cursor-pointer"
          />
          <input
            type="text"
            value={colors.textColor || ''}
            onChange={(e) => updateColor('textColor', e.target.value)}
            placeholder="#000000"
            className="w-full mt-1 px-2 py-1 border rounded text-sm text-black"
          />
        </div>
      )}

      {/* Background Color */}
      {availableFields.includes('baseBgColor') && (
        <div>
          <label className="block text-sm font-medium mb-1">Background Color</label>
          <input
            type="color"
            value={colors.baseBgColor || '#ffffff'}
            onChange={(e) => updateColor('baseBgColor', e.target.value)}
            className="w-full h-10 rounded cursor-pointer"
          />
          <input
            type="text"
            value={colors.baseBgColor || ''}
            onChange={(e) => updateColor('baseBgColor', e.target.value)}
            placeholder="#ffffff"
            className="w-full mt-1 px-2 py-1 border rounded text-sm text-black"
          />
        </div>
      )}
    </div>
  );
}