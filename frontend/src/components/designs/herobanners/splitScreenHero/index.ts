import SplitScreenHeroEdit from "./splitScreenHeroEdit";
import { EditableComponent } from "@/types/editorial";
import { BaseComponentProps, ImageProp } from "@/types";;

export const splitScreenHeroDetails: EditableComponent = {
  name: "SplitScreenHero",
  details: "A bold split-screen hero with agent profile on the left and property showcase on the right. Perfect for establishing authority and credibility immediately.",
  uniqueEdits: ["title", "subTitle", "description", "buttonText"],
  editableFields: [
    {
      key: "title",
      label: "Agent Name/Title",
      description: "Main headline - typically agent name or tagline",
      type: "text",
      wordLimit: 8,
    },
    {
      key: "subTitle",
      label: "Subtitle",
      description: "Supporting text like role or credentials",
      type: "text",
      wordLimit: 12,
    },
    {
      key: "description",
      label: "Description",
      description: "Brief bio or value proposition",
      type: "text",
      wordLimit: 30,
    },
    {
      key: "buttonText",
      label: "Button Text",
      description: "Call-to-action button text",
      type: "text",
      wordLimit: 5,
    },
    {
      key: "textArray",
      label: "Stats",
      description: "Array of statistics (e.g., homes sold, years experience)",
      type: "standardArray",
      arrayLength: { min: 2, max: 4 },
    },
    {
      key: "textColor",
      label: "Text Color",
      description: "Main text color; should contrast with baseBgColor",
      type: "color",
    },
    {
      key: "baseBgColor",
      label: "Background Color",
      description: "Background color for the left side",
      type: "color",
    },
    {
      key: "mainColor",
      label: "Main Color",
      description: "Accent color for highlights and buttons",
      type: "color",
    },
    {
      key: "bgLayout",
      label: "Background layout",
      description: "The layout for the background colors",
      type: "color",
    },
  ],
  category: 'hero'
};

export interface SplitScreenHeroProps extends Partial<BaseComponentProps> {
  title?: string;
  subTitle?: string;
  description?: string;
  buttonText?: string;
  images?: {
    agent?: ImageProp;
    property?: ImageProp;
  };
  textArray?: {
    title: string;
    description: string;
  }[];
}

export const defaultSplitScreenHeroProps: Required<SplitScreenHeroProps> = {
  textColor: "#1f2937",
  baseBgColor: "#f0f9ff",
  mainColor: "#3B82F6",
  bgLayout: {
    type: "radial",
    radialSize: "125% 125%",
    radialPosition: "50% 0%",
    radialBaseStop: 50,
  } as const,
  title: "Sarah Mitchell",
  subTitle: "Your Trusted Real Estate Partner",
  description: "Helping families find their dream homes in the greater metro area for over 15 years. Committed to excellence, integrity, and results.",
  buttonText: "Get Started",
  array: [],
  images: {
    agent: {
      src: '/placeholder.webp',
      alt: 'Real estate agent professional photo',
    },
    property: {
      src: '/placeholder.webp',
      alt: 'Beautiful property showcase',
      objectCover: true
    },
  },
  textArray: [
    {
      title: "500+",
      description: "Homes Sold",
    },
    {
      title: "15",
      description: "Years Experience",
    },
    {
      title: "$200M+",
      description: "In Sales",
    },
    {
      title: "98%",
      description: "Client Satisfaction",
    },
  ],
  items: [],
};

export { SplitScreenHeroEdit };
