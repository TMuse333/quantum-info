// components/editor/editableTextField/editableTextArea.tsx
"use client";

import { AnimatePresence, motion, Variants } from "framer-motion";
import React, { CSSProperties, useEffect, useRef } from "react";
import useWebsiteStore from "@/stores/websiteStore";

interface EditableTextFieldProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  isTextarea?: boolean;
  maxWords?: number;
  style?: CSSProperties;
  fieldKey: string;
  componentId: string;
}

const textVariants: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

const EditableTextField: React.FC<EditableTextFieldProps> = ({
  value,
  onChange,
  placeholder,
  rows = 1,
  className,
  isTextarea = false,
  maxWords,
  style,
  fieldKey,
  componentId,
}) => {
  const internalRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  // Removed updateComponentProps - parent component's updateProp handles the store update

  useEffect(() => {
    if (isTextarea && internalRef.current) {
      const el = internalRef.current as HTMLTextAreaElement;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [value, isTextarea]);

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    let val = e.target.value;

    if (maxWords) {
      const words = val.split(/\s+/).filter(Boolean);
      if (words.length > maxWords) {
        val = words.slice(0, maxWords).join(" ");
      }
    }

    // Only call onChange - the parent component's updateProp will handle the store update
    // This prevents duplicate updateComponentProps calls
    onChange(val);
    
    // NOTE: Removed direct updateComponentProps call here because:
    // 1. The parent component's updateProp already calls updateComponentProps
    // 2. Calling it twice causes "unchanged" warnings
    // 3. The onChange callback is sufficient to trigger the update chain
  };

  return (
    <AnimatePresence mode="wait">
      {isTextarea ? (
        <motion.textarea
          variants={textVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4 }}
          ref={internalRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={handleChange}
          rows={rows}
          className={className}
          placeholder={placeholder}
          style={style}
        />
      ) : (
        <motion.input
          type="text"
          variants={textVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4 }}
          ref={internalRef as React.RefObject<HTMLInputElement>}
          value={value}
          onChange={handleChange}
          className={className}
          placeholder={placeholder}
          style={style}
        />
      )}
    </AnimatePresence>
  );
};

export default EditableTextField;