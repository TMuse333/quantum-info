import { EditableComponent } from "@/types/editorial";
import { BaseComponentProps, CarouselItem } from "@/types";;
import ScrollCarouselEdit from "./scrollCarouselEdit";

export const scrollCarouselDetails: EditableComponent = {
  name: "ScrollCarousel",
  details: "A horizontally scrolling carousel with gradient cards. Each card displays an image, title, description, optional date, and CTA button with smooth scroll navigation.",
  uniqueEdits: [],
  editableFields: [
    {
      key: "items",
      label: "Carousel Items",
      description: "Array of carousel cards with images, titles, descriptions, and optional links. Managed via Carousel Editor.",
      type: "carousel",
      arrayLength: { min: 2, max: 20 },
    },
    {
      key: "textColor",
      label: "Text Color",
      description: "Primary text color for card content",
      type: "color",
    },
    {
      key: "baseBgColor",
      label: "Background Color",
      description: "Background color for the section",
      type: "color",
    },
    {
      key: "mainColor",
      label: "Accent Color",
      description: "Color for buttons, navigation arrows, and accents",
      type: "color",
    },
    {
      key: "bgLayout",
      label: "Background Layout",
      description: "Background gradient or solid configuration",
      type: "color",
    },
  ],
  category: "carousel",
};

export interface ScrollCarouselProps extends Partial<BaseComponentProps> {
  items?: CarouselItem[];
}

export const defaultScrollCarouselProps: Required<Omit<ScrollCarouselProps, 'items'>> & { items: CarouselItem[] } = {
  textColor: "#1f2937",
  baseBgColor: "#f0f9ff",
  mainColor: "#3B82F6",
  bgLayout: {
    type: "radial",
    radialSize: "125% 125%",
    radialPosition: "50% 0%",
    radialBaseStop: 50,
  } as const,
  title: "",
  description: "",
  subTitle: "",
  buttonText: "",
  array: [],
  images: {},
  items: [
    {
      image: { src: "/placeholder.webp", alt: "Card 1" },
      title: "First Card",
      description: "This is a description for the first carousel card. It provides context and entices the reader.",
      buttonText: "Read More",
      extraInfo: "January 2025",
    },
    {
      image: { src: "/placeholder.webp", alt: "Card 2" },
      title: "Second Card",
      description: "Another engaging card with interesting content to showcase your work or services.",
      buttonText: "Learn More",
      extraInfo: "February 2025",
    },
    {
      image: { src: "/placeholder.webp", alt: "Card 3" },
      title: "Third Card",
      description: "Keep adding cards to create a rich, scrollable gallery of content.",
      buttonText: "Discover",
      extraInfo: "March 2025",
    },
  ],
};

export { ScrollCarouselEdit };
