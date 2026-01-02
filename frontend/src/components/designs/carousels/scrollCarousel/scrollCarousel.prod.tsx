"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import { CarouselItem, GradientConfig } from "@/types";

export interface ScrollCarouselProdProps {
  items: CarouselItem[];
  textColor: string;
  baseBgColor: string;
  mainColor: string;
  bgLayout: GradientConfig;
}

const ScrollCarousel: React.FC<ScrollCarouselProdProps> = (props) => {
  const {
    items,
    textColor,
    baseBgColor,
    mainColor,
    bgLayout,
  } = props;

  const scrollRef = useRef<HTMLDivElement>(null);
  const colors = deriveColorPalette(
    { textColor, baseBgColor, mainColor, bgLayout },
    bgLayout.type
  );
  const backgroundImage = useAnimatedGradient(bgLayout, colors);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 420; // Card width + gap
      scrollRef.current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section
      className="relative w-full py-16 px-4 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Navigation Buttons */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => scroll("left")}
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
            onClick={() => scroll("right")}
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
            {items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="flex-shrink-0 snap-start w-[350px] rounded-3xl bg-white 
                  shadow-xl hover:shadow-2xl transition-all duration-300
                  border-2 hover:border-blue-300 overflow-hidden group relative"
                style={{ borderColor: `${colors.mainColor}20` }}
              >
                {/* Decorative gradient overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: `linear-gradient(to bottom right, ${colors.mainColor}10, ${colors.accentColor}10)`,
                  }}
                />

                {/* Image Container */}
                <div className="relative w-full h-56 overflow-hidden bg-gradient-to-br from-blue-100 to-cyan-100">
                  <Image
                    src={item.image.src}
                    alt={item.image.alt}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    width={800}
                    height={400}
                    sizes="350px"
                  />
                  {/* Overlay gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Content */}
                <div className="p-6 relative z-10">
                  {/* Date badge (if extraInfo is used as date) */}
                  {item.extraInfo && (
                    <div className="flex items-center gap-2 text-sm mb-3" style={{ color: colors.textColor }}>
                      <Calendar size={16} style={{ color: colors.mainColor }} />
                      <span>{item.extraInfo}</span>
                    </div>
                  )}

                  {/* Title */}
                  <h5
                    className="text-xl font-bold mb-3 line-clamp-2"
                    style={{
                      background: `linear-gradient(to right, ${colors.mainColor}, ${colors.accentColor})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {item.title}
                  </h5>

                  {/* Description */}
                  <p className="text-sm leading-relaxed line-clamp-3 mb-4" style={{ color: colors.textColor }}>
                    {item.description}
                  </p>

                  {/* CTA Button */}
                  {item.buttonText && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{ backgroundColor: colors.mainColor, color: colors.baseBgColor }}
                      className="w-full flex items-center justify-center gap-2 
                        px-4 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg 
                        transition-all duration-300 group/btn"
                    >
                      {item.buttonText}
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </motion.button>
                  )}
                </div>

                {/* Bottom accent */}
                <div
                  className="h-1 group-hover:h-2 transition-all duration-300"
                  style={{
                    background: `linear-gradient(to right, ${colors.mainColor}, ${colors.accentColor})`,
                  }}
                />
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
    </section>
  );
};

export default ScrollCarousel;

