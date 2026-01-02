"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import { ImageProp, GradientConfig } from "@/types";

export interface SplitScreenHeroProdProps {
  title: string;
  subTitle: string;
  description: string;
  buttonText: string;
  images: {
    agent: ImageProp;
    property: ImageProp;
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

const SplitScreenHero: React.FC<SplitScreenHeroProdProps> = (props) => {
  const {
    title,
    subTitle,
    description,
    buttonText,
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

  const agentImg = images.agent;
  const propertyImg = images.property;

  return (
    <section className="relative w-full h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Left Side - Agent Profile */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-16 relative"
        style={{ background: useAnimatedGradient(bgLayout, colors) }}
      >
        {/* Agent Photo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative mb-8"
        >
          <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 shadow-2xl"
            style={{ borderColor: colors.accentColor }}
          >
            <Image
              src={agentImg.src}
              alt={agentImg.alt}
              fill
              className="object-cover"
            />
          </div>
          {/* Decorative ring */}
          <div 
            className="absolute inset-0 w-48 h-48 md:w-64 md:h-64 rounded-full border-2 border-dashed animate-spin-slow"
            style={{ borderColor: `${colors.accentColor}60`, animationDuration: '20s' }}
          />
        </motion.div>

        {/* Agent Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center max-w-md"
        >
          <h1
            className="text-4xl md:text-5xl font-bold mb-3"
            style={{
              backgroundImage: `linear-gradient(to right, ${colors.lightAccent}, ${colors.darkAccent})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {title}
          </h1>

          <p
            className="text-xl md:text-2xl mb-4 font-medium"
            style={{ color: colors.textColor, opacity: 0.9 }}
          >
            {subTitle}
          </p>

          <p
            className="text-base md:text-lg mb-8 leading-relaxed"
            style={{ color: colors.textColor, opacity: 0.8 }}
          >
            {description}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {textArray.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 + idx * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border"
                style={{ borderColor: `${colors.accentColor}40` }}
              >
                <div
                  className="text-2xl md:text-3xl font-bold mb-1"
                  style={{ color: colors.accentColor }}
                >
                  {stat.title}
                </div>
                <div
                  className="text-xs md:text-sm font-medium"
                  style={{ color: colors.textColor, opacity: 0.8 }}
                >
                  {stat.description}
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA Button */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-all"
            style={{
              backgroundColor: colors.accentColor,
              color: colors.baseBgColor,
            }}
          >
            {buttonText}
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Right Side - Property Showcase */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full md:w-1/2 relative"
      >
        <Image
          src={propertyImg.src}
          alt={propertyImg.alt}
          fill
          className="object-cover"
          priority
        />
        {/* Gradient Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to left, transparent, ${colors.baseBgColor}15)`,
          }}
        />
      </motion.div>

      {/* Center Divider Line (Desktop) */}
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 z-10"
        style={{
          background: `linear-gradient(to bottom, transparent, ${colors.accentColor}, transparent)`,
        }}
      />
    </section>
  );
};

export default SplitScreenHero;

