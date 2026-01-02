// components/imageTextPoints/index.ts
import { EditableComponent } from "@/types/editorial";
import { BaseComponentProps, ImageProp } from "@/types";;
import ImageTextPointsEdit from "./imageTextPointsEdit";

export const imageTextPointsDetails: EditableComponent = {
  name: "ImageTextPoints",
  details: "A flexible image and text section with a gradient background, optional reverse layout, and a list of steps for highlighting key points.",
  uniqueEdits: [],
  editableFields: [
    {
      key: "title",
      label: "Title",
      type: "text",
      description: "Main heading text for the section."
    },
    {
      key: "description",
      label: "Description",
      type: "text",
      description: "Supporting paragraph or details shown under the title."
    },
    {
      key: "buttonText",
      label: "Button Text",
      type: "text",
      description: "Text displayed on the call-to-action button."
    },
    {
      key: "images.main",
      label: "Image Source",
      type: "image",
      description: "The image file or URL displayed in the section."
    },
    {
      key: "textArray",
      label: "Text Array",
      type: "standardArray", // 🔹 Updated type
      description: "Collection of expandable items displayed as a list or accordion.",
      arrayLength: { fixed: 3 },
    },

    {
      key: "textColor",
      label: "Text Color",
      description: "Main body text color and header, this should typically be black or white, depending on if the background is light or dark, the text color should contrast with the baseBgColor",
      type: "color"
    },

    {
      key: "baseBgColor",
      label: "Background Color",
      description: "This is the base background color on the screen, it will usually contrast with the gradient colors below",
      type: "color"
    },

    {
      key: "mainColor",
      label: "Main color",
      description: "The foreground color of the component, used for buttons, borders accents",
      type: "color",
    },
    {
      key: "reverse",
      label: "Reverse Layout",
      type: "color",
      description: "Flips the order of the image and text layout."
    },
    {
      key:'bgLayout',
      label:'Background layout',
      description:'The layout for the background colors',
      type:'color'
    }
  ],
  category: "contentPiece"
};

export const defaultImageTextPointsProps = {
  title: "Why Choose Me as Your Real Estate Agent",
  description: "From your first call to closing the deal, Nader guides you every step of the way with clarity, confidence, and care.",
  buttonText: "Let's find your dream home",
  images: {
    main: {
      src: "/placeholder.webp",
      alt: "Agent Nader Omar",
    } as ImageProp,
  },
  textArray: [
    {
      title: "Precision Through Data",
      description: "I use the latest Fall River market data, absorption rates, and hyper-local trends to price properties strategically and identify homes with strong appreciation potential.",
    },
    {
      title: "Strategic Marketing & Negotiations",
      description: "My data analysis allows me to showcase your property effectively to qualified buyers or find homes that truly match your criteria.",
    },
    {
      title: "Empathy & Ongoing Advocacy",
      description: "I start by listening to your goals and concerns to tailor my guidance personally. My support continues beyond closing, offering you a trusted resource in your Fall River community.",
    },
  ],
  reverse: false,
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

export interface ImageTextPointsProps extends Partial<BaseComponentProps> {
  title?: string;
  description?: string;
  buttonText?: string;
  images?: {
    main?: ImageProp;
  };
  textArray?: Array<{ title: string; description: string }>;
  reverse?: boolean;
}

export { ImageTextPointsEdit };
