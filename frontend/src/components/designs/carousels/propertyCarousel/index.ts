import PropertyCarouselEdit from "./propertyCarouselEdit";
import { EditableComponent } from "@/types/editorial";
import { BaseComponentProps, CarouselItem } from "@/types";;

export const propertyCarouselDetails: EditableComponent = {
  name: "PropertyCarousel",
  details: "A dynamic carousel showcasing properties, projects, or portfolio items with images, key details, status badges, and highlights. Perfect for real estate listings, case studies, or featured work.",
  uniqueEdits: ["title", "subTitle"],
  editableFields: [
    {
      key: "title",
      label: "Section Title",
      description: "Main headline for the carousel section",
      type: "text",
      wordLimit: 10,
    },
    {
      key: "subTitle",
      label: "Subtitle",
      description: "Supporting text below the title",
      type: "text",
      wordLimit: 20,
    },
    {
      key: "items",
      label: "Property Items",
      description: "Array of property cards with images, titles, descriptions, and extra details. Managed via Carousel Editor.",
      type: "carousel",
      arrayLength: { min: 3, max: 20 },
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
      description: "Color for badges, highlights, and interactive elements",
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

export interface PropertyCarouselProps extends Partial<BaseComponentProps> {
  title?: string;
  subTitle?: string;
  items?: CarouselItem[];
}

export const defaultPropertyCarouselProps: Required<Omit<PropertyCarouselProps, 'items'>> & { items: CarouselItem[] } = {
  textColor: "#1f2937",
  baseBgColor: "#f0f9ff",
  mainColor: "#3B82F6",
  bgLayout: {
    type: "radial",
    radialSize: "125% 125%",
    radialPosition: "50% 0%",
    radialBaseStop: 50,
  } as const,
  title: "Featured Properties",
  subTitle: "Explore our latest listings and recent successes",
  description: "",
  buttonText: "",
  array: [],
  images: {},
  items: [
    {
      image: { src: "/placeholder.webp", alt: "Property 1" },
      title: "Modern Downtown Condo",
      description: "Stunning 2-bedroom condo with city views",
      buttonText: "View Details",
      extraInfo: "Sold",
    },
    {
      image: { src: "/placeholder.webp", alt: "Property 2" },
      title: "Luxury Family Home",
      description: "Spacious 4-bedroom home in prime location",
      buttonText: "View Details",
      extraInfo: "Active",
    },
    {
      image: { src: "/placeholder.webp", alt: "Property 3" },
      title: "Investment Property",
      description: "Multi-unit building with great ROI potential",
      buttonText: "View Details",
      extraInfo: "Pending",
    },
  ],
};

export { PropertyCarouselEdit };
