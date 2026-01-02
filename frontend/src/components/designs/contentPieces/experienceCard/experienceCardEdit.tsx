"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useInView,
  useScroll,
  useTransform,
  useMotionValueEvent,
  animate,
} from "framer-motion";
import Image from "next/image";
import { EditorialComponentProps } from "@/types/editorial";
import EditableTextField from "@/components/editor/editableTextField/editableTextArea";
import { experienceCardDetails, ExperienceCardProps, defaultExperienceCardProps } from ".";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import ImageField from "@/components/editor/imageField/imageField";
import { handleComponentClick, useSyncColorEdits, useSyncLlmOutput, useSyncPageDataToComponent } from "@/lib/hooks/hooks";
import { useComponentEditor } from "@/context";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import useWebsiteStore from "@/stores/websiteStore";

const ExperienceCardEdit: React.FC<EditorialComponentProps> = ({ id }) => {
  const [componentProps, setComponentProps] = useState<ExperienceCardProps>(defaultExperienceCardProps);
  const { setCurrentComponent, currentComponent, setCurrentColorEdits, setAssistantMessage, currentColorEdits, LlmCurrentTextOutput, setLlmCurrentTextOutput } = useComponentEditor();
  const sectionRef = useRef<HTMLDivElement>(null);
  const sectionInView = useInView(sectionRef, { once: true, amount: 0.5 });
  const updateComponentProps = useWebsiteStore((state) => state.updateComponentProps);
  const currentPageSlug = useWebsiteStore((state) => state.currentPageSlug);

  // Merge with defaults to ensure all required props exist
  const propsWithDefaults = { ...defaultExperienceCardProps, ...componentProps };

  // Ensure array is never empty
  const safeArray = propsWithDefaults.array.length > 0 ? propsWithDefaults.array : defaultExperienceCardProps.array;

  // Safe color fallbacks
  const safeTextColor = propsWithDefaults.textColor ?? defaultExperienceCardProps.textColor;
  const safeBaseBgColor = propsWithDefaults.baseBgColor ?? defaultExperienceCardProps.baseBgColor;
  const safeMainColor = propsWithDefaults.mainColor ?? defaultExperienceCardProps.mainColor;
  const safeBgLayout = propsWithDefaults.bgLayout ?? defaultExperienceCardProps.bgLayout;

  const colors = deriveColorPalette({ textColor: safeTextColor, baseBgColor: safeBaseBgColor, mainColor: safeMainColor, bgLayout: safeBgLayout }, safeBgLayout.type);

  const onClick = () => {
    handleComponentClick({
      currentComponent: currentComponent!,
      componentDetails: experienceCardDetails,
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

  useSyncColorEdits(
    currentComponent?.name,
    "ExperienceCard",
    setComponentProps,
    currentColorEdits
  );

  useSyncLlmOutput(
    currentComponent?.name,
    "ExperienceCard",
    setComponentProps,
    LlmCurrentTextOutput,
    setLlmCurrentTextOutput,
    experienceCardDetails.editableFields
  );

  useSyncPageDataToComponent(id, "ExperienceCard", setComponentProps);

  const updateProp = <K extends keyof ExperienceCardProps>(key: K, value: ExperienceCardProps[K]) => {
    setComponentProps((prev) => ({ ...prev, [key]: value }));
    updateComponentProps(currentPageSlug, id, { [key]: value });
  };

  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  /* ────── SCROLL SCALE EFFECT ────── */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.7, 1, 1, 0.7]);
  const [startAnimation, setStartAnimation] = useState(false);
  useMotionValueEvent(scale, "change", (latest) => {
    if (latest === 1) setStartAnimation(true);
  });

  const imageRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const [h2AnimationComplete, setH2AnimationComplete] = useState(false);

  const handleAnimation = async () => {
    if (imageRef.current && descriptionRef.current && h2AnimationComplete) {
      animate(imageRef.current, { opacity: 1, y: 0 }, { delay: 0.2 });
      animate(descriptionRef.current, { opacity: 1, x: 0 }, { delay: 0.4 });
    }
  };

  useEffect(() => {
    if (startAnimation && h2AnimationComplete) handleAnimation();
  }, [startAnimation, h2AnimationComplete]);

  /* ────── STAGGERED LIST ANIMATION ────── */
  const listItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.4 },
    }),
    exit: { opacity: 0, y: -10 },
  };

  return (
    <motion.section
      ref={sectionRef}
      onClick={onClick}
      style={{
        background: useAnimatedGradient(safeBgLayout, colors),
        scale,
      }}
      className="w-full py-20 px-6 rounded-3xl shadow-2xl"
    >
      {/* Title + Image + Description */}
      <section className="flex flex-col md:flex-row gap-6 md:gap-12 items-center md:items-start">
        {/* Image */}
        <motion.div
          ref={imageRef}
          className="w-full md:w-1/2 flex justify-center opacity-0"
          initial={{ opacity: 0, y: 20 }}
          animate={sectionInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <ImageField
            componentId={id}
            fieldKey="images.main"
            value={(propsWithDefaults.images?.main ?? defaultExperienceCardProps.images.main) || { src: "/placeholder.webp", alt: "Experience image" }}
            onChange={(val) => updateProp("images", { ...propsWithDefaults.images, main: val })}
            className="w-[90%] max-w-md h-72 md:h-96 rounded-2xl shadow-xl border-4 border-white/20 object-cover"
          />
        </motion.div>

        {/* Text Content */}
        <motion.div
          ref={descriptionRef}
          className="w-full md:w-1/2 flex flex-col justify-center opacity-0"
          initial={{ opacity: 0, x: 20 }}
          animate={sectionInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <EditableTextField
            value={propsWithDefaults.title ?? ""}
            onChange={(val) => updateProp("title", val)}
            fieldKey="title"
            componentId={id}
            isTextarea
            style={{
              backgroundImage: `linear-gradient(to bottom right, ${colors.lightAccent}, ${colors.darkAccent})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
            className="text-left text-3xl sm:text-5xl font-bold mb-4"
          />

          <EditableTextField
            value={propsWithDefaults.description ?? ""}
            onChange={(val) => updateProp("description", val)}
            fieldKey="description"
            componentId={id}
            isTextarea
            className="text-base md:text-lg mb-4"
            style={{ color: colors.textColor }}
          />

          <EditableTextField
            value={propsWithDefaults.buttonText ?? ""}
            onChange={(val) => updateProp("buttonText", val)}
            fieldKey="buttonText"
            componentId={id}
            className="text-white font-semibold px-6 py-3 rounded-full self-start hover:bg-red-600 hover:scale-105 transition-transform duration-300 shadow-lg"
            style={{ color: colors.textColor, backgroundColor: `${colors.lightAccent}90` }}
          />
        </motion.div>
      </section>

      {/* Features List */}
      <section className="w-full mt-12 flex flex-col">
        <EditableTextField
          value={propsWithDefaults.subTitle ?? ""}
          onChange={(val) => updateProp("subTitle", val)}
          fieldKey="subTitle"
          componentId={id}
          className="text-center mb-4 text-2xl font-medium"
          style={{ color: colors.textColor }}
        />

        <motion.ul
          className="mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:px-8 lg:px-12 w-full"
          initial="hidden"
          animate={sectionInView ? "visible" : "hidden"}
        >
          {safeArray.map((item, idx) => (
            <motion.li
              key={idx}
              custom={idx}
              variants={listItemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layoutId={`feature-${idx}`} // Ensures smooth exit/enter
              className="backdrop-blur-md rounded-xl p-4 flex items-center gap-3 border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-300 cursor-pointer"
              style={{ backgroundColor: colors.lightAccent,
              color:colors.darkText }}
              onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
            >
              <EditableTextField
                value={item.title}
                onChange={(val) => {
                  const newArray = [...safeArray];
                  newArray[idx] = { ...newArray[idx], title: val };
                  updateProp("array", newArray);
                }}
                fieldKey={`array[${idx}].title`}
                componentId={id}
                className="font-medium flex-1"
                style={{ color: colors.textColor }}
              />
              <CheckCircle2 size={20} className="text-white flex-shrink-0" />
            </motion.li>
          ))}
        </motion.ul>
      </section>
    </motion.section>
  );
};

export default ExperienceCardEdit;