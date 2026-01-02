"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import { GradientConfig, CarouselItem } from "@/types";

export interface CarouselHeroProdProps {
  title: string;
  subTitle: string;
  description: string;
  buttonText: string;
  items: CarouselItem[];
  textColor: string;
  baseBgColor: string;
  mainColor: string;
  bgLayout: GradientConfig;
}

const CarouselHero: React.FC<CarouselHeroProdProps> = (props) => {
  const {
    title,
    subTitle,
    description,
    buttonText,
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
  const backgroundImage = useAnimatedGradient(bgLayout, colors);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [tabProgress, setTabProgress] = useState(0);

  // Auto-slide progress
  useEffect(() => setTabProgress(0), [currentIndex]);
  useEffect(() => {
    if (tabProgress >= 100 && items.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }
  }, [tabProgress, items.length]);
  useEffect(() => {
    const interval = setInterval(() => {
      if (tabProgress < 100) setTabProgress((prev) => prev + 0.5);
    }, 50);
    return () => clearInterval(interval);
  }, [tabProgress]);

  return (
    <motion.section
      className="w-full"
      style={{ background: backgroundImage }}
    >
      <section className="flex flex-col md:flex-row md:h-screen relative items-center mx-auto max-w-[2200px] md:mt-[-4rem] gap-8 px-4">
        {/* Left Text Section */}
        <section className="flex flex-col md:w-[40vw] justify-center items-start py-8 px-6 space-y-6">
          <span className="text-xl font-medium" style={{ color: mainColor }}>{subTitle}</span>
          <h1
            className="text-3xl md:text-5xl font-bold"
            style={{
              backgroundImage: `linear-gradient(to right, ${mainColor}, ${textColor})`,
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            {title}
          </h1>
          <p className="text-lg md:text-xl" style={{ color: textColor }}>{description}</p>
          <button
            className="mt-6 px-8 py-3 rounded-xl font-bold text-lg"
            style={{ backgroundColor: mainColor, color: baseBgColor }}
          >
            {buttonText}
          </button>
        </section>

        {/* Right Carousel Section */}
        <section className="relative w-full md:w-[60vw] bg-black rounded-2xl mx-auto h-[70vh] md:h-[80vh] border-4 border-white overflow-hidden">
          <AnimatePresence mode="wait">
            {items.length > 0 && (
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full flex-shrink-0 snap-start rounded-3xl overflow-hidden"
              >
                <div className="relative w-full h-full">
                  <Image
                    src={items[currentIndex].image.src}
                    alt={items[currentIndex].image.alt}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-full px-8">
                  <div className="text-white text-center bg-black/60 p-3 rounded-lg text-lg font-medium">
                    {items[currentIndex].description}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress Tabs */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
            {items.map((_, idx) => (
              <div
                key={idx}
                className="h-2 w-12 bg-gray-600 rounded-full cursor-pointer hover:scale-110 transition-transform"
                onClick={() => setCurrentIndex(idx)}
              >
                {idx === currentIndex && (
                  <div
                    className="bg-white h-full rounded-full"
                    style={{ width: `${tabProgress}%`, transition: "width 0.05s linear" }}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      </section>
    </motion.section>
  );
};

export default CarouselHero;

