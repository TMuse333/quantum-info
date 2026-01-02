"use client";

import { motion, useMotionTemplate } from "framer-motion";
import Image from "next/image";

import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import { BaseComponentProps, ImageProp } from "@/types";

export interface AuroraImageHeroProps extends BaseComponentProps {
    // Since this component only needs one main image,
    // you can give it a descriptive key like "main", "hero", or "background"
    images: {
      main: ImageProp;
    };
  }

const AuroraImageHero: React.FC<AuroraImageHeroProps> = ({
  textColor,
  baseBgColor,
  mainColor,
  bgLayout,
images,
  subTitle,
  title,
  description,
  buttonText,
}) => {
  // Derive colors for the gradient button/borders etc.
  const colors = deriveColorPalette({ textColor, baseBgColor, mainColor, bgLayout }, bgLayout.type);

  // Animated background for the hero
  const backgroundImage = useAnimatedGradient(bgLayout, colors);

  const border = useMotionTemplate`2px solid ${colors.mainColor}`;
  const boxShadow = useMotionTemplate`0px 8px 32px ${colors.mainColor}`;

  const mainImage = images.main

  return (
    <motion.section
      style={{ background: backgroundImage, color: colors.textColor }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="relative grid min-h-screen place-content-center overflow-hidden px-4 py-24"
    >
      <div className="relative z-10 flex flex-col md:flex-row items-center max-w-5xl mx-auto gap-8">
        {/* Left side - Image */}
        <div className="w-full md:w-1/2 flex justify-center">
          <div
            className="h-64 w-64 md:h-96 md:w-96 rounded-full overflow-hidden shadow-xl"
            style={{ border: border.get() }}
          >
            <Image
              priority
              width={600}
              height={600}
              src={mainImage.src}
              alt={mainImage.alt}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Right side - Text & Button */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left space-y-4">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-4 inline-block rounded-full px-3 py-1.5 text-base sm:text-lg font-semibold"
            style={{ color: colors.mainColor }}
          >
            {subTitle}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            style={{
              backgroundImage: `linear-gradient(to right, ${colors.mainColor}, ${colors.textColor})`,
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
            className="max-w-3xl text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight"
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            style={{ color: colors.textColor }}
            className="my-6 max-w-xl text-lg sm:text-xl md:text-2xl leading-relaxed font-medium"
          >
            {description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            <motion.button
              style={{ border: border.get(), boxShadow: boxShadow.get(), color: colors.textColor }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative flex w-fit items-center gap-2 rounded-full px-8 py-4 text-xl sm:text-2xl font-bold transition-colors"
            >
              <span>{buttonText}</span>
              <motion.span className="inline-block" transition={{ duration: 0.3 }} whileHover={{ x: 5 }}>
                →
              </motion.span>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default AuroraImageHero;