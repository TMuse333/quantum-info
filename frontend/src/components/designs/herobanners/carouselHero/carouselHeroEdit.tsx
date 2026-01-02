"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { carouselHeroDetails, CarouselHeroProps, defaultCarouselHeroProps } from ".";
import { EditableTextArea } from "@/components/editor";
import { useComponentEditor } from "@/context/context";
import useWebsiteStore from "@/stores/websiteStore";
import { useCarouselStore } from "@/stores/carouselStore";
import {
  handleComponentClick,
  useSyncColorEdits,
  useSyncLlmOutput,
  useSyncPageDataToComponent,
} from "@/lib/hooks/hooks";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import { CarouselItem, EditorialComponentProps } from "@/types/editorial";

const CarouselHeroEdit: React.FC<EditorialComponentProps> = ({ id }) => {
  const [componentProps, setComponentProps] = useState<CarouselHeroProps>(defaultCarouselHeroProps);
  const { setCurrentComponent, currentComponent, setAssistantMessage, LlmCurrentTextOutput, setLlmCurrentTextOutput, currentColorEdits, setCurrentColorEdits } = useComponentEditor();

  // Extract from website store
  const { updateComponentProps, currentPageSlug } = useWebsiteStore();

  const carouselItemsFromStore = useCarouselStore((s) => s.carousels[id]) || [];
  const addCarousel = useCarouselStore((s) => s.addCarousel);
  const setCarousel = useCarouselStore((s) => s.setCarousel);

  // Merge with defaults to ensure all required props exist
  const propsWithDefaults = { ...defaultCarouselHeroProps, ...componentProps };

  // Ensure items array is never empty
  const safeItems = propsWithDefaults.items.length > 0 ? propsWithDefaults.items : defaultCarouselHeroProps.items;

  // Safe color fallbacks
  const safeTextColor = propsWithDefaults.textColor ?? defaultCarouselHeroProps.textColor;
  const safeBaseBgColor = propsWithDefaults.baseBgColor ?? defaultCarouselHeroProps.baseBgColor;
  const safeMainColor = propsWithDefaults.mainColor ?? defaultCarouselHeroProps.mainColor;
  const safeBgLayout = propsWithDefaults.bgLayout ?? defaultCarouselHeroProps.bgLayout;

  const colors = deriveColorPalette(
    { textColor: safeTextColor, baseBgColor: safeBaseBgColor, mainColor: safeMainColor, bgLayout: safeBgLayout },
    safeBgLayout.type
  );
  const backgroundImage = useAnimatedGradient(safeBgLayout, colors);

  // Initialize carousel
  useEffect(() => {
    addCarousel(id, safeItems);
  }, [id, addCarousel, safeItems]);

  // Sync componentProps.items → store
  useEffect(() => {
    if (currentComponent?.name === "CarouselHero") {
      setCarousel(id, safeItems);
    }
  }, [safeItems, currentComponent?.name, id, setCarousel]);

  useSyncLlmOutput(currentComponent?.name, "CarouselHero", setComponentProps, LlmCurrentTextOutput, setLlmCurrentTextOutput, carouselHeroDetails.editableFields);
  useSyncColorEdits(currentComponent?.name, "CarouselHero", setComponentProps, currentColorEdits, id, );
  useSyncPageDataToComponent(id, "CarouselHero", setComponentProps);

  const onClick = () => {
    handleComponentClick({
      currentComponent: currentComponent!,
      componentDetails: { ...carouselHeroDetails, id },
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

  const updateProp = <K extends keyof CarouselHeroProps>(key: K, value: CarouselHeroProps[K]) => {
    setComponentProps((prev) => ({ ...prev, [key]: value }));
    updateComponentProps(currentPageSlug, id, { [key]: value });
  };

  return (
    <motion.section
      onClick={onClick}
      style={{ background: backgroundImage }}
      className="w-full"
    >
      <section className="flex flex-col md:flex-row md:h-screen relative items-center mx-auto max-w-[2200px] md:mt-[-4rem] gap-8 px-4">
        {/* Left: Text */}
        <LeftTextSection
          componentProps={propsWithDefaults}
          updateProp={updateProp}
          id={id}
          colors={colors}
        />

        {/* Right: Carousel */}
        <CarouselSection
          carouselItems={carouselItemsFromStore.length > 0 ? carouselItemsFromStore : safeItems}
          id={id}
          updateProp={updateProp}
        />
      </section>
    </motion.section>
  );
};

// ────────────────────────────────────────────────────────────────
// Left Text Section (Only EditableTextArea)
// ────────────────────────────────────────────────────────────────
interface LeftTextSectionProps {
  componentProps: typeof defaultCarouselHeroProps;
  updateProp: <K extends keyof CarouselHeroProps>(key: K, value: CarouselHeroProps[K]) => void;
  id: string;
  colors: ReturnType<typeof deriveColorPalette>;
}

const LeftTextSection = ({ componentProps, updateProp, id, colors }: LeftTextSectionProps) => {
  return (
    <section className="flex flex-col md:w-[40vw] justify-center items-start py-8 px-6 space-y-6">
      <EditableTextArea
        value={componentProps.title ?? ""}
        onChange={(val) => updateProp("title", val)}
        fieldKey="title"
        componentId={id}
        className="text-3xl md:text-5xl font-bold w-full"
        isTextarea
        rows={2}
        style={{ color: colors.textColor }}
      />

      <EditableTextArea
        value={componentProps.subTitle ?? ""}
        onChange={(val) => updateProp("subTitle", val)}
        fieldKey="subTitle"
        componentId={id}
        className="text-xl md:text-2xl font-medium w-full"
        isTextarea
        rows={2}
        style={{ color: colors.mainColor }}
      />

      <EditableTextArea
        value={componentProps.description ?? ""}
        onChange={(val) => updateProp("description", val)}
        fieldKey="description"
        componentId={id}
        className="text-lg md:text-xl leading-relaxed"
        isTextarea
        rows={4}
        style={{ color: colors.textColor }}
      />

      {componentProps.buttonText && (
        <button
          style={{ backgroundColor: colors.mainColor, color: colors.baseBgColor }}
          className="mt-6 px-8 py-3 rounded-xl font-bold text-lg"
        >
          <EditableTextArea
            value={componentProps.buttonText ?? ""}
            onChange={(val) => updateProp("buttonText", val)}
            fieldKey="buttonText"
            componentId={id}
            className="text-inherit"
          />
        </button>
      )}
    </section>
  );
};

// ────────────────────────────────────────────────────────────────
// Carousel Section (Auto-play + Dots + Editable)
// ────────────────────────────────────────────────────────────────
interface CarouselSectionProps {
  carouselItems: CarouselItem[];
  id: string;
  updateProp: <K extends keyof CarouselHeroProps>(key: K, value: CarouselHeroProps[K]) => void;
}

const CarouselSection = ({ carouselItems, id, updateProp }: CarouselSectionProps) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [tabProgress, setTabProgress] = useState<number>(0);

  useEffect(() => {
    setTabProgress(0);
  }, [currentIndex]);

  useEffect(() => {
    if (tabProgress >= 100) {
      setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
    }
  }, [tabProgress, carouselItems.length]);

  // Auto-progress (uncomment if you want auto-advance)
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setTabProgress((prev) => Math.min(prev + 0.5, 100));
  //   }, 50);
  //   return () => clearInterval(interval);
  // }, [tabProgress]);

  return (
    <section className="relative w-full md:w-[60vw] bg-black rounded-2xl mx-auto h-[70vh] md:h-[80vh] border-4 border-white overflow-hidden">
      <AnimatePresence mode="wait">
        {carouselItems.length > 0 && (
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full"
          >
            <Image
              src={carouselItems[currentIndex]?.image?.src || "/placeholder.webp"}
              height={600}
              width={1300}
              alt={carouselItems[currentIndex]?.image?.alt || "Slide"}
              className="w-full h-full object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
        {carouselItems.map((_: CarouselItem, index: number) => (
          <div
            key={index}
            className="h-2 w-12 bg-gray-600 rounded-full cursor-pointer hover:scale-110 transition-transform"
            onClick={() => setCurrentIndex(index)}
          >
            {index === currentIndex && (
              <div
                className="bg-white h-full rounded-full"
                style={{ width: `${tabProgress}%`, transition: "width 0.05s linear" }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Editable Description */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-full px-8">
        <EditableTextArea
          value={carouselItems[currentIndex]?.description || ""}
          onChange={(val) => {
            const newItems = [...carouselItems];
            newItems[currentIndex] = { ...newItems[currentIndex], description: val };
            updateProp("items", newItems);
          }}
          fieldKey={`items[${currentIndex}].description`}
          componentId={id}
          className="text-white text-center bg-black/60 p-3 rounded-lg text-lg font-medium w-full"
          isTextarea
          rows={2}
        />
      </div>
    </section>
  );
};

export default CarouselHeroEdit;