"use client";

import React, { useState } from "react";
import Image from "next/image";
import { BaseColorProps } from "@/types";

export interface Testimonials3Props
extends BaseColorProps {
    testimonials: {
      name: string;
      role: string;
      quote: string;
      src?: string;
      alt?: string;
    }[];
    title:string,
    description:string
  }


const Testimonials3: React.FC<Testimonials3Props> = ({
  title ,
  description,
  textColor ,
  baseBgColor, 
  mainColor,
  testimonials = [],
  bgLayout,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () =>
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);

  const prevTestimonial = () =>
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );

  // You can derive accent color from mainColor or bgLayout if needed
  const accentColor = mainColor;

  return (
    <section
      className="py-16"
      style={{
        background: baseBgColor,
        color: textColor,
      }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        {title && (
          <h2
            className="text-3xl md:text-4xl font-bold text-center mb-2"
            style={{ color: textColor }}
          >
            {title}
          </h2>
        )}
        {description && (
          <p
            className="text-lg sm:text-xl md:text-2xl text-center mb-10"
            style={{ color: textColor }}
          >
            {description}
          </p>
        )}

        {/* Carousel */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {testimonials.map((testimonial, index) => (
              <div key={index} className="min-w-full flex justify-center">
                <div
                  className="p-8 rounded-xl shadow-lg w-full max-w-2xl border border-2"
                  style={{
                    background: "#ffffff",
                    borderColor: accentColor,
                  }}
                >
                  <p
                    className="text-lg italic mb-6"
                    style={{ color: textColor }}
                  >
                    &quot;{testimonial.quote}&quot;
                  </p>
                  <div className="text-center">
                    <h3
                      className="text-xl font-semibold mb-2"
                      style={{ color: textColor }}
                    >
                      {testimonial.name}
                    </h3>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                    {testimonial.src && (
                      <div className="mt-4">
                        <Image
                          src={testimonial.src}
                          alt={testimonial.alt || testimonial.name}
                          className="w-16 h-16 rounded-full object-cover mx-auto mb-4"
                          width={80}
                          height={80}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevTestimonial}
            className="absolute top-1/2 left-0 transform -translate-y-1/2 text-white p-2 rounded-full hover:opacity-80 transition-colors"
            style={{ background: accentColor }}
            aria-label="Previous testimonial"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={nextTestimonial}
            className="absolute top-1/2 right-0 transform -translate-y-1/2 text-white p-2 rounded-full hover:opacity-80 transition-colors"
            style={{ background: accentColor }}
            aria-label="Next testimonial"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Carousel Dots */}
          <div className="flex justify-center mt-6 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className="w-3 h-3 rounded-full"
                style={{
                  background: index === currentIndex ? accentColor : "#d1d5db",
                }}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials3;