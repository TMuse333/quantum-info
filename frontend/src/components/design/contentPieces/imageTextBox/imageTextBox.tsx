"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useInView, Variants } from "framer-motion";
import { BaseColorProps, BaseTextProps, ImageProp } from "@/types";



export interface ImageTextBoxProps
  extends BaseColorProps,
    Omit<BaseTextProps, "subTitle"> {
  images: {
    main: ImageProp; // single main image
  };
  objectContain?: boolean;
  reverse?: boolean;
}

const ImageTextBox = ({
 images,
  title,
  description,
  reverse = false,
  baseBgColor,
  textColor,
  objectContain = false,
}: ImageTextBoxProps): React.JSX.Element => {
  const headerRef = useRef<HTMLHeadingElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const pRef = useRef<HTMLParagraphElement>(null);

  const headerInView = useInView(headerRef, { once: true });
  const imgInView = useInView(imgRef, { once: true });
  const pInView = useInView(pRef, { once: true });

  const fadeIn = (delay: number): Variants => ({
    initial: { opacity: 0, x: reverse ? -100 : 100 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.4, delay, ease: "easeInOut" } },
  });

  const imageFadeIn = (delay: number): Variants => ({
    initial: { opacity: 0, x: reverse ? 50 : -50 },
    animate: { opacity: 1, x: 0, transition: { delay, ease: "easeInOut" } },
  });

  const main = images.main

  return (
    <>
      <motion.h2
        ref={headerRef}
        variants={fadeIn(0)}
        initial="initial"
        animate={headerInView ? "animate" : "initial"}
        className={`text-center text-4xl relative z-[2] md:hidden font-cursive ${textColor || ""}`}
      >
        {title}
      </motion.h2>

      <section
        className={`overflow-x-hidden flex flex-col justify-center items-center pt-8 pb-8 relative mx-auto max-w-[1200px] ${
          reverse ? "md:flex-row-reverse" : "md:flex-row"
        } ${baseBgColor || ""} `}
        style={{
          color:`${textColor}`
        }}
      >
        <motion.div
          ref={imgRef}
          variants={imageFadeIn(0.2)}
          initial="initial"
          animate={imgInView ? "animate" : "initial"}
        >
          <Image
            width={600}
            height={1300}
            className={`rounded-xl relative md:w-[50vw] w-[90vw] h-[80vh] md:h-[55vw] max-h-[567px] max-w-[668px] mx-auto ${
              objectContain ? "object-contain" : "object-cover object-[100%]"
            }`}
            src={main.src}
            alt={main.alt || "Image"}
          />
        </motion.div>

        <div className="w-screen md:w-[45vw] pr-4 md:pr-0 md:mb-auto md:mt-12">
          <motion.h2
            variants={fadeIn(0)}
            initial="initial"
            animate={imgInView ? "animate" : "initial"}
            className="hidden md:block text-left pl-5 sm:pl-12 pt-5 sm:text-4xl font-semibold text-3xl pr-3 font-cursive"
          >
            {title}
          </motion.h2>

          <motion.p
            ref={pRef}
            className="mt-6 pl-5 text-left sm:pl-12 pr-4"
            variants={fadeIn(0.2)}
            initial="initial"
            animate={pInView ? "animate" : "initial"}
          >
            {description}
          </motion.p>
        </div>
      </section>
    </>
  );
};

export default ImageTextBox;