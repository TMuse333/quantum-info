// components/testimonials3/testimonials3Edit.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { EditorialComponentProps } from "@/types/editorial";
import { GradientConfig, BaseColorProps } from "@/types";; // Import BaseColorProps
import { defaultTestimonials3Props, Testimonials3Props } from ".";
import { useComponentEditor } from "@/context/context";
import { handleComponentClick, useSyncLlmOutput, useSyncColorEdits, useSyncPageDataToComponent } from "@/lib/hooks/hooks";
import EditableTextField from "@/components/editor/editableTextField/editableTextArea";
import { testimonials3Details } from ".";
import useWebsiteStore from "@/stores/websiteStore";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";
import ImageField from "@/components/editor/imageField/imageField";

// Define the precise type of a single testimonial item, ensuring it's not optional (NonNullable)
type TestimonialItem = NonNullable<Testimonials3Props['testimonials']>[number];

const Testimonials3Edit: React.FC<EditorialComponentProps> = ({ id }) => {
  const [componentProps, setComponentProps] = useState<Partial<Testimonials3Props>>({});

  const { setCurrentComponent, currentComponent, setAssistantMessage, LlmCurrentTextOutput, setLlmCurrentTextOutput, currentColorEdits, setCurrentColorEdits } = useComponentEditor();

  const updateComponentProps = useWebsiteStore((state) => state.updateComponentProps);
  const currentPageSlug = useWebsiteStore((state) => state.currentPageSlug);

  // Merge with defaults and cast to Required<Testimonials3Props>
  const propsWithDefaults = { ...defaultTestimonials3Props, ...componentProps } as Required<Testimonials3Props>;
  
  const {
    title,
    description,
    testimonials,
    textColor,
    baseBgColor,
    mainColor,
    bgLayout,
  } = propsWithDefaults;

  // FIX: Cast the testimonials array to the non-optional array type (TestimonialItem[])
  // This satisfies the index signature requirement for updateTestimonial.
  const safeTestimonials: TestimonialItem[] = testimonials;

  const [currentIndex, setCurrentIndex] = useState(0);

  // FIX: Cast propsWithDefaults to BaseColorProps when calling deriveColorPalette
  // This resolves the GradientConfig type incompatibility error.
  const colors = deriveColorPalette(propsWithDefaults as BaseColorProps, bgLayout.type);

  const updateProp = <K extends keyof Testimonials3Props>(key: K, value: Testimonials3Props[K]) => {
    setComponentProps((prev) => ({ ...prev, [key]: value }));
    updateComponentProps(currentPageSlug, id, { [key]: value });
  };

  // REFACTORED FUNCTION: Uses safeTestimonials and TestimonialItem type
  const updateTestimonial = (
    index: number,
    // Use the non-optional item type's keys
    subKey: keyof TestimonialItem, 
    value: string
  ) => {
    const newTestimonials = [...safeTestimonials];
    // Ensure the assignment is safe by using the correct key
    newTestimonials[index] = { ...newTestimonials[index], [subKey]: value as any }; 
    // Cast the array back to the component prop type for storage
    updateProp("testimonials", newTestimonials as Testimonials3Props["testimonials"]);
  };

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % safeTestimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + safeTestimonials.length) % safeTestimonials.length);
  };
  
  const currentTestimonial = safeTestimonials[currentIndex];

  useSyncLlmOutput(
    currentComponent?.name,
    "Testimonials3",
    setComponentProps,
    LlmCurrentTextOutput,
    setLlmCurrentTextOutput,
    testimonials3Details.editableFields
  );

  const onClick = () => {
    handleComponentClick({
      currentComponent: currentComponent!,
      componentDetails: testimonials3Details,
      setCurrentComponent,
      setAssistantMessage
    });
    setCurrentColorEdits({
      textColor: colors.textColor,
      baseBgColor: colors.baseBgColor,
      mainColor: colors.mainColor,
      bgLayout: colors.bgLayout
    })
  };

  useSyncColorEdits(
    currentComponent?.name,
    "Testimonials3",
    setComponentProps,
    currentColorEdits
  );

  useSyncPageDataToComponent(
    id,
    'Testimonials3',
    setComponentProps,
  );


  return (
    <motion.section
      onClick={onClick}
      className="relative py-20 px-6 rounded-xl"
      style={{ background: useAnimatedGradient(colors.bgLayout as GradientConfig, colors) }}
    >
      <div className="max-w-4xl mx-auto text-center">
        {/* Title and Description */}
        <EditableTextField
          value={title}
          onChange={(val) => updateProp("title", val)}
          placeholder="Title"
          className="text-4xl font-extrabold mb-4"
          fieldKey="title"
          componentId={id}
        />
        <EditableTextField
          value={description}
          onChange={(val) => updateProp("description", val)}
          placeholder="Description"
          rows={2}
          className="text-xl mb-12"
          fieldKey="description"
          componentId={id}
        />

        {/* Testimonial Carousel */}
        <div className="relative p-8 rounded-xl shadow-2xl transition-all duration-500 min-h-[300px]"
             style={{ backgroundColor: colors.baseBgColor, color: colors.textColor }}>
          
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            {/* Quote */}
            <EditableTextField
              value={currentTestimonial.quote}
              onChange={(val) => updateTestimonial(currentIndex, "quote", val)}
              placeholder="Testimonial quote goes here..."
              rows={4}
              className="text-2xl italic mb-6 w-full text-center resize-none"
              fieldKey={`testimonials[${currentIndex}].quote`}
              componentId={id}
            />

            {/* Avatar and Info */}
            <div className="flex flex-col items-center">
              <ImageField
                className="w-20 h-20 rounded-full mb-3"
                componentId={id}
                fieldKey={`testimonials[${currentIndex}].src`}
                value={{ src: currentTestimonial.src, alt: currentTestimonial.alt } as any}
                onChange={(val) => {
                  // Only update if value is a string or handle complex object structure
                  updateTestimonial(currentIndex, "src", val.src);
                  updateTestimonial(currentIndex, "alt", val.alt);
                }}
              />
              <EditableTextField
                value={currentTestimonial.name}
                onChange={(val) => updateTestimonial(currentIndex, "name", val)}
                placeholder="Name"
                className="text-xl font-bold"
                fieldKey={`testimonials[${currentIndex}].name`}
                componentId={id}
              />
              <EditableTextField
                value={currentTestimonial.role}
                onChange={(val) => updateTestimonial(currentIndex, "role", val)}
                placeholder="Role/Company"
                className="text-lg text-gray-500"
                fieldKey={`testimonials[${currentIndex}].role`}
                componentId={id}
              />
            </div>
          </motion.div>

          {/* Navigation Buttons */}
          <button
            onClick={prevTestimonial}
            className="absolute top-1/2 left-0 transform -translate-y-1/2 p-2 rounded-full hover:opacity-80 transition-colors"
            style={{ background: colors.accentColor ?? "#00bfff", color: colors.baseBgColor }}
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
            className="absolute top-1/2 right-0 transform -translate-y-1/2 p-2 rounded-full hover:opacity-80 transition-colors"
            style={{ background: colors.accentColor ?? "#00bfff", color: colors.baseBgColor }}
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
            {safeTestimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className="w-3 h-3 rounded-full"
                style={{
                  background: index === currentIndex ? colors.mainColor : colors.accentColor,
                }}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default Testimonials3Edit;