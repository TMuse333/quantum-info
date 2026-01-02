import UniqueValuePropositionEdit from "./uniqueValuePropositionEdit";
import { EditableComponent } from "@/types/editorial";
import { BaseComponentProps, ImageProp } from "@/types";;

export const uniqueValuePropositionDetails: EditableComponent = {
  name: "UniqueValueProposition",
  details: "A three-column grid showcasing unique value propositions with icons, titles, and descriptions. Perfect for highlighting key differentiators, services, or benefits.",
  uniqueEdits: ["title", "subTitle", "textArray"],
  editableFields: [
    {
      key: "subTitle",
      label: "Subtitle",
      description: "Optional text above the main headline",
      type: "text",
      wordLimit: 8,
    },
    {
      key: "title",
      label: "Title",
      description: "Main section headline",
      type: "text",
      wordLimit: 12,
    },
    {
      key: "textArray",
      label: "Value Propositions",
      description: "Array of value propositions with icons, titles, and descriptions",
      type: "standardArray",
      arrayLength: { min: 3, max: 6 },
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
      description: "Foreground color for highlights, gradients, icons, and accents",
      type: "color",
    },
    {
      key: "bgLayout",
      label: "Background layout",
      description: "The layout for the background colors",
      type: "color",
    },
  ],
  category: 'textComponent'
};

export interface UniqueValuePropositionProps extends Partial<BaseComponentProps> {
  title?: string;
  subTitle?: string;
  images?: {
    icon1?: ImageProp;
    icon2?: ImageProp;
    icon3?: ImageProp;
    icon4?: ImageProp;
    icon5?: ImageProp;
    icon6?: ImageProp;
  };
  textArray?: {
    title: string;
    description: string;
  }[];
}

export const defaultUniqueValuePropositionProps: Required<Omit<UniqueValuePropositionProps, 'textArray'>> & { textArray: { title: string; description: string }[] } = {
  textColor: '#1f2937',
  baseBgColor: '#f0f9ff',
  mainColor: '#3B82F6',
  bgLayout: {
    type: "radial",
    radialSize: "125% 125%",
    radialPosition: "50% 0%",
    radialBaseStop: 50,
  } as const,
  title: "What Sets Us Apart",
  subTitle: "Why Choose Us",
  description: "",
  buttonText: "",
  array: [],
  images: {
    icon1: {
      src: '/placeholder.webp',
      alt: 'Market expertise icon',
    },
    icon2: {
      src: '/placeholder.webp',
      alt: 'Concierge service icon',
    },
    icon3: {
      src: '/placeholder.webp',
      alt: 'Proven results icon',
    },
  },
  textArray: [
    {
      title: "Market Expertise",
      description: "Deep knowledge of local markets, trends, and pricing strategies to position your property competitively and maximize value.",
    },
    {
      title: "Concierge Service",
      description: "White-glove treatment from first consultation to closing day, with personalized attention to every detail of your transaction.",
    },
    {
      title: "Proven Results",
      description: "Track record of successful sales, satisfied clients, and homes sold above asking price in record time.",
    },
  ],
  items: [],
};

export { UniqueValuePropositionEdit };
