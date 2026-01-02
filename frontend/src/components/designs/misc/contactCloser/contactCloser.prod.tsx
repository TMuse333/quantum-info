"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, Facebook, Send } from "lucide-react";
import { GradientConfig } from "@/types";

export interface ContactCloserProdProps {
  title: string;
  description: string;
  buttonText: string;
  email: string;
  phone: string;
  facebookUrl: string;
  mainColor: string;
  textColor: string;
  baseBgColor: string;
  bgLayout: GradientConfig;
}

const ContactCloser: React.FC<ContactCloserProdProps> = (props) => {
  const {
    title,
    description,
    buttonText,
    email,
    phone,
    facebookUrl,
    mainColor,
    textColor,
    baseBgColor,
    bgLayout,
  } = props;

  const [emailInput, setEmailInput] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus("success");
      setEmailInput("");
      setMessage("");
      setTimeout(() => setSubmitStatus("idle"), 3000);
    }, 1000);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      style={{ backgroundColor: baseBgColor }}
      className="w-full py-24 px-6 relative overflow-hidden"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10"
          style={{ backgroundColor: mainColor }}
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full opacity-10"
          style={{ backgroundColor: mainColor }}
        />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-5xl md:text-6xl font-bold mb-6 text-center"
          style={{ color: textColor }}
        >
          {title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-xl md:text-2xl mb-16 leading-relaxed max-w-3xl mx-auto text-center opacity-90"
          style={{ color: textColor }}
        >
          {description}
        </motion.p>

        {/* Email Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full px-6 py-4 rounded-2xl text-lg focus:outline-none focus:ring-4 transition-all"
                style={{
                  backgroundColor: `${textColor}10`,
                  color: textColor,
                  borderWidth: "2px",
                  borderColor: `${mainColor}30`,
                }}
              />
            </div>
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your message (optional)"
                rows={4}
                className="w-full px-6 py-4 rounded-2xl text-lg focus:outline-none focus:ring-4 transition-all resize-none"
                style={{
                  backgroundColor: `${textColor}10`,
                  color: textColor,
                  borderWidth: "2px",
                  borderColor: `${mainColor}30`,
                }}
              />
            </div>
            <motion.button
              type="submit"
              disabled={isSubmitting || submitStatus === "success"}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-8 py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-70"
              style={{
                backgroundColor: mainColor,
                color: baseBgColor,
              }}
            >
              {isSubmitting ? (
                "Sending..."
              ) : submitStatus === "success" ? (
                "Sent Successfully!"
              ) : (
                <>
                  <Send size={20} />
                  {buttonText}
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Contact Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <motion.a
            href={`mailto:${email}`}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold transition-all shadow-lg hover:shadow-xl"
            style={{
              backgroundColor: `${mainColor}15`,
              color: mainColor,
              borderWidth: "2px",
              borderColor: mainColor,
            }}
          >
            <Mail size={22} />
            {email}
          </motion.a>

          <motion.a
            href={`tel:${phone.replace(/\D/g, "")}`}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold transition-all shadow-lg hover:shadow-xl"
            style={{
              backgroundColor: `${mainColor}15`,
              color: mainColor,
              borderWidth: "2px",
              borderColor: mainColor,
            }}
          >
            <Phone size={22} />
            {phone}
          </motion.a>

          <motion.a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold transition-all shadow-lg hover:shadow-xl"
            style={{
              backgroundColor: `${mainColor}15`,
              color: mainColor,
              borderWidth: "2px",
              borderColor: mainColor,
            }}
          >
            <Facebook size={22} />
            Facebook
          </motion.a>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default ContactCloser;

