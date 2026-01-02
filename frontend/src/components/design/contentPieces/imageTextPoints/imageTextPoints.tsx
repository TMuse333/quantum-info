"use client";

import { BaseColorProps, ImageProp } from "@/types";
import { motion } from "framer-motion";
import Image from "next/image";


export interface ImageTextPointsProps extends BaseColorProps {
    title: string;
    description: string;
    buttonText: string;
  
    // Replace src/alt with ImageProp record
    images: {
      main: ImageProp; // first/main image
      // optional additional images
    };
  
    textArray: { title: string; description: string }[];
    reverse?: boolean;
  }

const ImageTextPoints = ({
  title,
  description,
  buttonText,
  images,
  baseBgColor,
  textColor,
  textArray,
  reverse = false,
}: ImageTextPointsProps) => {


const main = images.main

  return (
    <motion.section
      className="relative px-4 py-24"
      style={{ backgroundColor: baseBgColor, color: textColor }}
    >
      <div
        className={`mx-auto max-w-5xl flex flex-col ${
          reverse ? "md:flex-row-reverse" : "md:flex-row"
        } items-center gap-12`}
      >
        {/* Left side: header + paragraph */}
        <motion.div
          className="md:w-1/2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.h2 className="mb-8 text-center md:text-left text-3xl font-medium leading-tight sm:text-4xl md:text-5xl">
            {title}
          </motion.h2>
          <motion.p
            className="mb-12 max-w-lg mx-auto md:mx-0 text-center md:text-left text-base leading-relaxed md:text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {description}
          </motion.p>
        </motion.div>

        {/* Right side: image */}
        <motion.div
          className="md:w-1/2 max-w-sm rounded-lg overflow-hidden shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Image
            src={main.src}
            alt={main.alt}
            className="w-full h-auto object-cover rounded-lg"
            width={600}
            height={1300}
          />
        </motion.div>
      </div>

      {/* Points below (from textArray) */}
      <div className="mt-16 grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
        {textArray.map((point, index) => (
          <motion.div
            key={index}
            className="flex flex-col items-center text-center px-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 + index * 0.2 }}
          >
            <div className="mb-4 rounded-full bg-blue-200/50 px-4 py-2 text-sm font-medium text-gray-900">
              {point.title}
            </div>
            <p className="text-base leading-relaxed">{point.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Button scroll to #contact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="mt-12 text-center"
      >
        <motion.button
          onClick={() => {
            const el = document.getElementById("contact");
            if (el) {
              el.scrollIntoView({ behavior: "smooth" });
            }
          }}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          className="group relative flex w-fit mx-auto items-center gap-1.5 rounded-full bg-blue-200/30 px-6 py-3 text-gray-900 transition-colors hover:bg-blue-200/50"
        >
          {buttonText}
        </motion.button>
      </motion.div>
    </motion.section>
  );
};

export default ImageTextPoints;