"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { EditorialComponentProps } from "@/types/editorial";
import { useComponentEditor } from "@/context/context";
import {
  handleComponentClick,
  useSyncLlmOutput,
  useSyncColorEdits,
  extractTextProps,
  useSyncPageDataToComponent
} from '../../../../lib/hooks/hooks';
import EditableTextField from "@/components/editor/editableTextField/editableTextArea";
import { ProcessStepsProps, defaultProcessStepsProps } from "./index";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import useWebsiteStore from "@/stores/websiteStore";
import { processStepsDetails } from "./index";

const ProcessStepsEdit: React.FC<EditorialComponentProps> = ({ id }) => {
  const [componentProps, setComponentProps] = useState<ProcessStepsProps>(defaultProcessStepsProps);

  const {
    setCurrentComponent,
    currentComponent,
    setAssistantMessage,
    assistantIsEditing,
    LlmCurrentTextOutput,
    setLlmCurrentTextOutput,
    setAssistantIsEditing,
    currentColorEdits,
    setCurrentColorEdits
  } = useComponentEditor();

  const sectionRef = useRef(null);
  const updateComponentProps = useWebsiteStore((state) => state.updateComponentProps);
  const currentPageSlug = useWebsiteStore((state) => state.currentPageSlug);

  // Merge with defaults to ensure all required props exist
  const propsWithDefaults = { ...defaultProcessStepsProps, ...componentProps };

  // Ensure textArray is never empty
  const safeTextArray = propsWithDefaults.textArray.length > 0 ? propsWithDefaults.textArray : defaultProcessStepsProps.textArray;

  // Safe color fallbacks
  const safeTextColor = propsWithDefaults.textColor ?? defaultProcessStepsProps.textColor;
  const safeBaseBgColor = propsWithDefaults.baseBgColor ?? defaultProcessStepsProps.baseBgColor;
  const safeMainColor = propsWithDefaults.mainColor ?? defaultProcessStepsProps.mainColor;
  const safeBgLayout = propsWithDefaults.bgLayout ?? defaultProcessStepsProps.bgLayout;

  const colors = deriveColorPalette(
    { textColor: safeTextColor, baseBgColor: safeBaseBgColor, mainColor: safeMainColor, bgLayout: safeBgLayout },
    safeBgLayout.type
  );

  const onClick = () => {
    handleComponentClick({
      currentComponent: currentComponent!,
      componentDetails: processStepsDetails,
      setCurrentComponent,
      setAssistantMessage
    });

    setCurrentColorEdits({
      textColor: colors.textColor,
      baseBgColor: colors.baseBgColor,
      mainColor: colors.mainColor,
      bgLayout: colors.bgLayout
    });
  };

  const updateProp = <K extends keyof ProcessStepsProps>(
    key: K,
    value: ProcessStepsProps[K]
  ) => {
    setComponentProps(prev => ({ ...prev, [key]: value }));
    updateComponentProps(currentPageSlug, id, { [key]: value });
  };

  useSyncLlmOutput(
    currentComponent?.name,
    "ProcessSteps",
    setComponentProps,
    LlmCurrentTextOutput,
    setLlmCurrentTextOutput,
    processStepsDetails.editableFields
  );

  useSyncColorEdits(
    currentComponent?.name,
    "ProcessSteps",
    setComponentProps,
    currentColorEdits
  );

  useSyncPageDataToComponent(
    id,
    "ProcessSteps",
    setComponentProps,
  );

  return (
    <motion.section
      onClick={onClick}
      ref={sectionRef}
      style={{ background: useAnimatedGradient(safeBgLayout, colors) }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="w-full py-20 px-6"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          {propsWithDefaults.subTitle && (
            <EditableTextField
              value={propsWithDefaults.subTitle ?? ""}
              onChange={val => updateProp("subTitle", val)}
              style={{ color: colors.accentColor }}
              className="text-sm font-semibold uppercase tracking-wide mb-2"
              fieldKey="subTitle"
              componentId={id}
            />
          )}

          <EditableTextField
            value={propsWithDefaults.title ?? ""}
            style={{
              backgroundImage: `linear-gradient(to bottom right, ${colors.lightAccent}, ${colors.darkAccent})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
            className="text-4xl sm:text-5xl font-bold mb-6 bg-clip-text text-transparent"
            onChange={val => updateProp("title", val)}
            isTextarea
            fieldKey="title"
            componentId={id}
          />

          {propsWithDefaults.description && (
            <EditableTextField
              className="text-lg max-w-2xl mx-auto w-full"
              fieldKey="description"
              componentId={id}
              value={propsWithDefaults.description ?? ""}
              onChange={val => updateProp("description", val)}
              isTextarea
              style={{
                color: safeTextColor
              }}
            />
          )}
        </div>

        {/* Timeline Steps */}
        <div className="relative">
          {/* Connecting Line - hidden on mobile, visible on md+ */}
          <div 
            className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2"
            style={{
              background: `linear-gradient(to bottom, ${colors.lightAccent}, ${colors.darkAccent})`
            }}
          />

          {/* Steps */}
          <div className="space-y-12">
            {safeTextArray.map((step, idx) => {
              const isEven = idx % 2 === 0;
              
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className={`flex flex-col md:flex-row items-center gap-6 ${
                    isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Content Card */}
                  <div className={`w-full md:w-5/12 ${isEven ? 'md:text-right' : 'md:text-left'} text-center`}>
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50">
                      <EditableTextField
                        className="text-2xl font-bold mb-3 w-full"
                        fieldKey={`textArray[${idx}].title`}
                        componentId={id}
                        style={{
                          backgroundImage: `linear-gradient(to right, ${colors.lightAccent}, ${colors.darkAccent})`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                        value={step.title}
                        onChange={(val) => {
                          const newArray = [...safeTextArray];
                          newArray[idx] = {
                            ...newArray[idx],
                            title: val,
                          };
                          updateProp("textArray", newArray);
                        }}
                      />

                      <EditableTextField
                        className="text-base leading-relaxed w-full"
                        fieldKey={`textArray[${idx}].description`}
                        componentId={id}
                        value={step.description}
                        onChange={(val) => {
                          const newArray = [...safeTextArray];
                          newArray[idx] = {
                            ...newArray[idx],
                            description: val,
                          };
                          updateProp("textArray", newArray);
                        }}
                        isTextarea
                        style={{
                          color: componentProps.textColor
                        }}
                      />
                    </div>
                  </div>

                  {/* Step Number Circle */}
                  <div className="relative flex items-center justify-center md:w-2/12 z-10">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.1 + 0.2 }}
                      className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl border-4 border-white"
                      style={{
                        background: `linear-gradient(135deg, ${colors.lightAccent}, ${colors.darkAccent})`
                      }}
                    >
                      <span className="text-white text-2xl font-bold">
                        {idx + 1}
                      </span>
                    </motion.div>
                  </div>

                  {/* Empty space for layout balance on desktop */}
                  <div className="hidden md:block md:w-5/12" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default ProcessStepsEdit;