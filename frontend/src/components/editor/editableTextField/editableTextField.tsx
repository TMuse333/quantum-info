"use client";

import React, { useState } from "react";

interface EditableTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function EditableTextArea({
  value,
  onChange,
  placeholder,
  className = "",
}: EditableTextAreaProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={className}>
        <textarea
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          className="w-full px-2 py-1 border rounded"
          rows={3}
          autoFocus
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleSave}
            className="px-2 py-1 bg-blue-500 text-white text-sm rounded"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-2 py-1 bg-gray-300 text-sm rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded ${className}`}
    >
      {value || <span className="text-gray-400">{placeholder || "Click to edit"}</span>}
    </div>
  );
}

