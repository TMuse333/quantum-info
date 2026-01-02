"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useComponentEditor } from "@/context/context";
import {
  extractTextProps,
  handleComponentClick,
  useSyncColorEdits,
  useSyncLlmOutput,
  useSyncPageDataToComponent,
} from "@/lib/hooks/hooks";
import { EditorialComponentProps } from "@/types/editorial";
import EditableTextField from "@/components/editor/editableTextField/editableTextArea";
import { TestimonialsRealEstateProps, defaultTestimonialsRealEstateProps } from "./index";
import useWebsiteStore from "@/stores/websiteStore";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import { testimonialsRealEstateDetails } from "./index";
import ImageField from "@/components/editor/imageField/imageField";

const TestimonialsRealEstateEdit: React.FC<EditorialComponentProps> = ({ id }) => {
  const {
    setCurrentComponent,
    setAssistantMessage,
    setCurrentColorEdits,
    currentComponent,
    LlmCurrentTextOutput,
    currentColorEdits,
    setLlmCurrentTextOutput,
  } = useComponentEditor();

  const [componentProps, setComponentProps] = useState<TestimonialsRealEstateProps>(defaultTestimonialsRealEstateProps);

  // Merge with defaults to ensure all required props exist
  const propsWithDefaults = { ...defaultTestimonialsRealEstateProps, ...componentProps };

  // Ensure testimonials array is never empty
  const safeTestimonials = propsWithDefaults.testimonials.length > 0 ? propsWithDefaults.testimonials : defaultTestimonialsRealEstateProps.testimonials;

  // Safe color fallbacks
  const safeTextColor = propsWithDefaults.textColor ?? defaultTestimonialsRealEstateProps.textColor;
  const safeBaseBgColor = propsWithDefaults.baseBgColor ?? defaultTestimonialsRealEstateProps.baseBgColor;
  const safeMainColor = propsWithDefaults.mainColor ?? defaultTestimonialsRealEstateProps.mainColor;
  const safeBgLayout = propsWithDefaults.bgLayout ?? defaultTestimonialsRealEstateProps.bgLayout;

  const colors = deriveColorPalette(
    { textColor: safeTextColor, baseBgColor: safeBaseBgColor, mainColor: safeMainColor, bgLayout: safeBgLayout },
    safeBgLayout.type
  );
  const sectionRef = useRef(null);

  const updateComponentProps = useWebsiteStore((state) => state.updateComponentProps);
  const currentPageSlug = useWebsiteStore((state) => state.currentPageSlug);

  const updateProp = <K extends keyof TestimonialsRealEstateProps>(
    key: K,
    value: TestimonialsRealEstateProps[K]
  ) => {
    setComponentProps((prev) => ({ ...prev, [key]: value }));
    updateComponentProps(currentPageSlug, id, { [key]: value });
  };

  const updateTestimonial = (
    index: number,
    subKey: keyof (typeof defaultTestimonialsRealEstateProps.testimonials)[number],
    value: string
  ) => {
    const newTestimonials = [...safeTestimonials];
    newTestimonials[index] = { ...newTestimonials[index], [subKey]: value };
    updateProp("testimonials", newTestimonials);
  };

  const onClick = () => {
    handleComponentClick({
      currentComponent: currentComponent!,
      componentDetails: testimonialsRealEstateDetails,
      setCurrentComponent,
      setAssistantMessage,
    });
    setCurrentColorEdits({
      textColor: colors.textColor,
      baseBgColor: colors.baseBgColor,
      mainColor: colors.mainColor,
      bgLayout: colors.bgLayout,
    });
  };

  useSyncColorEdits(
    currentComponent?.name,
    "TestimonialsRealEstate",
    setComponentProps,
    currentColorEdits
  );

  useSyncLlmOutput(
    currentComponent?.name,
    "TestimonialsRealEstate",
    setComponentProps,
    LlmCurrentTextOutput,
    setLlmCurrentTextOutput,
    testimonialsRealEstateDetails.editableFields
  );

  useSyncPageDataToComponent(id, "TestimonialsRealEstate", setComponentProps);

  return (
    <motion.section
      onClick={onClick}
      ref={sectionRef}
      className="py-20 px-6"
      style={{ background: useAnimatedGradient(safeBgLayout, colors) }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <EditableTextField
            className="text-4xl sm:text-5xl font-bold mb-4 bg-clip-text text-transparent w-full"
            style={{
              backgroundImage: `linear-gradient(to bottom right, ${colors.lightAccent}, ${colors.darkAccent})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
            value={propsWithDefaults.title ?? ""}
            onChange={(val) => updateProp("title", val)}
            fieldKey="title"
            componentId={id}
          />

          {propsWithDefaults.description && (
            <EditableTextField
              className="text-lg max-w-2xl mx-auto w-full"
              style={{ color: colors.textColor }}
              value={propsWithDefaults.description ?? ""}
              onChange={(val) => updateProp("description", val)}
              isTextarea
              fieldKey="description"
              componentId={id}
            />
          )}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {safeTestimonials.map((testimonial, index) => (
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
              <EditableTextField
                className="text-base italic mb-6 flex-grow leading-relaxed w-full bg-transparent"
                style={{ color: colors.textColor }}
                value={testimonial.quote}
                onChange={(val) => updateTestimonial(index, "quote", val)}
                maxWords={50}
                isTextarea
                fieldKey={`testimonials[${index}].quote`}
                componentId={id}
              />

              {/* Author Info */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                <ImageField
                  componentId={id}
                  fieldKey={`testimonials[${index}].src`}
                  value={{ 
                    src: testimonial.src || "/placeholder.webp", 
                    alt: testimonial.alt || testimonial.name 
                  }}
                  onChange={(val) => {
                    const newTestimonials = [...safeTestimonials];
                    newTestimonials[index] = {
                      ...newTestimonials[index],
                      src: val.src,
                      alt: val.alt,
                    };
                    updateProp("testimonials", newTestimonials);
                  }}
                  className="w-14 h-14 border-2"
                  rounded={true}
                  style={{ borderColor: colors.accentColor }}
                />

                <div className="flex-1 min-w-0">
                  <EditableTextField
                    className="font-bold text-lg w-full bg-transparent"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${colors.lightAccent}, ${colors.darkAccent})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                    value={testimonial.name}
                    onChange={(val) => updateTestimonial(index, "name", val)}
                    maxWords={10}
                    fieldKey={`testimonials[${index}].name`}
                    componentId={id}
                  />

                  <EditableTextField
                    className="text-sm w-full bg-transparent"
                    style={{ color: colors.textColor, opacity: 0.7 }}
                    value={testimonial.role}
                    onChange={(val) => updateTestimonial(index, "role", val)}
                    maxWords={20}
                    fieldKey={`testimonials[${index}].role`}
                    componentId={id}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Star Rating Display */}
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
          <span className="ml-2 text-sm font-semibold" style={{ color: colors.textColor }}>
            5.0 from {safeTestimonials.length} reviews
          </span>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default TestimonialsRealEstateEdit;