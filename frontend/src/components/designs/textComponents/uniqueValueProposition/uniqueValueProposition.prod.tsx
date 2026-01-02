"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import { ImageProp, GradientConfig } from "@/types";

export interface UniqueValuePropositionProdProps {
  subTitle: string;
  title: string;
  images: {
    icon1: ImageProp;
    icon2: ImageProp;
    icon3: ImageProp;
    icon4?: ImageProp;
    icon5?: ImageProp;
    icon6?: ImageProp;
  };
  textArray: {
    title: string;
    description: string;
  }[];
  textColor: string;
  baseBgColor: string;
  mainColor: string;
  bgLayout: GradientConfig;
}

const UniqueValueProposition: React.FC<UniqueValuePropositionProdProps> = (props) => {
  const {
    subTitle,
    title,
    images,
    textArray,
    textColor,
    baseBgColor,
    mainColor,
    bgLayout,
  } = props;

  const colors = deriveColorPalette(
    { textColor, baseBgColor, mainColor, bgLayout },
    bgLayout.type
  );

  const iconKeys = ['icon1', 'icon2', 'icon3', 'icon4', 'icon5', 'icon6'] as const;

  return (
    <motion.section
      className="w-full py-20 px-6"
      style={{ background: useAnimatedGradient(bgLayout, colors) }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-sm font-semibold uppercase tracking-wide mb-2"
            style={{ color: colors.accentColor }}
          >
            {subTitle}
          </motion.p>
          
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold"
            style={{
              backgroundImage: `linear-gradient(to bottom right, ${colors.lightAccent}, ${colors.darkAccent})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {title}
          </motion.h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {textArray.map((item, idx) => {
            const iconKey = iconKeys[idx % iconKeys.length];
            const icon = images[iconKey];

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
                className="flex flex-col items-center text-center p-8 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                {/* Icon */}
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-md"
                  style={{ 
                    background: `linear-gradient(135deg, ${colors.lightAccent}, ${colors.darkAccent})` 
                  }}
                >
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                    {icon && (
                      <Image
                        src={icon.src}
                        alt={icon.alt}
                        width={40}
                        height={40}
                        className="w-10 h-10 object-contain"
                      />
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3
                  className="text-2xl font-bold mb-4"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${colors.lightAccent}, ${colors.darkAccent})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  {item.title}
                </h3>

                {/* Description */}
                <p
                  className="text-base leading-relaxed"
                  style={{ color: colors.textColor }}
                >
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};

export default UniqueValueProposition;

