"use client";

import React, { useState, useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useInView } from "framer-motion";
import Image from "next/image";
import axios from "axios";
import { FacebookLogo, InstagramLogo, LinkedinLogo } from "phosphor-react";

import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import { Variants } from "framer-motion";
import { BaseComponentProps, ImageProp } from "@/types";

export interface ContactCloserProps extends
BaseComponentProps {
  images:{
    main:ImageProp
  }
}


const fadeInUp:Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

// const staggerItem = {
//   hidden: { opacity: 0, x: -20 },
//   visible: (i: number) => ({
//     opacity: 1,
//     x: 0,
//     transition: { duration: 0.5, delay: 0.6 + i * 0.2, ease: "easeOut" },
//   }),
// };

const ContactCloser: React.FC<ContactCloserProps> = ({
  images,
  title,
  description,
  buttonText,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  // Use colors from hook
  const componentColors = deriveColorPalette({
    textColor: "#111111",
    baseBgColor: "#dbeafe",
    mainColor: "#00bfff",
    bgLayout: { type: "solid" },
  }, "solid");

  const background = useAnimatedGradient({ type: "solid" }, componentColors);

  const color = useMotionValue(componentColors.mainColor);
  const border = useMotionTemplate`2px solid ${color}`;
  const boxShadow = useMotionTemplate`0px 8px 32px ${color}`;

  const socialLinks = [
    { name: "Facebook", href: "https://www.facebook.com/", icon: FacebookLogo, color: "bg-[#1877F2]" },
    { name: "Instagram", href: "https://www.instagram.com/", icon: InstagramLogo, gradient: "from-[#833AB4] via-[#FD1D1D] to-[#FCB045]" },
    { name: "LinkedIn", href: "https://www.linkedin.com/", icon: LinkedinLogo, color: "bg-[#0A66C2]" },
  ];

  const main = images.main

  const [formData, setFormData] = useState<Record<string, string>>({
    name: "",
    email: "",
    phone: "",
    intention: "",
    extras: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("https://www.naderomarrealtor.com/api/sendEmail", formData);
      setSuccess("Form submitted successfully!");
      setFormData({ name: "", email: "", phone: "", intention: "", extras: "" });
      setError(null);
    } catch (err) {
      setError("Failed to submit form. Please try again.");
      setSuccess(null);
      console.log(err);
    }
  };

  return (
    <motion.section
      ref={sectionRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="relative w-full max-w-5xl mx-auto my-12 px-4 py-16 text-gray-900 overflow-hidden rounded-xl"
      style={{ background }}
    >
      <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
        {/* Left Side */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
          <div
            className="h-24 w-24 md:h-48 md:w-48 rounded-full overflow-hidden border-4 shadow-xl mb-6"
            style={{ borderColor: componentColors.mainColor, boxShadow: boxShadow.get() }}
          >
            <Image
              src={main.src}
              alt={main.alt}
              className="h-full w-full object-cover"
              width={600}
              height={600}
            />
          </div>

          <motion.h2
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={fadeInUp}
            className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-6"
            style={{ color: componentColors.mainColor }}
          >
            {title}
          </motion.h2>

          <motion.p
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={fadeInUp}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg max-w-2xl leading-relaxed mb-8 whitespace-pre-line"
            style={{ color: componentColors.textColor }}
          >
            {description}
          </motion.p>
        </div>

        {/* Right Side Form */}
        <form
          onSubmit={handleSubmit}
          className="w-full md:w-1/2 flex flex-col justify-center items-center"
        >
          <p className="font-semibold mt-[-3rem] mb-4 sm:text-lg" style={{ color: componentColors.textColor }}>
            Fill in this form with your real estate needs and I will gladly get back to you shortly
          </p>

          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            className="border-2 w-full font-bold p-3 rounded-lg mb-4"
            style={{
              borderColor: componentColors.mainColor,
              backgroundColor: `${componentColors.mainColor}30`,
              color: componentColors.textColor,
            }}
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            className="border-2 w-full font-bold p-3 rounded-lg mb-4"
            style={{
              borderColor: componentColors.mainColor,
              backgroundColor: `${componentColors.mainColor}30`,
              color: componentColors.textColor,
            }}
          />

          {error && <p className="text-red-600 mb-4">{error}</p>}
          {success && <p className="text-green-600 mb-4">{success}</p>}

          <motion.button
            type="submit"
            style={{ border: border.get(), boxShadow: boxShadow.get(), backgroundColor: componentColors.mainColor, color: componentColors.baseBgColor }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative inline-flex items-center gap-2 rounded-full px-8 py-4 text-lg font-semibold transition-colors"
          >
            {buttonText}
            <motion.span className="inline-block" transition={{ duration: 0.3 }} whileHover={{ x: 5 }}>
              →
            </motion.span>
          </motion.button>
        </form>
      </div>
    </motion.section>
  );
};

export default ContactCloser;