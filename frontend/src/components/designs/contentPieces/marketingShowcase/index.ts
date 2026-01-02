import MarketingShowcaseEdit from "./marketingShowcaseEdit";
import { EditableComponent } from "@/types/editorial";
import { BaseComponentProps, ImageProp } from "@/types";;

export const marketingShowcaseDetails: EditableComponent = {
  name: "MarketingShowcase",
  details: "A visual showcase demonstrating comprehensive marketing strategies, services, or methodologies. Features a main title with a grid of service/strategy cards, each with an icon, title, and description.",
  uniqueEdits: ["title", "subTitle", "description", "textArray"],
  editableFields: [
    {
      key: "title",
      label: "Main Title",
      description: "Primary headline for the showcase",
      type: "text",
      wordLimit: 12,
    },
    {
      key: "subTitle",
      label: "Subtitle",
      description: "Supporting headline text",
      type: "text",
      wordLimit: 15,
    },
    {
      key: "description",
      label: "Description",
      description: "Overview text explaining the marketing approach",
      type: "text",
      wordLimit: 50,
    },
    {
      key: "textArray",
      label: "Marketing Services",
      description: "Array of marketing services/strategies with titles and descriptions",
      type: "standardArray",
      arrayLength: { min: 4, max: 12 },
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
      description: "Base background color for the section",
      type: "color",
    },
    {
      key: "mainColor",
      label: "Main Color",
      description: "Accent color for icons, highlights, and interactive elements",
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

export interface MarketingShowcaseProps extends Partial<BaseComponentProps> {
  title?: string;
  subTitle?: string;
  description?: string;
  images?: {
    showcase?: ImageProp;
  };
  textArray?: {
    title: string;
    description: string;
  }[];
}

export const defaultMarketingShowcaseProps: Required<Omit<MarketingShowcaseProps, 'textArray' | 'images'>> & {
  textArray: { title: string; description: string }[],
  images: NonNullable<MarketingShowcaseProps['images']>
} = {
  textColor: "#1f2937",
  baseBgColor: "#f0f9ff",
  mainColor: "#3B82F6",
  bgLayout: {
    type: "radial",
    radialSize: "125% 125%",
    radialPosition: "50% 0%",
    radialBaseStop: 50,
  } as const,
  title: "Comprehensive Marketing Strategy",
  subTitle: "Everything you need to grow your business",
  description: "We combine proven strategies with cutting-edge tools to deliver results that matter. From brand development to digital campaigns, we've got you covered.",
  buttonText: "",
  array: [],
  items: [],
  images: {
    showcase: {
      src: '/placeholder.webp',
      alt: 'Marketing showcase',
    },
  },
  textArray: [
    {
      title: "Brand Development",
      description: "Create a compelling brand identity that resonates with your target audience",
    },
    {
      title: "Digital Marketing",
      description: "Leverage online channels to reach and engage your customers effectively",
    },
    {
      title: "Content Strategy",
      description: "Develop content that educates, entertains, and converts visitors",
    },
    {
      title: "Social Media Management",
      description: "Build and maintain a strong social media presence across platforms",
    },
    {
      title: "SEO Optimization",
      description: "Improve your search rankings and drive organic traffic to your site",
    },
    {
      title: "Email Campaigns",
      description: "Nurture leads and maintain customer relationships through targeted emails",
    },
    {
      title: "Analytics & Reporting",
      description: "Track performance and make data-driven decisions for continuous improvement",
    },
    {
      title: "Paid Advertising",
      description: "Maximize ROI with strategic paid campaigns across multiple channels",
    },
  ],

};

export { MarketingShowcaseEdit };
