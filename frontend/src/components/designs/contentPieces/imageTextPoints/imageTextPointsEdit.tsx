// components/imageTextPoints/imageTextPointsEdit.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { EditorialComponentProps, GradientConfig, GradientType } from "@/types/editorial";
import { defaultImageTextPointsProps, ImageTextPointsProps } from ".";
import { useComponentEditor } from "@/context/context";
import { extractTextProps, handleComponentClick, useSyncColorEdits, useSyncLlmOutput, useSyncPageDataToComponent } from "@/lib/hooks/hooks";
import EditableTextField from "@/components/editor/editableTextField/editableTextArea";
import { imageTextPointsDetails } from ".";
import useWebsiteStore from "@/stores/websiteStore";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import ImageField from "@/components/editor/imageField/imageField";

const ImageTextPointsEdit: React.FC<EditorialComponentProps> = ({ id }) => {
  const [componentProps, setComponentProps] = useState<Partial<ImageTextPointsProps>>({});

  const { setCurrentComponent, currentComponent, setAssistantMessage, LlmCurrentTextOutput, setLlmCurrentTextOutput, currentColorEdits, setCurrentColorEdits } = useComponentEditor();

  const updateComponentProps = useWebsiteStore((state) => state.updateComponentProps);
  const currentPageSlug = useWebsiteStore((state) => state.currentPageSlug);

  const {
    title,
    description,
    buttonText,
    images,
    reverse = false,
    textArray = [],
    textColor,
    baseBgColor,
    mainColor,
    bgLayout,
  } = { ...defaultImageTextPointsProps, ...componentProps };

  const colors = deriveColorPalette({
    textColor: textColor ?? "#FFFFFF",
    baseBgColor: baseBgColor ?? "#1F2937",
    mainColor: mainColor ?? "#3B82F6",
    bgLayout: bgLayout as GradientConfig ?? ({ type: "linear" } as GradientConfig)
  }, (bgLayout ?? { type: "linear" }).type);

  const background = useAnimatedGradient(colors.bgLayout as GradientConfig, colors);

  useSyncLlmOutput(
    currentComponent?.name,
    "ImageTextPoints",
    setComponentProps,
    LlmCurrentTextOutput,
    setLlmCurrentTextOutput,
    imageTextPointsDetails.editableFields
  );

  useSyncColorEdits(
    currentComponent?.name,
    "ImageTextPoints",
    setComponentProps,
    currentColorEdits
  );

  useSyncPageDataToComponent(id, "ImageTextPoints", setComponentProps);

  const onClick = () => {
    handleComponentClick({
      currentComponent: currentComponent!,
      componentDetails: imageTextPointsDetails,
      setCurrentComponent,
      setAssistantMessage,
    });
    setCurrentColorEdits({
      textColor: colors.textColor ?? "#FFFFFF",
      baseBgColor: colors.baseBgColor ?? "#1F2937",
      mainColor: colors.mainColor ?? "#3B82F6",
      bgLayout: colors.bgLayout ?? { type: "linear" },
    });
  };

  const updateProp = <K extends keyof ImageTextPointsProps>(key: K, value: ImageTextPointsProps[K]) => {
    setComponentProps((prev) => ({ ...prev, [key]: value }));
    updateComponentProps(currentPageSlug, id, { [key]: value });
  };

  return (
    <motion.section
      onClick={onClick}
      style={{ background, color: colors.textColor ?? "#FFFFFF" }}
      className="relative px-4 py-24 rounded-xl cursor-pointer"
    >
      <div
        className={`mx-auto max-w-5xl flex flex-col ${
          reverse ? "md:flex-row-reverse" : "md:flex-row"
        } items-center gap-12`}
      >
        {/* Left side: header + paragraph */}
        <div className="md:w-1/2">
          <EditableTextField
            value={title ?? ""}
            onChange={(val) => updateProp("title", val)}
            placeholder="Title"
            className="mb-8 text-center md:text-left text-3xl font-medium leading-tight sm:text-4xl md:text-5xl w-full border-b border-gray-400 resize-none p-1"
            isTextarea
            fieldKey="title"
            componentId={id}
          />
          <EditableTextField
            value={description ?? ""}
            onChange={(val) => updateProp("description", val)}
            placeholder="Description"
            className="mb-12 w-full max-w-lg mx-auto md:mx-0 text-center md:text-left text-base leading-relaxed bg-transparent border rounded p-2 overflow-hidden resize-none transition-all"
            isTextarea
            fieldKey="description"
            componentId={id}
          />
        </div>

        {/* Right side: image */}
        <div className="md:w-1/2 max-w-sm rounded-lg overflow-hidden shadow-lg">
          <ImageField
            className="w-full h-auto object-cover rounded-lg"
            componentId={id}
            fieldKey="images.main"
            value={images?.main ?? { src: "/placeholder.webp", alt: "Image" }}
            onChange={(val) => updateProp("images", { ...images, main: val })}
          />
        </div>
      </div>

      {/* Steps below */}
      <div className="mt-16 grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
        {textArray.map((step, index) => (
          <div key={index} className="flex flex-col items-center text-center px-6">
            <EditableTextField
              value={step.title ?? ""}
              onChange={(val) => {
                const newList = [...textArray];
                newList[index] = { ...newList[index], title: val };
                updateProp("textArray", newList);
              }}
              style={{
                background: `${colors.accentColor ?? "#3B82F6"}80`,
              }}
              className="mb-4 w-full rounded-full px-4 py-2 text-sm font-medium border-b"
              fieldKey={`textArray[${index}].title`}
              componentId={id}
            />

            <EditableTextField
              value={step.description ?? ""}
              onChange={(val) => {
                const newList = [...textArray];
                newList[index] = { ...newList[index], description: val };
                updateProp("textArray", newList);
              }}
              fieldKey={`textArray[${index}].description`}
              componentId={id}
              style={{
                borderColor: colors.accentColor ?? "#3B82F6"
              }}
              className="w-full text-base leading-relaxed border rounded p-2 overflow-hidden resize-none"
              isTextarea
            />
          </div>
        ))}
      </div>

      {/* Button */}
      <div className="mt-12 text-center">
        <motion.button
          onClick={() => {
            const el = document.getElementById("contact");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          style={{
            background: `${colors.accentColor ?? "#3B82F6"}80`,
            color: colors.textColor ?? "#FFFFFF"
          }}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          className="group relative flex w-fit mx-auto items-center gap-1.5 rounded-full bg-blue-200/30 px-6 py-3 text-gray-900 transition-colors hover:bg-blue-200/50"
        >
          <EditableTextField
            value={buttonText ?? ""}
            onChange={(val) => updateProp("buttonText", val)}
            placeholder="Button Text"
            className="w-full"
            fieldKey="buttonText"
            componentId={id}
          />
        </motion.button>
      </div>
    </motion.section>
  );
};

export default ImageTextPointsEdit;