"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import { BaseColorProps, ImageProp } from "@/types";

export interface TextAndListProps extends BaseColorProps {
    subTitle: string;
    title: string;
    images: {
        main: ImageProp;
      };
    description: string;
    textArray: {
      title: string;
      description: string;
    }[];

  }

const TextAndList: React.FC<TextAndListProps> = ({
  subTitle,
  title,
  images,
  description,
  textArray,
  textColor = "#000000",
  baseBgColor = "#f0f9ff",
  mainColor = "#3B82F6",
  bgLayout = { type: "radial" },
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [page, setPage] = useState(0);

  const itemsPerPage = 3;
  const totalPages = Math.ceil(textArray.length / itemsPerPage);
  const currentItems = textArray.slice(
    page * itemsPerPage,
    page * itemsPerPage + itemsPerPage
  );

  const colors = deriveColorPalette({ textColor, baseBgColor, mainColor, bgLayout });

  const main = images.main

  return (
    <motion.section
      className="w-full py-20 px-6"
      style={{ background:useAnimatedGradient(colors.bgLayout,colors) }}
    >
      <div className="flex flex-col md:flex-row items-center max-w-6xl mx-auto gap-12">
        {/* Left side image */}
        <div className="w-full md:w-1/2 flex justify-center">
          <div className="h-72 w-72 md:h-96 md:w-96 rounded-full overflow-hidden border-4 border-blue-200 shadow-xl">
            <Image
              src={main.src}
              alt={main.alt}
              width={384}
              height={384}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right side content */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
          {subTitle && (
            <p style={{ color: colors.textColor }} className="text-blue-600 font-medium">
              {subTitle}
            </p>
          )}

          {title && (
            <h2
              className="text-3xl sm:text-5xl font-semibold bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(to bottom right, ${colors.lightAccent}, ${colors.darkAccent})`,
              }}
            >
              {title}
            </h2>
          )}

          {description && (
            <p
              className="my-6 text-base leading-relaxed max-w-lg w-full"
              style={{ color: colors.textColor }}
            >
              {description}
            </p>
          )}

          {/* Accordion cards */}
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full space-y-4 min-h-[300px]"
            >
              {currentItems.map((item, idx) => {
                const actualIndex = idx + page * itemsPerPage;
                const isExpanded = expandedIndex === actualIndex;

                return (
                  <motion.div
                    key={actualIndex}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 * idx }}
                    className="bg-white/50 w-full border border-blue-300/40 rounded-2xl p-4 cursor-pointer"
                    onClick={() =>
                      setExpandedIndex(isExpanded ? null : actualIndex)
                    }
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className="font-bold text-lg flex-1"
                        style={{
                          backgroundImage: `linear-gradient(to bottom right, ${colors.lightAccent}, ${colors.darkAccent})`,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        {item.title}
                      </span>
                      <span className="text-xl">{isExpanded ? "−" : "+"}</span>
                    </div>

                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={
                        isExpanded
                          ? { height: "auto", opacity: 1 }
                          : { height: 0, opacity: 0 }
                      }
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p
                        className="mt-2 text-gray-700 text-sm md:text-base"
                        style={{ color: colors.textColor }}
                      >
                        {item.description}
                      </p>
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex mt-6 gap-4">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                disabled={page === 0}
                className="px-4 py-2 rounded-xl font-semibold shadow-sm transition"
                style={{
                  backgroundColor: page === 0 ? "#d1d5db" : colors.accentColor,
                  color: page === 0 ? "#6b7280" : "#ffffff",
                }}
              >
                Previous
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 rounded-xl font-semibold shadow-sm transition"
                style={{
                  backgroundColor:
                    page >= totalPages - 1 ? "#d1d5db" : colors.accentColor,
                  color: page >= totalPages - 1 ? "#6b7280" : "#ffffff",
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default TextAndList;