"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Camera, 
  Video, 
  Globe, 
  Mail, 
  Share2, 
  FileText, 
  TrendingUp, 
  Users,
  Megaphone,
  Zap,
  Target,
  Award
} from "lucide-react";
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
import { MarketingShowcaseProps, defaultMarketingShowcaseProps } from "./index";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import useWebsiteStore from "@/stores/websiteStore";
import { marketingShowcaseDetails } from "./index";

const iconMap: { [key: number]: React.ElementType } = {
  0: Camera,
  1: Video,
  2: Globe,
  3: Mail,
  4: Share2,
  5: FileText,
  6: TrendingUp,
  7: Users,
  8: Megaphone,
  9: Zap,
  10: Target,
  11: Award,
};

const MarketingShowcaseEdit: React.FC<EditorialComponentProps> = ({ id }) => {
  const [componentProps, setComponentProps] = useState<MarketingShowcaseProps>(defaultMarketingShowcaseProps);

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
  const propsWithDefaults = { ...defaultMarketingShowcaseProps, ...componentProps };

  // Ensure textArray is never empty
  const safeTextArray = propsWithDefaults.textArray.length > 0 ? propsWithDefaults.textArray : defaultMarketingShowcaseProps.textArray;

  // Safe color fallbacks
  const safeTextColor = propsWithDefaults.textColor ?? defaultMarketingShowcaseProps.textColor;
  const safeBaseBgColor = propsWithDefaults.baseBgColor ?? defaultMarketingShowcaseProps.baseBgColor;
  const safeMainColor = propsWithDefaults.mainColor ?? defaultMarketingShowcaseProps.mainColor;
  const safeBgLayout = propsWithDefaults.bgLayout ?? defaultMarketingShowcaseProps.bgLayout;

  const colors = deriveColorPalette(
    { textColor: safeTextColor, baseBgColor: safeBaseBgColor, mainColor: safeMainColor, bgLayout: safeBgLayout },
    safeBgLayout.type
  );

  const onClick = () => {
    handleComponentClick({
      currentComponent: currentComponent!,
      componentDetails: marketingShowcaseDetails,
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

  const updateProp = <K extends keyof MarketingShowcaseProps>(
    key: K,
    value: MarketingShowcaseProps[K]
  ) => {
    setComponentProps(prev => ({ ...prev, [key]: value }));
    updateComponentProps(currentPageSlug, id, { [key]: value });
  };

  useSyncLlmOutput(
    currentComponent?.name,
    "MarketingShowcase",
    setComponentProps,
    LlmCurrentTextOutput,
    setLlmCurrentTextOutput,
    marketingShowcaseDetails.editableFields
  );

  useSyncColorEdits(
    currentComponent?.name,
    "MarketingShowcase",
    setComponentProps,
    currentColorEdits
  );

  useSyncPageDataToComponent(
    id,
    "MarketingShowcase",
    setComponentProps,
  );

  return (
    <motion.section
      onClick={onClick}
      ref={sectionRef}
      className="py-20 px-6 cursor-pointer"
      style={{ background: useAnimatedGradient(safeBgLayout, colors) }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <EditableTextField
            value={propsWithDefaults.title ?? ""}
            onChange={val => updateProp("title", val)}
            className="text-4xl sm:text-5xl font-bold mb-4 w-full"
            style={{
              backgroundImage: `linear-gradient(to bottom right, ${colors.lightAccent}, ${colors.darkAccent})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
            fieldKey="title"
            componentId={id}
          />

          {propsWithDefaults.subTitle && (
            <EditableTextField
              value={propsWithDefaults.subTitle ?? ""}
              onChange={val => updateProp("subTitle", val)}
              className="text-xl md:text-2xl font-semibold mb-4 w-full"
              style={{ color: colors.accentColor }}
              fieldKey="subTitle"
              componentId={id}
            />
          )}

          {propsWithDefaults.description && (
            <EditableTextField
              value={propsWithDefaults.description ?? ""}
              onChange={val => updateProp("description", val)}
              className="text-base md:text-lg max-w-3xl mx-auto w-full"
              style={{ color: colors.textColor, opacity: 0.8 }}
              isTextarea
              fieldKey="description"
              componentId={id}
            />
          )}
        </div>

        {/* Marketing Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {safeTextArray.map((service, idx) => {
            const Icon = iconMap[idx % Object.keys(iconMap).length];
            
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className="relative group"
              >
                <div className="h-full bg-white rounded-2xl p-6 shadow-md border-2 border-transparent hover:border-current transition-all">
                  {/* Icon Container */}
                  <div className="relative mb-4">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center shadow-md"
                      style={{ 
                        background: `linear-gradient(135deg, ${colors.lightAccent}, ${colors.darkAccent})` 
                      }}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Title */}
                  <EditableTextField
                    className="text-lg font-bold mb-2 w-full"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${colors.lightAccent}, ${colors.darkAccent})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                    fieldKey={`textArray[${idx}].title`}
                    componentId={id}
                    value={service.title}
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
                    className="text-sm leading-relaxed w-full"
                    style={{ color: colors.textColor, opacity: 0.75 }}
                    fieldKey={`textArray[${idx}].description`}
                    componentId={id}
                    value={service.description}
                    onChange={(val) => {
                      const newArray = [...safeTextArray];
                      newArray[idx] = {
                        ...newArray[idx],
                        description: val,
                      };
                      updateProp("textArray", newArray);
                    }}
                    isTextarea
                  />

                  {/* Checkmark Badge */}
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors.accentColor }}
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p
            className="text-lg font-semibold"
            style={{ color: colors.textColor }}
          >
            Everything you need for maximum visibility and impact
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default MarketingShowcaseEdit;