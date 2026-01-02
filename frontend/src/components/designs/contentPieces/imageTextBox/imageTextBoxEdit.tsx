// components/imageTextBox/imageTextBoxEdit.tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { EditorialComponentProps } from "@/types/editorial";
import { defaultImageTextBoxProps, ImageTextBoxProps } from ".";
import { useComponentEditor } from "@/context/context";
import { handleComponentClick, useSyncColorEdits, useSyncLlmOutput, useSyncPageDataToComponent } from "@/lib/hooks/hooks";
import { imageTextBoxDetails } from ".";
import useWebsiteStore from "@/stores/websiteStore";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import EditableTextField from "@/components/editor/editableTextField/editableTextArea";
import ImageField from "@/components/editor/imageField/imageField";
import { useState } from "react";

const ImageTextBoxEdit: React.FC<EditorialComponentProps> = ({ id }) => {
  const [componentProps, setComponentProps] = useState<Partial<ImageTextBoxProps>>({});

  const { setCurrentComponent, currentComponent, setAssistantMessage, LlmCurrentTextOutput, setLlmCurrentTextOutput, currentColorEdits, setCurrentColorEdits } = useComponentEditor();
  const updateComponentProps = useWebsiteStore((state) => state.updateComponentProps);
  const currentPageSlug = useWebsiteStore((state) => state.currentPageSlug);

  const props = { ...defaultImageTextBoxProps, ...componentProps };
  const colors = deriveColorPalette(props, props.bgLayout?.type);
  const background = useAnimatedGradient(props.bgLayout!, colors);

  useSyncLlmOutput(
    currentComponent?.name,
    "ImageTextBox",
    setComponentProps,
    LlmCurrentTextOutput,
    setLlmCurrentTextOutput,
    imageTextBoxDetails.editableFields
  );

  useSyncColorEdits(currentComponent?.name, "ImageTextBox", setComponentProps, currentColorEdits);

  useSyncPageDataToComponent(id, "ImageTextBox", setComponentProps);

  const onClick = () => {
    handleComponentClick({
      currentComponent: currentComponent!,
      componentDetails: imageTextBoxDetails,
      setCurrentComponent,
      setAssistantMessage,
    });
    setCurrentColorEdits({
      textColor: colors.textColor,
      baseBgColor: colors.baseBgColor,
      mainColor: colors.mainColor,
      bgLayout: colors.bgLayout,
    });
  };

  const updateProp = <K extends keyof ImageTextBoxProps>(key: K, value: ImageTextBoxProps[K]) => {
    setComponentProps((prev) => ({ ...prev, [key]: value }));
    updateComponentProps(currentPageSlug, id, { [key]: value });
  };

  return (
    <motion.section
      onClick={onClick}
      style={{ background, color: colors.textColor }}
      className="relative py-24 rounded-xl cursor-pointer"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className={`flex flex-col ${props.reverse ? "md:flex-row-reverse" : "md:flex-row"} gap-12 items-center`}>
          {/* Image */}
          <div className="w-full md:w-1/2">
            <ImageField
              componentId={id}
              fieldKey="images.main"
              value={props.images?.main || defaultImageTextBoxProps.images.main}
              onChange={(val) => updateProp("images", { ...props.images, main: val })}
              className="rounded-2xl shadow-2xl"
            />
          </div>

          {/* Text */}
          <div className="w-full md:w-1/2 space-y-6">
            <EditableTextField
              value={props.title}
              onChange={(val) => updateProp("title", val)}
              placeholder="Enter title..."
              className="text-4xl lg:text-5xl font-bold w-full"
              isTextarea
              fieldKey="title"
              componentId={id}
            />

            <EditableTextField
              value={props.description}
              onChange={(val) => updateProp("description", val)}
              placeholder="Enter description..."
              className="text-lg lg:text-xl w-full leading-relaxed"
              isTextarea
              rows={4}
              fieldKey="description"
              componentId={id}
            />

            <label className="flex items-center gap-3 mt-6">
              <input
                type="checkbox"
                checked={props.reverse}
                onChange={(e) => updateProp("reverse", e.target.checked)}
                className="w-5 h-5"
              />
              <span className="text-sm font-medium">Reverse Layout (Image on Left)</span>
            </label>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default ImageTextBoxEdit;