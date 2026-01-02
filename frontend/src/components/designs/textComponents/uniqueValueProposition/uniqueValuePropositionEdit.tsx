"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
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
import { UniqueValuePropositionProps, defaultUniqueValuePropositionProps } from "./index";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import useWebsiteStore from "@/stores/websiteStore";
import { uniqueValuePropositionDetails } from "./index";
import ImageField from "@/components/editor/imageField/imageField";

const UniqueValuePropositionEdit: React.FC<EditorialComponentProps> = ({ id }) => {
  const [componentProps, setComponentProps] = useState<UniqueValuePropositionProps>(defaultUniqueValuePropositionProps);

  const {
    setCurrentComponent,
    currentComponent,
    setAssistantMessage,
    LlmCurrentTextOutput,
    setLlmCurrentTextOutput,
    currentColorEdits,
    setCurrentColorEdits
  } = useComponentEditor();

  const sectionRef = useRef(null);
  const updateComponentProps = useWebsiteStore((state) => state.updateComponentProps);
  const currentPageSlug = useWebsiteStore((state) => state.currentPageSlug);

  // Merge with defaults to ensure all required props exist
  const propsWithDefaults = { ...defaultUniqueValuePropositionProps, ...componentProps };

  // Ensure textArray is never empty
  const safeTextArray = propsWithDefaults.textArray.length > 0 ? propsWithDefaults.textArray : defaultUniqueValuePropositionProps.textArray;

  // Safe color fallbacks
  const safeTextColor = propsWithDefaults.textColor ?? defaultUniqueValuePropositionProps.textColor;
  const safeBaseBgColor = propsWithDefaults.baseBgColor ?? defaultUniqueValuePropositionProps.baseBgColor;
  const safeMainColor = propsWithDefaults.mainColor ?? defaultUniqueValuePropositionProps.mainColor;
  const safeBgLayout = propsWithDefaults.bgLayout ?? defaultUniqueValuePropositionProps.bgLayout;

  const colors = deriveColorPalette(
    { textColor: safeTextColor, baseBgColor: safeBaseBgColor, mainColor: safeMainColor, bgLayout: safeBgLayout },
    safeBgLayout.type
  );

  const onClick = () => {
    handleComponentClick({
      currentComponent: currentComponent!,
      componentDetails: uniqueValuePropositionDetails,
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

  const updateProp = <K extends keyof UniqueValuePropositionProps>(
    key: K,
    value: UniqueValuePropositionProps[K]
  ) => {
    setComponentProps(prev => ({ ...prev, [key]: value }));
    updateComponentProps(currentPageSlug, id, { [key]: value });
  };

  useSyncLlmOutput(
    currentComponent?.name,
    "UniqueValueProposition",
    setComponentProps,
    LlmCurrentTextOutput,
    setLlmCurrentTextOutput,
    uniqueValuePropositionDetails.editableFields
  );

  useSyncColorEdits(
    currentComponent?.name,
    "UniqueValueProposition",
    setComponentProps,
    currentColorEdits
  );

  useSyncPageDataToComponent(
    id,
    "UniqueValueProposition",
    setComponentProps,
  );

  const iconKeys = ['icon1', 'icon2', 'icon3', 'icon4', 'icon5', 'icon6'] as const;

  return (
    <motion.section
      onClick={onClick}
      ref={sectionRef}
      style={{ background: useAnimatedGradient(colors.bgLayout, colors) }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="w-full py-20 px-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 flex flex-col">
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
            className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent"
            onChange={val => updateProp("title", val)}
            isTextarea
            fieldKey="title"
            componentId={id}
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {safeTextArray.map((item, idx) => {
            const iconKey = iconKeys[idx % iconKeys.length];
            const icon = propsWithDefaults.images?.[iconKey] ?? defaultUniqueValuePropositionProps.images[iconKey];

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
                className="flex flex-col items-center text-center p-8 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200/50 shadow-lg"
              >
                {/* Icon */}
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${colors.lightAccent}, ${colors.darkAccent})`
                  }}
                >
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                    <ImageField
                      componentId={id}
                      fieldKey={`images.${iconKey}`}
                      value={icon!}
                      onChange={(val) =>
                        updateProp("images", {
                          ...propsWithDefaults.images,
                          [iconKey]: val,
                        })
                      }
                      className="w-10 h-10"
                      rounded={false}
                    />
                  </div>
                </div>

                {/* Title */}
                <EditableTextField
                  className="text-2xl font-bold mb-4 w-full"
                  fieldKey={`textArray[${idx}].title`}
                  componentId={id}
                  style={{
                    backgroundImage: `linear-gradient(to right, ${colors.lightAccent}, ${colors.darkAccent})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                  value={item.title}
                  onChange={(val) => {
                    const newArray = [...safeTextArray];
                    newArray[idx] = {
                      ...newArray[idx],
                      title: val,
                    };
                    updateProp("textArray", newArray);
                  }}
                />

                {/* Description */}
                <EditableTextField
                  className="text-base leading-relaxed w-full"
                  fieldKey={`textArray[${idx}].description`}
                  componentId={id}
                  value={item.description}
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
                    color: safeTextColor
                  }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};

export default UniqueValuePropositionEdit;