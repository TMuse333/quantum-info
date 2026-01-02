// components/testimonials3/index.ts
import { EditableComponent } from "@/types/editorial";
import { BaseComponentProps } from "@/types";;
import Testimonials3Edit from "./testimonials3Edit";

export const testimonials3Details: EditableComponent = {
  name: "Testimonials3",
  details: "A carousel-based testimonials section showcasing client feedback dynamically. Each testimonial includes name, role, quote, and optional image.",
  uniqueEdits: ["array"],
  editableFields: [
    {
      key: "testimonials",
      label: "Testimonials",
      description: "List of client testimonials (each is a Testimonial-type array item).",
      type: "testimonialArray", // ✅ changed from "array" to "testimonialArray"
      arrayLength: { min: 1, max: 5 },
    },
    // 🔹 Core text content
    {
      key: "title",
      label: "Title",
      description: "Main heading introducing the testimonials section.",
      type: "text",
    },
    {
      key: "description",
      label: "Description",
      description: "Supporting paragraph under the testimonials title.",
      type: "text",
    },
    // 🔹 Visual & layout properties
    {
      key: "textColor",
      label: "Text Color",
      description: "Main body and header text color. Should contrast with the background.",
      type: "color",
    },
    {
      key: "baseBgColor",
      label: "Base Background Color",
      description: "Primary background color, typically contrasting with text color.",
      type: "color",
    },
    {
      key: "mainColor",
      label: "Accent Color",
      description: "Main accent or highlight color used in buttons, borders, and highlights.",
      type: "color",
    },
    {
      key: "bgLayout",
      label: "Background Layout",
      description: "Defines solid or gradient background settings.",
      type: "color",
    },
  ],
  category: "testimonial"
};

export const defaultTestimonials3Props = {
  title: "Trusted by Our Clients",
  description: "",
  testimonials: [
    {
      name: "Hiroshi Yamada",
      role: "CEO, Amada Enterprises",
      quote: "This team elevated our brand with unmatched creativity and precision. Their solutions drove measurable growth.",
      src: "/placeholder.webp",
      alt: "Hiroshi Yamada's photo",
    },
    {
      name: "Emma Wilson",
      role: "Freelance Consultant, Wilson Strategies",
      quote: "Their platform simplified my workflow, saving me hours daily. Exceptional support and results!",
      src: "/placeholder.webp",
      alt: "Emma Wilson's photo",
    },
    {
      name: "Rahul Patel",
      role: "Product Manager, TechTrend Innovations",
      quote: "Their innovative approach aligned perfectly with our vision, delivering outstanding outcomes.",
      src: "/placeholder.webp",
      alt: "Rahul Patel's photo",
    },
  ],
  textColor: "#1f2937",
  baseBgColor: "#f0f9ff",
  mainColor: "#3B82F6",
  bgLayout: {
    type: "radial",
    radialSize: "125% 125%",
    radialPosition: "50% 0%",
    radialBaseStop: 50,
  } as const,
  items: [],
  array: [],
};

export interface Testimonials3Props extends Partial<BaseComponentProps> {
  title?: string;
  description?: string;
  testimonials?: Array<{
    name: string;
    role: string;
    quote: string;
    src?: string;
    alt?: string;
  }>;
}

export { Testimonials3Edit };
