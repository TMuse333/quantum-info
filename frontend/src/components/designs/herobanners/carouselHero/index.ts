import CarouselHeroEdit from "./carouselHeroEdit";
import { EditableComponent } from "@/types/editorial";
import { BaseComponentProps, ImageProp, CarouselItem } from "@/types";;

export const carouselHeroDetails: EditableComponent = {
  name: "CarouselHero",
  details: "A hero section with animated title, description, button, and a scrollable image carousel.",
  editableFields: [
    { key: "subTitle", label: "Subtitle", description: "Small header above main title", type: "text", wordLimit: 5 },
    { key: "title", label: "Title", description: "Main headline", type: "text", wordLimit: 10 },
    { key: "description", label: "Description", description: "Paragraph below the title", type: "text", wordLimit: 25 },
    { key: "buttonText", label: "Button Text", description: "CTA button text", type: "text", wordLimit: 5 },
    { key: "textColor", label: "Text Color", description: "Main text color", type: "color" },
    { key: "baseBgColor", label: "Background Color", description: "Base background color", type: "color" },
    { key: "mainColor", label: "Accent Color", description: "Highlight and buttons color", type: "color" },
    { key: "bgLayout", label: "Background Layout", description: "Gradient background layout", type: "gradient" },
    { key: "items", label: "Carousel Items", description: "Array of images and descriptions", type: "carousel" }
  ],
  category:'hero'
};

export interface CarouselHeroProps extends Partial<BaseComponentProps> {
  items?: CarouselItem[];
}

export const defaultCarouselHeroProps: Required<Omit<CarouselHeroProps, 'items'>> & { items: CarouselItem[] } = {
  textColor: "#1f2937",
  baseBgColor: "#f0f9ff",
  mainColor: "#3B82F6",
  bgLayout: {
    type: "radial",
    radialSize: "125% 125%",
    radialPosition: "50% 0%",
    radialBaseStop: 50,
  } as const,
  title: "Your Carousel Hero",
  description: "This is a carousel hero component with images and descriptions.",
  subTitle: "Welcome",
  buttonText: "Get Started",
  array: [],
  images: {},
  items: [
    { image: { src: "/placeholder.webp", alt: "Slide 1" }, description: "First slide description" },
    { image: { src: "/placeholder.webp", alt: "Slide 2" }, description: "Second slide description" },
  ],
};

export { CarouselHeroEdit };
