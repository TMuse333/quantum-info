"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EditorialComponentProps } from "@/types/editorial";
import { useComponentEditor } from "@/context/context";
import {
  handleComponentClick,
  useSyncLlmOutput,
  useSyncColorEdits,
  useSyncPageDataToComponent,
} from "@/lib/hooks/hooks";
import { EditableTextArea } from "@/components/editor";
import { defaultPropertyCarouselProps, PropertyCarouselProps } from "./index";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import useWebsiteStore from "@/stores/websiteStore";
import { propertyCarouselDetails } from "./index";
import { useCarouselStore } from "@/stores/carouselStore";

export const initialPropertyCarouselProps: PropertyCarouselProps = {
  title: "Featured Properties",
  subTitle: "Explore our latest listings and recent successes",
  items: [
    {
      image: { src: "/placeholder.webp", alt: "Property 1" },
      title: "123 Maple Street",
      description: "Beautiful 3BR/2BA home in prime location. Recently renovated with modern finishes.",
    //   buttonText: "View Details",
      extraInfo: "SOLD",
    },
    {
      image: { src: "/placeholder.webp", alt: "Property 2" },
      title: "456 Oak Avenue",
      description: "Stunning colonial with large backyard. Perfect for growing families.",
    //   buttonText: "View Details",
      extraInfo: "SOLD",
    },
    {
      image: { src: "/placeholder.webp", alt: "Property 3" },
      title: "789 Pine Road",
      description: "Charming ranch-style home with updated kitchen and spacious living areas.",
    //   buttonText: "View Details",
      extraInfo: "SOLD",
    },
    {
      image: { src: "/placeholder.webp", alt: "Property 4" },
      title: "321 Birch Lane",
      description: "Modern townhouse in walkable neighborhood. Move-in ready condition.",
    //   buttonText: "View Details",
      extraInfo: "SOLD",
    },
  ],
  textColor: "#1f2937",
  baseBgColor: "#ffffff",
  mainColor: "#3B82F6",
  bgLayout: {
    type: "solid",
  },
};

const PropertyCarouselEdit: React.FC<EditorialComponentProps> = ({ id }) => {
  const [componentProps, setComponentProps] = useState<PropertyCarouselProps>(initialPropertyCarouselProps);
  const [currentIndex, setCurrentIndex] = useState(0);

  const carousels = useCarouselStore((state) => state.carousels);
  const addCarousel = useCarouselStore((state) => state.addCarousel);
  const setCarousel = useCarouselStore((state) => state.setCarousel);

  const carouselItemsFromStore = useCarouselStore((s) => s.carousels[id]);
  const carouselItems = carouselItemsFromStore || [];

  const editableFieldsId = {
    ...propertyCarouselDetails,
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
  const propsWithDefaults = { ...defaultPropertyCarouselProps, ...componentProps };

  useEffect(() => {
    const items = carouselItems.length > 0
      ? carouselItems
      : propsWithDefaults.items.length > 0
        ? propsWithDefaults.items
        : defaultPropertyCarouselProps.items;
    addCarousel(id, items);
  }, [id, addCarousel, carouselItems, propsWithDefaults.items, defaultPropertyCarouselProps.items]);

  // Ensure items array is never empty - use store items if available, otherwise defaults
  const safeItems = (carouselItems.length > 0 ? carouselItems : propsWithDefaults.items.length > 0 ? propsWithDefaults.items : defaultPropertyCarouselProps.items);

  // Safe color fallbacks
  const safeTextColor = propsWithDefaults.textColor ?? defaultPropertyCarouselProps.textColor;
  const safeBaseBgColor = propsWithDefaults.baseBgColor ?? defaultPropertyCarouselProps.baseBgColor;
  const safeMainColor = propsWithDefaults.mainColor ?? defaultPropertyCarouselProps.mainColor;
  const safeBgLayout = propsWithDefaults.bgLayout ?? defaultPropertyCarouselProps.bgLayout;

  const colors = deriveColorPalette(
    { textColor: safeTextColor, baseBgColor: safeBaseBgColor, mainColor: safeMainColor, bgLayout: safeBgLayout },
    safeBgLayout.type
  );
  const backgroundImage = useAnimatedGradient(safeBgLayout, colors);

  useSyncLlmOutput(
    currentComponent?.name,
    "PropertyCarousel",
    setComponentProps,
    LlmCurrentTextOutput,
    setLlmCurrentTextOutput,
    propertyCarouselDetails?.editableFields
  );

  useSyncColorEdits(
    currentComponent?.name,
    "PropertyCarousel",
    setComponentProps,
    currentColorEdits
  );

  useSyncPageDataToComponent(id, "PropertyCarousel", setComponentProps);

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
    if (currentComponent?.name === "PropertyCarousel") {
      setCarousel(id, safeItems);
    }
  }, [safeItems, currentComponent?.name, id, setCarousel]);

  const updateProp = <K extends keyof PropertyCarouselProps>(
    key: K,
    value: PropertyCarouselProps[K]
  ) => {
    setComponentProps((prev) => ({ ...prev, [key]: value }));
    updateComponentProps(currentPageSlug, id, { [key]: value });
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % safeItems.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + safeItems.length) % safeItems.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const visibleCards = 3;
  const getVisibleItems = () => {
    const visible = [];
    for (let i = 0; i < visibleCards; i++) {
      visible.push(safeItems[(currentIndex + i) % safeItems.length]);
    }
    return visible;
  };

  if (safeItems.length === 0) {
    return (
      <motion.section
        onClick={onClick}
        style={{ background: backgroundImage, color: colors.textColor }}
        className="w-full py-20 px-6 min-h-[400px] flex items-center justify-center cursor-pointer"
      >
        <div className="text-center">
          <p className="text-2xl mb-4">🏠</p>
          <p className="text-lg font-semibold">No properties to display</p>
          <p className="text-sm text-gray-500">Add items using the Carousel Editor</p>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      onClick={onClick}
      style={{ background: backgroundImage }}
      className="py-20 px-6 overflow-hidden cursor-pointer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          {componentProps.title && (
            <EditableTextArea
              className="text-4xl sm:text-5xl font-bold mb-4 w-full"
              style={{
                backgroundImage: `linear-gradient(to bottom right, ${colors.lightAccent}, ${colors.darkAccent})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
              fieldKey="title"
              componentId={id}
              value={componentProps.title}
              onChange={(val) => updateProp("title", val)}
            />
          )}

          {componentProps.subTitle && (
            <EditableTextArea
              className="text-lg w-full"
              style={{ color: colors.textColor, opacity: 0.8 }}
              fieldKey="subTitle"
              componentId={id}
              value={componentProps.subTitle}
              onChange={(val) => updateProp("subTitle", val)}
            />
          )}
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110"
            style={{ backgroundColor: colors.accentColor, color: '#ffffff' }}
            aria-label="Previous"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110"
            style={{ backgroundColor: colors.accentColor, color: '#ffffff' }}
            aria-label="Next"
          >
            <ChevronRight size={24} />
          </button>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
            {getVisibleItems().map((item, idx) => {
              const actualIndex = (currentIndex + idx) % safeItems.length;
              
              return (
                <motion.div
                  key={`${currentIndex}-${idx}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg"
                >
                  {/* Image */}
                  <div className="relative h-56 w-full">
                    <Image
                      src={item.image?.src || '/placeholder.webp'}
                      alt={item.image?.alt || item.title || 'Property image'}
                      fill
                      className="object-cover"
                    />
                    
                    {/* Status Badge */}
                    {item.extraInfo && (
                      <div 
                        className="absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-bold shadow-lg"
                        style={{ 
                          backgroundColor: colors.accentColor,
                          color: '#ffffff'
                        }}
                      >
                        {item.extraInfo}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <EditableTextArea
                      className="text-xl font-bold mb-2 w-full"
                      style={{
                        backgroundImage: `linear-gradient(to right, ${colors.lightAccent}, ${colors.darkAccent})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                      fieldKey={`items[${actualIndex}].title`}
                      componentId={id}
                      value={item.title || ""}
                      onChange={(val) => {
                        const newItems = [...safeItems];
                        newItems[actualIndex] = { ...newItems[actualIndex], title: val };
                        setCarousel(id, newItems);
                      }}
                    />

                    <EditableTextArea
                      className="text-sm leading-relaxed mb-4 w-full"
                      style={{ color: colors.textColor, opacity: 0.8 }}
                      isTextarea
                      rows={3}
                      fieldKey={`items[${actualIndex}].description`}
                      componentId={id}
                      value={item.description || ""}
                      onChange={(val) => {
                        const newItems = [...safeItems];
                        newItems[actualIndex] = { ...newItems[actualIndex], description: val };
                        setCarousel(id, newItems);
                      }}
                    />

                    {item.buttonText && (
                      <button
                        className="w-full py-2 px-4 rounded-lg font-semibold"
                        style={{
                          backgroundColor: colors.accentColor,
                          color: '#ffffff'
                        }}
                      >
                        {item.buttonText}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {safeItems.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(idx);
                }}
                className="rounded-full transition-all"
                style={{
                  backgroundColor: idx === currentIndex ? colors.accentColor : `${colors.textColor}30`,
                  width: idx === currentIndex ? '24px' : '8px',
                  height: '8px',
                }}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default PropertyCarouselEdit;