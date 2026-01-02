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
import { ProfileCredentialsProps, defaultProfileCredentialsProps } from "./index";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import useWebsiteStore from "@/stores/websiteStore";
import { profileCredentialsDetails } from "./index";
import ImageField from "@/components/editor/imageField/imageField";

const ProfileCredentialsEdit: React.FC<EditorialComponentProps> = ({ id }) => {
  const [componentProps, setComponentProps] = useState<ProfileCredentialsProps>(defaultProfileCredentialsProps);

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
  const propsWithDefaults = { ...defaultProfileCredentialsProps, ...componentProps };

  // Ensure textArray is never empty
  const safeTextArray = propsWithDefaults.textArray.length > 0 ? propsWithDefaults.textArray : defaultProfileCredentialsProps.textArray;

  // Safe color fallbacks
  const safeTextColor = propsWithDefaults.textColor ?? defaultProfileCredentialsProps.textColor;
  const safeBaseBgColor = propsWithDefaults.baseBgColor ?? defaultProfileCredentialsProps.baseBgColor;
  const safeMainColor = propsWithDefaults.mainColor ?? defaultProfileCredentialsProps.mainColor;
  const safeBgLayout = propsWithDefaults.bgLayout ?? defaultProfileCredentialsProps.bgLayout;

  const colors = deriveColorPalette(
    { textColor: safeTextColor, baseBgColor: safeBaseBgColor, mainColor: safeMainColor, bgLayout: safeBgLayout },
    safeBgLayout.type
  );

  const onClick = () => {
    handleComponentClick({
      currentComponent: currentComponent!,
      componentDetails: profileCredentialsDetails,
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

  const updateProp = <K extends keyof ProfileCredentialsProps>(
    key: K,
    value: ProfileCredentialsProps[K]
  ) => {
    setComponentProps(prev => ({ ...prev, [key]: value }));
    updateComponentProps(currentPageSlug, id, { [key]: value });
  };

  useSyncLlmOutput(
    currentComponent?.name,
    "ProfileCredentials",
    setComponentProps,
    LlmCurrentTextOutput,
    setLlmCurrentTextOutput,
    profileCredentialsDetails.editableFields
  );

  useSyncColorEdits(
    currentComponent?.name,
    "ProfileCredentials",
    setComponentProps,
    currentColorEdits
  );

  useSyncPageDataToComponent(
    id,
    "ProfileCredentials",
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
        {/* Section Header */}
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
              className="text-lg w-full"
              style={{ color: colors.textColor, opacity: 0.8 }}
              fieldKey="subTitle"
              componentId={id}
            />
          )}
        </div>

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Left Column - Personal Story */}
          <div className="w-full lg:w-1/2">
            {/* Profile Image */}
            <div className="relative mb-8">
              <ImageField
                componentId={id}
                fieldKey="images.profile"
                value={(propsWithDefaults.images?.profile ?? defaultProfileCredentialsProps.images.profile) || { src: "/placeholder.webp", alt: "Profile image" }}
                onChange={(val) =>
                  updateProp("images", {
                    ...propsWithDefaults.images,
                    profile: val,
                  })
                }
                className="w-full aspect-[4/5] max-w-md mx-auto lg:mx-0 border-4 shadow-2xl"
                style={{ borderColor: colors.accentColor }}
                rounded={false}
              />
              {/* Decorative corner accent */}
              <div 
                className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20 blur-2xl pointer-events-none"
                style={{ backgroundColor: colors.accentColor }}
              />
            </div>

            {/* Bio Text */}
            <div className="prose prose-lg max-w-none">
              <EditableTextField
                className="text-base md:text-lg leading-relaxed whitespace-pre-line w-full"
                style={{ color: colors.textColor }}
                value={propsWithDefaults.description ?? ""}
                onChange={val => updateProp("description", val)}
                isTextarea
                fieldKey="description"
                componentId={id}
              />
            </div>
          </div>

          {/* Right Column - Credentials */}
          <div className="w-full lg:w-1/2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {safeTextArray.map((credential, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-l-4 shadow-md"
                  style={{ borderColor: colors.accentColor }}
                >
                  {/* Icon/Badge placeholder */}
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                    style={{ 
                      background: `linear-gradient(135deg, ${colors.lightAccent}, ${colors.darkAccent})` 
                    }}
                  >
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>

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
                    value={credential.title}
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
                    className="text-sm leading-relaxed w-full"
                    style={{ color: colors.textColor, opacity: 0.8 }}
                    fieldKey={`textArray[${idx}].description`}
                    componentId={id}
                    value={credential.description}
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
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default ProfileCredentialsEdit;