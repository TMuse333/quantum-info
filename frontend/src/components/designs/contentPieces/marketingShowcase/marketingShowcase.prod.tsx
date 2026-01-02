"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Camera, 
  Video, 
  Globe, 
  Mail, 
  Share2, 
  FileText, 
  TrendingUp, 
  Users,
  Megaphone,
  Zap,
  Target,
  Award
} from "lucide-react";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import { GradientConfig } from "@/types";

// Icon mapping for variety
const iconMap: { [key: number]: React.ElementType } = {
  0: Camera,
  1: Video,
  2: Globe,
  3: Mail,
  4: Share2,
  5: FileText,
  6: TrendingUp,
  7: Users,
  8: Megaphone,
  9: Zap,
  10: Target,
  11: Award,
};

export interface MarketingShowcaseProdProps {
  title: string;
  subTitle: string;
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

const MarketingShowcase: React.FC<MarketingShowcaseProdProps> = (props) => {
  const {
    title,
    subTitle,
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
      className="py-20 px-6"
      style={{ background: useAnimatedGradient(bgLayout, colors) }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
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
            className="text-xl md:text-2xl font-semibold mb-4"
            style={{ color: colors.accentColor }}
          >
            {subTitle}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base md:text-lg max-w-3xl mx-auto"
            style={{ color: colors.textColor, opacity: 0.8 }}
          >
            {description}
          </motion.p>
        </div>

        {/* Marketing Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {textArray.map((service, idx) => {
            const Icon = iconMap[idx % Object.keys(iconMap).length];
            
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="relative group"
              >
                {/* Card */}
                <div className="h-full bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-current"
                  style={{ 
                    borderColor: 'transparent',
                  }}
                >
                  {/* Icon Container */}
                  <div className="relative mb-4">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform"
                      style={{ 
                        background: `linear-gradient(135deg, ${colors.lightAccent}, ${colors.darkAccent})` 
                      }}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    {/* Decorative glow */}
                    <div 
                      className="absolute inset-0 w-16 h-16 rounded-xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity"
                      style={{ backgroundColor: colors.accentColor }}
                    />
                  </div>

                  {/* Title */}
                  <h3
                    className="text-lg font-bold mb-2"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${colors.lightAccent}, ${colors.darkAccent})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {service.title}
                  </h3>

                  {/* Description */}
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: colors.textColor, opacity: 0.75 }}
                  >
                    {service.description}
                  </p>

                  {/* Checkmark Badge */}
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: colors.accentColor }}
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p
            className="text-lg font-semibold"
            style={{ color: colors.textColor }}
          >
            Everything you need for maximum visibility and impact
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default MarketingShowcase;

