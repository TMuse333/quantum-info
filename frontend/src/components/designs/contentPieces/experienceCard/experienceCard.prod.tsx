"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent, animate, useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useIsMobile } from "@/lib/hooks/isMobile";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import { ImageProp, GradientConfig, StandardText } from "@/types";

export interface ExperienceCardProdProps {
  title: string;
  subTitle: string;
  description: string;
  buttonText: string;
  images: {
    main: ImageProp;
  };
  array: (Omit<StandardText, "description">)[];
  baseBgColor: string;
  mainColor: string;
  textColor: string;
  bgLayout: GradientConfig;
  reverse?: boolean; // Optional variant prop
}

const ExperienceCard: React.FC<ExperienceCardProdProps> = (props) => {
  const {
    title,
    subTitle,
    description,
    buttonText,
    images,
    array,
    baseBgColor,
    mainColor,
    textColor,
    bgLayout,
  } = props;

  const mainImg = images.main;

  const ref = useRef(null);
  const imageRef = useRef(null);
  const descriptionRef = useRef(null);
  const skillsRef = useRef(null);

  const isMobile = useIsMobile(768);
  const [startAnimation, setStartAnimation] = useState(false);
  const [h2AnimationComplete, setH2AnimationComplete] = useState(false);
  const [startLiAnimation, setStartLiAnimation] = useState(false);

  const colors = deriveColorPalette({ textColor, baseBgColor, mainColor, bgLayout }, bgLayout.type);

  const skillsInView = useInView(skillsRef, { amount: 0.6 });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.7, 1, 1, 0.7]);

  useEffect(() => {
    if (skillsInView) setStartLiAnimation(true);
  }, [skillsInView]);

  useMotionValueEvent(scale, "change", (latestScale) => {
    if (latestScale === 1) setStartAnimation(true);
  });

  useEffect(() => {
    if (startAnimation && h2AnimationComplete) {
      const image = imageRef.current;
      const description = descriptionRef.current;
      if (image && description) {
        animate(image, { opacity: 1, y: 0 }, { ease: "easeInOut", delay: 0.2 });
        animate(description, { opacity: 1, x: 0 }, { ease: "easeInOut", delay: 0.4 });
      }
      if (!isMobile) setStartLiAnimation(true);
    }
  }, [startAnimation, h2AnimationComplete, isMobile]);

  const liVariants = useCallback(
    (delay: number, index: number) => ({
      initial: {
        opacity: 0,
        x: isMobile && index % 2 === 0 ? -20 : 20,
        y: !isMobile ? 20 : 0,
      },
      animate: {
        opacity: 1,
        x: 0,
        y: 0,
        transition: { delay: 0.3 + delay },
      },
    }),
    [isMobile]
  );

  return (
    <motion.section
      ref={ref}
      style={{ scale,
        background: useAnimatedGradient(bgLayout, colors),
         }}
      className="relative mx-auto w-[98vw] max-w-[1200px] rounded-3xl my-2 overflow-hidden shadow-2xl"
    >
      <motion.h2
        animate={{
          y: startAnimation ? 0 : -30,
          opacity: startAnimation ? 1 : 0,
        }}
        onAnimationComplete={() => setH2AnimationComplete(true)}
        className="text-center w-full text-3xl sm:text-4xl md:text-5xl mb-8 font-bold pt-8 md:pt-12 px-4"
        style={{ color: textColor }}
      >
        {title}
      </motion.h2>

      {subTitle && (
        <p className="text-center mb-4 text-lg text-white/90 font-medium">{subTitle}</p>
      )}

      <section className="flex flex-col md:px-8 lg:px-12 mx-auto gap-6 md:gap-8 py-4 md:py-8 md:flex-row">
        <motion.div
          ref={imageRef}
          className="w-full md:w-[45%] flex items-center justify-center opacity-0"
          style={{ y: 20 }}
        >
          <div className="relative w-[90vw] sm:w-[80vw] md:w-full max-w-[600px] rounded-2xl overflow-hidden shadow-xl border-4 border-white/20 backdrop-blur-sm">
            <Image
              src={mainImg.src}
              alt={mainImg.alt}
              width={600}
              height={1300}
              className="w-full h-[50vh] object-cover rounded-xl"
              sizes="(max-width: 768px) 90vw, (max-width: 1024px) 60vw, 600px"
              priority
            />
          </div>
        </motion.div>

        <motion.div
          ref={descriptionRef}
          className="w-full md:w-[55%] flex flex-col justify-center opacity-0 px-6 md:px-0"
          style={{ x: 20 }}
        >
          <p
            className="text-base md:text-lg lg:text-xl leading-relaxed whitespace-pre-line mb-6"
            style={{ color: textColor }}
          >
            {description}
          </p>

          {buttonText && (
            <Link href="#">
              <button
                className="font-semibold px-6 py-3 rounded-full transition-all duration-300 flex items-center gap-2 group"
                style={{
                  backgroundColor: mainColor,
                  color: colors.baseBgColor,
                }}
              >
                {buttonText}
                <ArrowRight
                style={{
                  color: colors.baseBgColor,
                }}
                size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          )}
        </motion.div>
      </section>

      <section className="w-full py-8 md:py-12" ref={skillsRef}>
        <ul className="mx-auto mt-4 md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:px-8 lg:px-12 pb-8 w-full">
          {array.map((item, index) => (
            <motion.li
              key={index}
              style={{
                borderColor:colors.accentColor
              }}
              className="mb-4 w-[90%] max-w-[400px] mx-auto p-4 bg-white/10 backdrop-blur-md rounded-xl flex items-center gap-3 text-left md:w-full border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-300"
              variants={liVariants(isMobile ? index * 0.2 : index * 0.1, index)}
              initial="initial"
              animate={startLiAnimation && h2AnimationComplete ? "animate" : "initial"}
            >
              <CheckCircle2 size={20} className="text-white flex-shrink-0" />
              <span 
              style={{
                color:colors.textColor,
               
              }}
              className="font-medium">{item.title}</span>
            </motion.li>
          ))}
        </ul>
      </section>
    </motion.section>
  );
};

export default ExperienceCard;

