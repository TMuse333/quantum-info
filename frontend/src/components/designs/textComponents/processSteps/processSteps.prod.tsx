"use client";

import React from "react";
import { motion } from "framer-motion";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import { GradientConfig } from "@/types";

export interface ProcessStepsProdProps {
  subTitle: string;
  title: string;
  description: string;
  textArray: {
    title: string;
    description: string;
  }[];
  textColor: string;
  baseBgColor: string;
  mainColor: string;
  bgLayout: GradientConfig;
}

const ProcessSteps: React.FC<ProcessStepsProdProps> = (props) => {
  const {
    subTitle,
    title,
    description,
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

  return (
    <motion.section
      className="w-full py-20 px-6"
      style={{ background: useAnimatedGradient(bgLayout, colors) }}
    >
      <div className="max-w-6xl mx-auto">
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
            className="text-4xl sm:text-5xl font-bold mb-6"
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
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg max-w-2xl mx-auto"
            style={{ color: colors.textColor }}
          >
            {description}
          </motion.p>
        </div>

        {/* Timeline Steps */}
        <div className="relative">
          {/* Connecting Line - hidden on mobile, visible on md+ */}
          <div 
            className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2"
            style={{
              background: `linear-gradient(to bottom, ${colors.lightAccent}, ${colors.darkAccent})`
            }}
          />

          {/* Steps */}
          <div className="space-y-12">
            {textArray.map((step, idx) => {
              const isEven = idx % 2 === 0;
              
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className={`flex flex-col md:flex-row items-center gap-6 ${
                    isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Content Card */}
                  <div className={`w-full md:w-5/12 ${isEven ? 'md:text-right' : 'md:text-left'} text-center`}>
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50">
                      <h3
                        className="text-2xl font-bold mb-3"
                        style={{
                          backgroundImage: `linear-gradient(to right, ${colors.lightAccent}, ${colors.darkAccent})`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        {step.title}
                      </h3>
                      <p
                        className="text-base leading-relaxed"
                        style={{ color: colors.textColor }}
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Step Number Circle */}
                  <div className="relative flex items-center justify-center md:w-2/12 z-10">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.1 + 0.2 }}
                      className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl border-4 border-white"
                      style={{
                        background: `linear-gradient(135deg, ${colors.lightAccent}, ${colors.darkAccent})`
                      }}
                    >
                      <span className="text-white text-2xl font-bold">
                        {idx + 1}
                      </span>
                    </motion.div>
                  </div>

                  {/* Empty space for layout balance on desktop */}
                  <div className="hidden md:block md:w-5/12" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default ProcessSteps;

