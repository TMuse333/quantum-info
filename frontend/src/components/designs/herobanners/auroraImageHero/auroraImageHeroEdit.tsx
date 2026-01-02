"use client";

import { useEffect, useState } from "react";
import { useMotionTemplate, useMotionValue, motion, animate } from "framer-motion";
import Image from "next/image";
import { EditableComponent } from "@/types/editorial";;
import { EditorialComponentProps } from "@/types/editorial";
import { useComponentEditor } from "@/context/context";
import { extractTextProps, handleComponentClick, useSyncColorEdits, useSyncLlmOutput, useSyncPageDataToComponent, useSyncTextToPage,
 } from '../../../../lib/hooks/hooks';
import EditableTextField from "@/components/editor/editableTextField/editableTextArea";
import useWebsiteStore from "@/stores/websiteStore";
import { auroraImageHeroDetails, defaultAuroraImageHeroProps } from ".";
import { AuroraImageHeroProps } from ".";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import ImageField from "@/components/editor/imageField/imageField";

const AuroraImageHeroEdit: React.FC<EditorialComponentProps> = ({ id }) => {
  const [componentProps, setComponentProps] = useState<AuroraImageHeroProps>(defaultAuroraImageHeroProps);

  const { setCurrentComponent, currentComponent, setAssistantMessage, LlmCurrentTextOutput, setLlmCurrentTextOutput,
  currentColorEdits, setCurrentColorEdits } = useComponentEditor();

  // Merge with defaults to ensure all required props exist
  const propsWithDefaults = { ...defaultAuroraImageHeroProps, ...componentProps };

  const componentText = extractTextProps(propsWithDefaults)

  const colors = deriveColorPalette(propsWithDefaults, propsWithDefaults.bgLayout!.type);

  // const colors = deriveColorPalette({
  //   textColor: textColor ?? "#111111",
  //   baseBgColor: baseBgColor ?? "#dbeafe",
  //   mainColor: mainColor ?? "#00bfff",
  //   bgLayout: bgLayout ?? { type: "solid" },
  // }, (bgLayout ?? { type: "solid" }).type);

  // const background = useAnimatedGradient(colors.bgLayout as GradientConfig, colors);

  const updateComponentProps = useWebsiteStore((state) => state.updateComponentProps);
  const currentPageSlug = useWebsiteStore((state) => state.currentPageSlug);

  useSyncLlmOutput(
    currentComponent?.name,
    "AuroraImageHero",
    setComponentProps,
    LlmCurrentTextOutput,
    setLlmCurrentTextOutput,
    auroraImageHeroDetails?.editableFields
  );

  useSyncColorEdits(
    currentComponent?.name,
    "AuroraImageHero",
    setComponentProps,
    currentColorEdits,
    id  // Pass component ID to avoid auto-detection issues
  );

  useSyncPageDataToComponent(id, "AuroraImageHero", setComponentProps);

  const onClick = () => {
    handleComponentClick({
      currentComponent: currentComponent!,
      componentDetails: auroraImageHeroDetails,
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

  const updateProp = <K extends keyof AuroraImageHeroProps>(key: K, value: AuroraImageHeroProps[K]) => {
    console.log("🔵 [AuroraImageHeroEdit] updateProp called:", {
      key,
      value,
      currentPageSlug,
      componentId: id,
    });

    setComponentProps((prev) => ({ ...prev, [key]: value }));
    updateComponentProps(currentPageSlug, id, { [key]: value });

    console.log("✅ [AuroraImageHeroEdit] Called updateComponentProps");
  };

  const backgroundImage = useAnimatedGradient(propsWithDefaults.bgLayout!, colors)

  return (
    <motion.section
      onClick={onClick}
      style={{ 
        background: backgroundImage,
        color: colors.textColor
      }}
      className="relative grid min-h-screen place-content-center overflow-hidden px-4 py-24 rounded-xl"
    >
      <div className="relative z-10 flex flex-col md:flex-row items-center max-w-5xl mx-auto gap-8">
        
        {/* Left side - Image */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center">
          <ImageField
            className="h-64 w-64 md:h-96 md:w-96 rounded-full overflow-hidden shadow-2xl"
            componentId={id}
            fieldKey="images.main"
            value={propsWithDefaults.images?.main || { src: "/placeholder.webp", alt: "Placeholder" }}
            onChange={(val) =>
              updateProp("images", {
                ...propsWithDefaults.images,
                main: val,
              })
            }
            rounded
          />
        </div>

        {/* Right side - Content */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left space-y-4">
          <EditableTextField
            value={propsWithDefaults.subTitle}
            onChange={val => updateProp("subTitle", val)}
            placeholder="Subtitle"
            className="text-sm w-full font-semibold tracking-wide uppercase"
            isTextarea
            fieldKey="subTitle"
            componentId={id}
          />

          <EditableTextField
            value={propsWithDefaults.title}
            onChange={val => updateProp("title", val)}
            placeholder="Title"
            isTextarea
            maxWords={10}
            rows={2}
            className="text-3xl md:text-5xl font-bold leading-tight"
            fieldKey="title"
            componentId={id}
          />

          <EditableTextField
            value={propsWithDefaults.description}
            onChange={val => updateProp("description", val)}
            placeholder="Description"
            isTextarea
            maxWords={25}
            rows={3}
            className="text-lg w-full md:text-xl leading-relaxed max-w-lg"
            fieldKey="description"
            componentId={id}
          />

          <button
            className="mt-6 px-8 py-4 rounded-full text-xl font-bold transition-all hover:scale-105"
            style={{
              backgroundColor: colors.accentColor,
              color: colors.baseBgColor
            }}
          >
            <EditableTextField
              value={propsWithDefaults.buttonText}
              onChange={val => updateProp("buttonText", val)}
              placeholder="Button Text"
              className="font-bold"
              fieldKey="buttonText"
              componentId={id}
            />
          </button>
        </div>
      </div>
    </motion.section>
  );
};

export default AuroraImageHeroEdit;