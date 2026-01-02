"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import { GradientConfig } from "@/types";

export interface TestimonialsRealEstateProdProps {
  title: string;
  description: string;
  testimonials: {
    name: string;
    role: string;
    quote: string;
    src: string;
    alt: string;
  }[];
  textColor: string;
  baseBgColor: string;
  mainColor: string;
  bgLayout: GradientConfig;
}

const TestimonialsRealEstate: React.FC<TestimonialsRealEstateProdProps> = (props) => {
  const {
    title,
    description,
    testimonials,
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
            animate={{ opacity: 1, y: 0 }}
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
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg max-w-2xl mx-auto"
            style={{ color: colors.textColor }}
          >
            {description}
          </motion.p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 flex flex-col"
            >
              {/* Quote Icon */}
              <div className="mb-4">
                <svg
                  className="w-10 h-10 opacity-20"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: colors.accentColor }}
                >
                  <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
                </svg>
              </div>

              {/* Quote */}
              <p
                className="text-base italic mb-6 flex-grow leading-relaxed"
                style={{ color: colors.textColor }}
              >
                &quot;{testimonial.quote}&quot;
              </p>

              {/* Author Info */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                <div className="flex-shrink-0">
                  <Image
                    src={testimonial.src}
                    alt={testimonial.alt}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full object-cover border-2"
                    style={{ borderColor: colors.accentColor }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4
                    className="font-bold text-lg"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${colors.lightAccent}, ${colors.darkAccent})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {testimonial.name}
                  </h4>
                  <p
                    className="text-sm"
                    style={{ color: colors.textColor, opacity: 0.7 }}
                  >
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Optional: Star Rating Display */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex justify-center items-center gap-2 mt-12"
        >
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 20 20"
              style={{ color: colors.accentColor }}
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span
            className="ml-2 text-sm font-semibold"
            style={{ color: colors.textColor }}
          >
            5.0 from {testimonials.length} reviews
          </span>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default TestimonialsRealEstate;

