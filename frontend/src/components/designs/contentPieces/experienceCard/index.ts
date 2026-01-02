import { BaseComponentProps, EditableComponent, ImageProp, StandardText } from "@/types";

export const experienceCardDetails: EditableComponent = {
  name: "ExperienceCard",
  details: "A scroll-animated card showcasing experience with image, description, key aspects list, and optional CTA link.",
  category:'contentPiece',
  uniqueEdits: [],
  editableFields: [
    // Text Fields
    { key: "title", label: "Title", description: "Main card headline", type: "text", wordLimit: 10 },
    { key: "description", label: "Description", description: "Main content describing the experience", type: "text", wordLimit: 50 },
    { key: "subTitle", label: "Aspect Header", description: "Header text above the aspects list", type: "text", wordLimit: 10 },
    { key: "buttonText", label: "Button Text", description: "CTA button text (if link provided)", type: "text", wordLimit: 5 },
    
    // Image Field
    { key: "images.main", label: "Main Image", description: "Primary card image", type: "image" },
    
    // Array Field
    { key: "array", label: "Key Aspects", description: "List of key aspects or features", type: "standardArray", arrayLength: { min: 3, max: 9 } },
    
    // Color Fields
    { key: "textColor", label: "Text Color", description: "Main body text color, should contrast with background", type: "color" },
    { key: "baseBgColor", label: "Background Color", description: "Base background color for the card", type: "color" },
    { key: "mainColor", label: "Main Color", description: "Primary accent color for buttons and highlights", type: "color" },
    { key: "bgLayout", label: "Background Layout", description: "The layout configuration for background colors", type: "color" }
  ]
};

export interface ExperienceCardProps extends Omit<BaseComponentProps, 'array'> {
  images: {
    main: ImageProp;
  };
  reverse?: boolean;
  // Redefine `array` with `description` omitted from StandardText
  array: (Omit<StandardText, "description">)[];
}

export const defaultExperienceCardProps: Required<Omit<ExperienceCardProps, 'array' | 'reverse'>> & { array: (Omit<StandardText, "description">)[] } = {
  textColor: "#1f2937",
  baseBgColor: "#f0f9ff",
  mainColor: "#3B82F6",
  bgLayout: {
    type: "radial",
    radialSize: "125% 125%",
    radialPosition: "50% 0%",
    radialBaseStop: 50,
  } as const,
  title: "Welcome Section",
  subTitle: "Get to Know Me",
  description: "This is where you can introduce yourself a bit more, share a snapshot of who you are, and display some quick facts or highlights about your experience.",
  buttonText: "Discover More",
  images: {
    main: {
      src: "/placeholder.webp",
      alt: "Intro Placeholder Image",
    },
  },
  array: [
    { type: "StandardText", title: "Quick Fact One" },
    { type: "StandardText", title: "Quick Fact Two" },
    { type: "StandardText", title: "Quick Fact Three" },
  ],
  items: [],
};

export { };