"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { EditorialComponentProps } from "@/types/editorial";
import { useComponentEditor } from "@/context/context";
import {
  handleComponentClick,
  useSyncLlmOutput,
  useSyncColorEdits,
  useSyncPageDataToComponent
} from '../../../../lib/hooks/hooks';
import EditableTextField from "@/components/editor/editableTextField/editableTextArea";
import { SplitScreenHeroProps, defaultSplitScreenHeroProps } from "./index";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import useWebsiteStore from "@/stores/websiteStore";
import { splitScreenHeroDetails } from "./index";
import ImageField from "@/components/editor/imageField/imageField";

const SplitScreenHeroEdit: React.FC<EditorialComponentProps> = ({ id }) => {
  const [componentProps, setComponentProps] = useState<SplitScreenHeroProps>(defaultSplitScreenHeroProps);

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
  const propsWithDefaults = { ...defaultSplitScreenHeroProps, ...componentProps };

  // Ensure textArray is never empty
  const safeTextArray = propsWithDefaults.textArray.length > 0 ? propsWithDefaults.textArray : defaultSplitScreenHeroProps.textArray;

  // Safe color fallbacks
  const safeTextColor = propsWithDefaults.textColor ?? defaultSplitScreenHeroProps.textColor;
  const safeBaseBgColor = propsWithDefaults.baseBgColor ?? defaultSplitScreenHeroProps.baseBgColor;
  const safeMainColor = propsWithDefaults.mainColor ?? defaultSplitScreenHeroProps.mainColor;
  const safeBgLayout = propsWithDefaults.bgLayout ?? defaultSplitScreenHeroProps.bgLayout;

  const colors = deriveColorPalette(
    { textColor: safeTextColor, baseBgColor: safeBaseBgColor, mainColor: safeMainColor, bgLayout: safeBgLayout },
    safeBgLayout.type
  );

  const onClick = () => {
    handleComponentClick({
      currentComponent: currentComponent!,
      componentDetails: splitScreenHeroDetails,
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

  const updateProp = <K extends keyof SplitScreenHeroProps>(
    key: K,
    value: SplitScreenHeroProps[K]
  ) => {
    setComponentProps(prev => ({ ...prev, [key]: value }));
    updateComponentProps(currentPageSlug, id, { [key]: value });
  };

  useSyncLlmOutput(
    currentComponent?.name,
    "SplitScreenHero",
    setComponentProps,
    LlmCurrentTextOutput,
    setLlmCurrentTextOutput,
    splitScreenHeroDetails.editableFields
  );

  useSyncColorEdits(
    currentComponent?.name,
    "SplitScreenHero",
    setComponentProps,
    currentColorEdits
  );

  useSyncPageDataToComponent(
    id,
    "SplitScreenHero",
    setComponentProps,
  );

  return (
    <section 
      onClick={onClick}
      ref={sectionRef}
      className="relative w-full h-screen flex flex-col md:flex-row overflow-hidden cursor-pointer"
    >
      {/* Left Side - Agent Profile */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-16 relative"
        style={{ background: useAnimatedGradient(safeBgLayout, colors) }}
      >
        {/* Agent Photo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative mb-8"
        >
          <ImageField
            componentId={id}
            fieldKey="images.agent"
            value={propsWithDefaults.images?.agent! ?? defaultSplitScreenHeroProps.images.agent!}
            onChange={(val) =>
              updateProp("images", {
                ...propsWithDefaults.images,
                agent: val,
              })
            }
            className="w-48 h-48 md:w-64 md:h-64 border-4 shadow-2xl"
            style={{ borderColor: colors.accentColor }}
            rounded={true}
          />
          {/* Decorative ring */}
          <div 
            className="absolute inset-0 w-48 h-48 md:w-64 md:h-64 rounded-full border-2 border-dashed animate-spin-slow pointer-events-none"
            style={{ borderColor: `${colors.accentColor}60`, animationDuration: '20s' }}
          />
        </motion.div>

        {/* Agent Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center max-w-md"
        >
          <EditableTextField
            value={propsWithDefaults.title ?? ""}
            onChange={val => updateProp("title", val)}
            className="text-4xl md:text-5xl font-bold mb-3 w-full"
            style={{
              backgroundImage: `linear-gradient(to right, ${colors.lightAccent}, ${colors.darkAccent})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
            fieldKey="title"
            componentId={id}
          />

          <EditableTextField
            value={propsWithDefaults.subTitle ?? ""}
            onChange={val => updateProp("subTitle", val)}
            className="text-xl md:text-2xl mb-4 font-medium w-full"
            style={{ color: colors.textColor, opacity: 0.9 }}
            fieldKey="subTitle"
            componentId={id}
          />

          <EditableTextField
            value={propsWithDefaults.description ?? ""}
            onChange={val => updateProp("description", val)}
            className="text-base md:text-lg mb-8 leading-relaxed w-full"
            style={{ color: colors.textColor, opacity: 0.8 }}
            isTextarea
            fieldKey="description"
            componentId={id}
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {safeTextArray.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 + idx * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border"
                style={{ borderColor: `${colors.accentColor}40` }}
              >
                <EditableTextField
                  className="text-2xl md:text-3xl font-bold mb-1 w-full"
                  style={{ color: colors.accentColor }}
                  fieldKey={`textArray[${idx}].title`}
                  componentId={id}
                  value={stat.title}
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
                  className="text-xs md:text-sm font-medium w-full"
                  style={{ color: colors.textColor, opacity: 0.8 }}
                  fieldKey={`textArray[${idx}].description`}
                  componentId={id}
                  value={stat.description}
                  onChange={(val) => {
                    const newArray = [...safeTextArray];
                    newArray[idx] = {
                      ...newArray[idx],
                      description: val,
                    };
                    updateProp("textArray", newArray);
                  }}
                />
              </motion.div>
            ))}
          </div>

          {/* CTA Button */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="px-8 py-4 rounded-full font-bold text-lg shadow-lg"
            style={{
              backgroundColor: colors.accentColor,
              color: colors.baseBgColor,
            }}
          >
            <EditableTextField
              value={propsWithDefaults.buttonText ?? ""}
              onChange={val => updateProp("buttonText", val)}
              fieldKey="buttonText"
              componentId={id}
            />
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Right Side - Property Showcase */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full md:w-1/2 relative h-screen "
      >
        <ImageField
          componentId={id}
          fieldKey="images.property"
          value={propsWithDefaults.images?.property! ?? defaultSplitScreenHeroProps.images.property!}
          onChange={(val) =>
            updateProp("images", {
              ...propsWithDefaults.images,
              property: val,
            })
          }
          className="w-full h-screen"
          rounded={false}
          objectCover
        />
        {/* Gradient Overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to left, transparent, ${colors.baseBgColor}15)`,
          }}
        />
      </motion.div>

      {/* Center Divider Line (Desktop) */}
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 z-10 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, transparent, ${colors.accentColor}, transparent)`,
        }}
      />
    </section>
  );
};

export default SplitScreenHeroEdit;