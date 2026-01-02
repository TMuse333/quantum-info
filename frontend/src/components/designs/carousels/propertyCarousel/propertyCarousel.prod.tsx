"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import { CarouselItem, GradientConfig } from "@/types";

export interface PropertyCarouselProdProps {
  title: string;
  subTitle: string;
  items: CarouselItem[];
  textColor: string;
  baseBgColor: string;
  mainColor: string;
  bgLayout: GradientConfig;
}

const PropertyCarousel: React.FC<PropertyCarouselProdProps> = (props) => {
  const {
    title,
    subTitle,
    items,
    textColor,
    baseBgColor,
    mainColor,
    bgLayout,
  } = props;

  const colors = deriveColorPalette(
    { textColor, baseBgColor, mainColor, bgLayout },
    bgLayout.type
  );
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Show 3 cards at once on desktop, 1 on mobile
  const visibleCards = 3;
  const getVisibleItems = () => {
    const visible = [];
    for (let i = 0; i < visibleCards; i++) {
      visible.push(items[(currentIndex + i) % items.length]);
    }
    return visible;
  };

  return (
    <motion.section
      className="py-20 px-6 overflow-hidden"
      style={{ background: useAnimatedGradient(bgLayout, colors) }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-bold mb-4"
            style={{
              backgroundImage: `linear-gradient(to bottom right, ${colors.lightAccent}, ${colors.darkAccent})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg"
            style={{ color: colors.textColor, opacity: 0.8 }}
          >
            {subTitle}
          </motion.p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110"
            style={{ backgroundColor: colors.accentColor, color: '#ffffff' }}
            aria-label="Previous"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110"
            style={{ backgroundColor: colors.accentColor, color: '#ffffff' }}
            aria-label="Next"
          >
            <ChevronRight size={24} />
          </button>

          {/* Cards Grid - Responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
            {getVisibleItems().map((item, idx) => (
              <motion.div
                key={`${currentIndex}-${idx}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow"
              >
                {/* Image */}
                <div className="relative h-56 w-full">
                  <Image
                    src={item.image.src}
                    alt={item.image.alt}
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
                  {item.title && (
                    <h3
                      className="text-xl font-bold mb-2"
                      style={{
                        backgroundImage: `linear-gradient(to right, ${colors.lightAccent}, ${colors.darkAccent})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      {item.title}
                    </h3>
                  )}

                  {item.description && (
                    <p
                      className="text-sm leading-relaxed mb-4"
                      style={{ color: colors.textColor, opacity: 0.8 }}
                    >
                      {item.description}
                    </p>
                  )}

                  {item.buttonText && (
                    <button
                      className="w-full py-2 px-4 rounded-lg font-semibold transition-all hover:shadow-md"
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
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: idx === currentIndex ? colors.accentColor : `${colors.textColor}30`,
                  width: idx === currentIndex ? '24px' : '8px',
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

export default PropertyCarousel;

