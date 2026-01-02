// components/textAndList/textAndListEdit.tsx
"use client";

import React, { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { EditorialComponentProps, GradientConfig } from "@/types/editorial";
import { defaultTextAndListProps, TextAndListProps } from ".";
import { useComponentEditor } from "@/context/context";
import { handleComponentClick, useSyncLlmOutput, useSyncColorEdits, useSyncPageDataToComponent } from '../../../../lib/hooks/hooks';
import EditableTextField from "@/components/editor/editableTextField/editableTextArea";
import { textAndListDetails } from ".";
import useWebsiteStore from "@/stores/websiteStore";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import ImageField from "@/components/editor/imageField/imageField";

const TextAndListEdit: React.FC<EditorialComponentProps> = ({ id }) => {
  const [componentProps, setComponentProps] = useState<Partial<TextAndListProps>>({});

  const { setCurrentComponent, currentComponent, setAssistantMessage, LlmCurrentTextOutput, setLlmCurrentTextOutput, currentColorEdits, setCurrentColorEdits } = useComponentEditor();

  const updateComponentProps = useWebsiteStore((state) => state.updateComponentProps);
  const currentPageSlug = useWebsiteStore((state) => state.currentPageSlug);

  const {
    subTitle,
    title,
    images,
    description,
    textArray = [],
    textColor,
    baseBgColor,
    mainColor,
    bgLayout,
  } = { ...defaultTextAndListProps, ...componentProps };

  const colors = deriveColorPalette({
    textColor: textColor ?? "#000000",
    baseBgColor: baseBgColor ?? "#f0f9ff",
    mainColor: mainColor ?? "#3B82F6",
    bgLayout: bgLayout ?? { type: "radial" },
  }, (bgLayout ?? { type: "radial" }).type);
  const background = useAnimatedGradient(colors.bgLayout as GradientConfig, colors);

  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [page, setPage] = useState(0);
  const sectionRef = useRef(null);
  const sectionInView = useInView(sectionRef, { once: true, amount: 0.5 });

  const itemsPerPage = 3;
  const totalPages = Math.ceil(textArray.length / itemsPerPage);
  const currentItems = textArray.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  useSyncLlmOutput(
    currentComponent?.name,
    "TextAndList",
    setComponentProps,
    LlmCurrentTextOutput,
    setLlmCurrentTextOutput,
    textAndListDetails.editableFields
  );

  useSyncColorEdits(
    currentComponent?.name,
    "TextAndList",
    setComponentProps,
    currentColorEdits
  );

  useSyncPageDataToComponent(id, "TextAndList", setComponentProps);

  const onClick = () => {
    handleComponentClick({
      currentComponent: currentComponent!,
      componentDetails: textAndListDetails,
      setCurrentComponent,
      setAssistantMessage,
    });
    setCurrentColorEdits({
      textColor: colors.textColor ?? "#000000",
      baseBgColor: colors.baseBgColor ?? "#f0f9ff",
      mainColor: colors.mainColor ?? "#3B82F6",
      bgLayout: colors.bgLayout ?? { type: "radial" },
    });
  };

  const updateProp = <K extends keyof TextAndListProps>(key: K, value: TextAndListProps[K]) => {
    setComponentProps((prev) => ({ ...prev, [key]: value }));
    updateComponentProps(currentPageSlug, id, { [key]: value });
  };

  return (
    <motion.section
      ref={sectionRef}
      onClick={onClick}
      style={{ background, color: colors.textColor ?? "#000000" }}
      className="relative py-20 px-6 rounded-xl cursor-pointer"
    >
      <div className="flex flex-col md:flex-row items-center max-w-6xl mx-auto gap-12">
        {/* Left side image */}
        <div className="w-full md:w-1/2 flex justify-center">
          <ImageField
            componentId={id}
            fieldKey="images.main"
            value={images?.main ?? { src: "/placeholder.webp", alt: "placeholder" }}
            onChange={(val) => updateProp("images", { main: val })}
            className="h-72 w-72 md:h-96 md:w-96 rounded-full overflow-hidden border-4 shadow-xl"
          />
        </div>

        {/* Right side content */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left space-y-6">
          <EditableTextField
            value={subTitle ?? ""}
            onChange={(val) => updateProp("subTitle", val)}
            placeholder="Subtitle"
            className="font-medium"
            fieldKey="subTitle"
            componentId={id}
          />

          <EditableTextField
            value={title ?? ""}
            onChange={(val) => updateProp("title", val)}
            placeholder="Title"
            className="text-3xl sm:text-5xl font-semibold"
            isTextarea
            fieldKey="title"
            componentId={id}
          />

          <EditableTextField
            value={description ?? ""}
            onChange={(val) => updateProp("description", val)}
            placeholder="Description"
            className="my-6 text-base leading-relaxed max-w-lg w-full"
            isTextarea
            fieldKey="description"
            componentId={id}
          />

          {/* Accordion cards */}
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full space-y-4 min-h-[300px]"
            >
              {currentItems.map((item, idx) => {
                const actualIndex = idx + page * itemsPerPage;

                return (
                  <motion.div
                    key={actualIndex}
                    initial={{ opacity: 0, x: 50 }}
                    animate={sectionInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.3 * idx }}
                    className="bg-white/50 w-full border rounded-2xl p-4 cursor-pointer"
                    style={{ borderColor: colors.accentColor ?? "#3B82F6" }}
                    onClick={() =>
                      setExpandedIndex(expandedIndex === actualIndex ? null : actualIndex)
                    }
                  >
                    <div className="flex justify-between items-center">
                      <EditableTextField
                        value={item.title ?? ""}
                        onChange={(val) => {
                          const newArray = [...textArray];
                          newArray[actualIndex] = { ...newArray[actualIndex], title: val };
                          updateProp("textArray", newArray);
                        }}
                        placeholder="Item Title"
                        className="font-bold text-lg flex-1"
                        fieldKey={`textArray[${actualIndex}].title`}
                        componentId={id}
                        style={{
                          backgroundImage: `linear-gradient(to bottom right, ${colors.lightAccent ?? "#3B82F6"}, ${colors.darkAccent ?? "#3B82F6"})`,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      />
                      <span className="text-xl">
                        {expandedIndex === actualIndex ? "−" : "+"}
                      </span>
                    </div>

                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={
                        expandedIndex === actualIndex
                          ? { height: "auto", opacity: 1 }
                          : { height: 0, opacity: 0 }
                      }
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <EditableTextField
                        value={item.description ?? ""}
                        onChange={(val) => {
                          const newArray = [...textArray];
                          newArray[actualIndex] = { ...newArray[actualIndex], description: val };
                          updateProp("textArray", newArray);
                        }}
                        placeholder="Item Description"
                        className="mt-2 text-sm md:text-base w-full"
                        isTextarea
                        fieldKey={`textArray[${actualIndex}].description`}
                        componentId={id}
                      />
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex mt-6 gap-4">
              <button
                onClick={() => {
                  if (page > 0) {
                    setPage((prev) => prev - 1);
                    setExpandedIndex(null);
                  }
                }}
                disabled={page === 0}
                className={`px-4 py-2 rounded-xl font-semibold shadow-sm transition ${
                  page === 0
                    ? "bg-gray-300 cursor-not-allowed text-gray-500"
                    : ""
                }`}
                style={{
                  backgroundColor: page === 0 ? "" : colors.accentColor ?? "#3B82F6",
                }}
              >
                Previous
              </button>
              <button
                onClick={() => {
                  if (page < totalPages - 1) {
                    setPage((prev) => prev + 1);
                    setExpandedIndex(null);
                  }
                }}
                disabled={page >= totalPages - 1}
                className={`px-4 py-2 rounded-xl font-semibold shadow-sm transition ${
                  page >= totalPages - 1
                    ? "bg-gray-300 cursor-not-allowed text-gray-500"
                    : ""
                }`}
                style={{
                  backgroundColor: page >= totalPages - 1 ? "" : colors.accentColor ?? "#3B82F6",
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default TextAndListEdit;