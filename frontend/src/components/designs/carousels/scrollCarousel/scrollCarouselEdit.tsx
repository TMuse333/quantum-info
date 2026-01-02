"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight, Calendar } from "lucide-react";
import Image from "next/image";
import { CarouselItem, EditorialComponentProps } from "@/types/editorial";
import { useComponentEditor } from "@/context/context";

import {
  handleComponentClick,
  useSyncColorEdits,
  useSyncLlmOutput,
  useSyncPageDataToComponent,
} from "@/lib/hooks/hooks";
import useWebsiteStore from "@/stores/websiteStore";
import { scrollCarouselDetails, ScrollCarouselProps, defaultScrollCarouselProps } from ".";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import {  useCarouselStore } from "@/stores/carouselStore";
import {shallow } from 'zustand/shallow'
import { EditableTextArea } from "@/components/editor";

const ScrollCarouselEdit: React.FC<EditorialComponentProps> = ({ id }) => {
  const [componentProps, setComponentProps] = useState<ScrollCarouselProps>(defaultScrollCarouselProps);
  const scrollRef = useRef<HTMLDivElement>(null);

  const carousels = useCarouselStore((state) => state.carousels);
  const addCarousel = useCarouselStore((state) => state.addCarousel);

  const setCarousel = useCarouselStore((state) => state.setCarousel);

  const carouselItemsFromStore = useCarouselStore((s) => s.carousels[id]);
  const carouselItems = carouselItemsFromStore || [];

  // Log whenever this carousel's items change
  useEffect(() => {
    console.log(`trenches "${id}" items changed:`, carouselItems);
  }, [carouselItems, id]);

  const editableFieldsId = {
    ...scrollCarouselDetails,
    id: id,
  };

  const {
    setCurrentComponent,
    currentComponent,
    setAssistantMessage,
    LlmCurrentTextOutput,
    setLlmCurrentTextOutput,
    currentColorEdits,
    setCurrentColorEdits,
  } = useComponentEditor();

  const updateComponentProps = useWebsiteStore((state) => state.updateComponentProps);
  const currentPageSlug = useWebsiteStore((state) => state.currentPageSlug);

  // Merge with defaults to ensure all required props exist
  const propsWithDefaults = { ...defaultScrollCarouselProps, ...componentProps };

  // Ensure items array is never empty - use store items if available, otherwise defaults
  const safeItems = (carouselItems.length > 0 ? carouselItems : propsWithDefaults.items.length > 0 ? propsWithDefaults.items : defaultScrollCarouselProps.items);

  useEffect(()=>{
    addCarousel(id, safeItems)
  },[id, addCarousel, safeItems])

  // Safe color fallbacks
  const safeTextColor = propsWithDefaults.textColor ?? defaultScrollCarouselProps.textColor;
  const safeBaseBgColor = propsWithDefaults.baseBgColor ?? defaultScrollCarouselProps.baseBgColor;
  const safeMainColor = propsWithDefaults.mainColor ?? defaultScrollCarouselProps.mainColor;
  const safeBgLayout = propsWithDefaults.bgLayout ?? defaultScrollCarouselProps.bgLayout;

  const colors = deriveColorPalette(
    { textColor: safeTextColor, baseBgColor: safeBaseBgColor, mainColor: safeMainColor, bgLayout: safeBgLayout },
    safeBgLayout.type
  );
  const backgroundImage = useAnimatedGradient(safeBgLayout, colors);

  // Sync carousel items from context to component props


  useSyncLlmOutput(
    currentComponent?.name,
    "ScrollCarousel",
    setComponentProps,
    LlmCurrentTextOutput,
    setLlmCurrentTextOutput,
    scrollCarouselDetails?.editableFields
  );

  useSyncColorEdits(
    currentComponent?.name,
    "ScrollCarousel",
    setComponentProps,
    currentColorEdits
  );

  useSyncPageDataToComponent(id, "ScrollCarousel", setComponentProps);

  const onClick = () => {
    handleComponentClick({
      currentComponent: currentComponent!,
      componentDetails: editableFieldsId,
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

  useEffect(() => {
    updateComponentProps(currentPageSlug, id, { items: safeItems });
  }, [safeItems, id, currentPageSlug, updateComponentProps]);

  useEffect(() => {
    if (currentComponent?.name === "ScrollCarousel") {
      setCarousel(id, safeItems);
    }
  }, [safeItems, currentComponent?.name, id, setCarousel]);




  const updateProp = <K extends keyof ScrollCarouselProps>(key: K, value: ScrollCarouselProps[K]) => {
    setComponentProps((prev) => ({ ...prev, [key]: value }));
    updateComponentProps(currentPageSlug, id, { [key]: value });
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 420;
      scrollRef.current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (safeItems.length === 0) {
    return (
      <motion.section
        onClick={onClick}
        style={{ background: backgroundImage, color: colors.textColor }}
        className="w-full py-20 px-6 min-h-[400px] flex items-center justify-center"
      >
        <div className="text-center">
          <p className="text-2xl mb-4">🎠</p>
          <p className="text-lg font-semibold">No carousel items</p>
          <p className="text-sm text-gray-500">Add items using the Carousel Editor</p>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      onClick={onClick}
      style={{ background: backgroundImage }}
      className="relative w-full py-16 px-4 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        <div className="relative">
          {/* Navigation Buttons */}
          <motion.button
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              scroll("left");
            }}
            style={{ backgroundColor: colors.mainColor }}
            className="absolute left-0 top-1/2 z-20 -translate-y-1/2 -translate-x-4
              w-12 h-12 rounded-full text-white shadow-xl hover:shadow-2xl 
              transition-all duration-300 flex items-center justify-center"
            aria-label="Scroll left"
          >
            <ChevronLeft size={24} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1, x: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              scroll("right");
            }}
            style={{ backgroundColor: colors.mainColor }}
            className="absolute right-0 top-1/2 z-20 -translate-y-1/2 translate-x-4
              w-12 h-12 rounded-full text-white shadow-xl hover:shadow-2xl 
              transition-all duration-300 flex items-center justify-center"
            aria-label="Scroll right"
          >
            <ChevronRight size={24} />
          </motion.button>

          {/* Gradient fade edges */}
          <div
            className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
            style={{
              background: `linear-gradient(to right, ${colors.baseBgColor}, transparent)`,
            }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
            style={{
              background: `linear-gradient(to left, ${colors.baseBgColor}, transparent)`,
            }}
          />

          {/* Carousel */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-4 px-8 scrollbar-hide snap-x snap-mandatory
              [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
{carouselItems.map((item, index) => (
    <motion.div
      key={index}
      className="flex-shrink-0 snap-start w-[350px] rounded-3xl bg-white shadow-xl"
    >
      {/* Image container here ... */}

      <div className="p-6 relative z-10">
        {/* Extra info/date badge */}
        {item.extraInfo && (
          <div className="flex items-center gap-2 text-sm mb-3" style={{ color: colors.textColor }}>
            {/* <Calendar size={16} style={{ color: colors.mainColor }} /> */}
            <span>{item.extraInfo}</span>
          </div>
        )}

        {/* Editable Title */}
        <EditableTextArea
          className="text-xl font-bold mb-3 w-full"
          fieldKey={`items[${index}].title`}
          componentId={id}
          style={{
            backgroundImage: `linear-gradient(to right, ${colors.mainColor}, ${colors.accentColor})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          value={item.title!}
          onChange={(val) => {
            const newItems = [...carouselItems];
            newItems[index] = { ...newItems[index], title: val };
            setCarousel(id, newItems); // update the store
          }}
        />

        {/* Editable Description */}
        <EditableTextArea
          className="text-sm leading-relaxed mb-4 w-full"
          isTextarea
          rows={3}
          fieldKey={`items[${index}].description`}
          componentId={id}
          value={item.description!}
          onChange={(val) => {
            const newItems = [...carouselItems];
            newItems[index] = { ...newItems[index], description: val };
            setCarousel(id, newItems); // update the store
          }}
          style={{
            color:colors.textColor
          }}
        />

        {/* CTA Button */}
        {item.buttonText && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ backgroundColor: colors.mainColor, color: colors.baseBgColor }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold shadow-md"
          >
            {item.buttonText}
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </motion.div>
  ))}

          </div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="text-center mt-6 text-sm"
            style={{ color: colors.textColor }}
          >
            ← Swipe or use arrows to explore →
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default ScrollCarouselEdit;