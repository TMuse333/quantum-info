"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import { BaseComponentProps, ImageProp, GradientConfig } from "@/types";

export interface ProfileCredentialsProps extends BaseComponentProps {
  title: string;
  subTitle: string;
  description: string;
  images: {
    profile: ImageProp;
  };
  textArray: {
    title: string;
    description: string;
  }[];
  buttonText: string;
}

const ProfileCredentials: React.FC<ProfileCredentialsProps> = ({
  title,
  subTitle,
  description,
  images,
  textArray,
  buttonText,
  textColor,
  baseBgColor,
  mainColor,
  bgLayout,
}) => {
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
            className="text-lg"
            style={{ color: colors.textColor, opacity: 0.8 }}
          >
            {subTitle}
          </motion.p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2"
          >
            <div className="relative mb-8">
              <div className="relative w-full aspect-[4/5] max-w-md mx-auto lg:mx-0 rounded-2xl overflow-hidden shadow-2xl border-4"
                style={{ borderColor: colors.accentColor }}
              >
                <Image
                  src={images.profile.src}
                  alt={images.profile.alt}
                  fill
                  className="object-cover"
                />
              </div>
              <div 
                className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20 blur-2xl"
                style={{ backgroundColor: colors.accentColor }}
              />
            </div>

            <div className="prose prose-lg max-w-none">
              <p
                className="text-base md:text-lg leading-relaxed whitespace-pre-line"
                style={{ color: colors.textColor }}
              >
                {description}
              </p>
              <button
                className="mt-4 px-6 py-3 text-white rounded-lg"
                style={{ backgroundColor: colors.mainColor }}
                onClick={() => {
                }}
              >
                {buttonText}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full lg:w-1/2"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {textArray.map((credential, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-l-4 shadow-md hover:shadow-lg transition-shadow"
                  style={{ borderColor: colors.accentColor }}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                    style={{ 
                      background: `linear-gradient(135deg, ${colors.lightAccent}, ${colors.darkAccent})` 
                    }}
                  >
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>

                  <h3
                    className="text-lg font-bold mb-2"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${colors.lightAccent}, ${colors.darkAccent})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {credential.title}
                  </h3>

                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: colors.textColor, opacity: 0.8 }}
                  >
                    {credential.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default ProfileCredentials;

