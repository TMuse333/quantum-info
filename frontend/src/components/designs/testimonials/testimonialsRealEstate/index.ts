import TestimonialsRealEstateEdit from "./testimonialsRealEstateEdit";
import { EditableComponent } from "@/types/editorial";
import { BaseComponentProps } from "@/types";;

export const testimonialsRealEstateDetails: EditableComponent = {
  name: "TestimonialsRealEstate",
  details: "A testimonial section designed for real estate with client photos, names, roles, and detailed quotes displayed in a grid layout with featured testimonial highlight.",
  uniqueEdits: ["title", "description", "testimonials"],
  editableFields: [
    {
      key: "title",
      label: "Title",
      description: "Main section headline",
      type: "text",
      wordLimit: 10,
    },
    {
      key: "description",
      label: "Description",
      description: "Supporting text below the title",
      type: "text",
      wordLimit: 30,
    },
    {
      key: "testimonials",
      label: "Testimonials",
      description: "Array of client testimonials with name, role, quote, and photo",
      type: "testimonialArray",
      arrayLength: { min: 3, max: 9 },
    },
    {
      key: "textColor",
      label: "Text Color",
      description: "Main body text color; should contrast with the baseBgColor",
      type: "color",
    },
    {
      key: "baseBgColor",
      label: "Background Color",
      description: "This is the base background color on the screen",
      type: "color",
    },
    {
      key: "mainColor",
      label: "Main Color",
      description: "Foreground color for highlights, gradients, and accents",
      type: "color",
    },
    {
      key: "bgLayout",
      label: "Background layout",
      description: "The layout for the background colors",
      type: "color",
    },
  ],
  category: 'contentPiece'
};

export interface TestimonialsRealEstateProps extends Partial<BaseComponentProps> {
  title?: string;
  description?: string;
  testimonials?: {
    name: string;
    role: string;
    quote: string;
    src?: string;
    alt?: string;
  }[];
}

export const defaultTestimonialsRealEstateProps: Required<Omit<TestimonialsRealEstateProps, 'testimonials'>> & { testimonials: { name: string; role: string; quote: string; src?: string; alt?: string }[] } = {
  textColor: "#1f2937",
  baseBgColor: "#f0f9ff",
  mainColor: "#3B82F6",
  bgLayout: {
    type: "radial",
    radialSize: "125% 125%",
    radialPosition: "50% 0%",
    radialBaseStop: 50,
  } as const,
  title: "What Our Clients Say",
  description: "Real stories from real people who trusted us with their biggest investment",
  subTitle: "",
  buttonText: "",
  array: [],
  images: {},
  testimonials: [
    {
      name: "Sarah Johnson",
      role: "First-Time Home Buyer",
      quote: "Made the entire home buying process stress-free. Their knowledge of the local market helped us find our dream home within our budget.",
      src: "/placeholder.webp",
      alt: "Sarah Johnson's photo",
    },
    {
      name: "Michael Chen",
      role: "Home Seller, Downtown",
      quote: "Sold our condo in just 5 days, $20K over asking! Their marketing strategy and negotiation skills are unmatched.",
      src: "/placeholder.webp",
      alt: "Michael Chen's photo",
    },
    {
      name: "Lisa Rodriguez",
      role: "Investment Property Owner",
      quote: "Helped me build a portfolio of 3 rental properties. Their market insights and attention to detail are exceptional.",
      src: "/placeholder.webp",
      alt: "Lisa Rodriguez's photo",
    },
  ],
  items: [],
};

export { TestimonialsRealEstateEdit };
