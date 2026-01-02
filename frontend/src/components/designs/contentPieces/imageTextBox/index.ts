// components/imageTextBox/index.ts
import ImageTextBoxEdit from "./imageTextBoxEdit";
import { EditableComponent } from "@/types/editorial";
import { BaseComponentProps, ImageProp } from "@/types";;

export const imageTextBoxDetails: EditableComponent = {
  name: "ImageTextBox",
  details:
    "A flexible image and text section with optional reverse layout, background color, and styling options.",
  uniqueEdits: [

  ],
  editableFields: [
    {
      key: "images.main",
      label: "Main Image",
      description: "Upload or select the main image for this section.",
      type: "image",
    },
    {
      key: "title",
      label: "Title",
      description: "Main title text displayed over the image or section.",
      type: "text",
      wordLimit: 15,
    },
    {
      key: "description",
      label: "Description",
      description: "Supporting text under the title.",
      type: "text",
      wordLimit: 50,
    },
    {
      key: "buttonText",
      label: "Button Text",
      description: "The call to action for the component",
      type: "text",
      wordLimit: 3,
    },
    {
      key: "textColor",
      label: "Text Color",
      description: "Color of the text in this section.",
      type: "color",
    },
    {
      key: "baseBgColor",
      label: "Background Color",
      description: "Background color of the section.",
      type: "color",
    },
    {
      key: "mainColor",
      label: "Main color",
      description: "Foreground color for buttons, borders, and accents.",
      type: "color",
    },
    {
      key: "bgLayout",
      label: "Background layout",
      description: "The layout for the background colors.",
      type: "color",
    },
  ],
  category:'contentPiece'
};

export const defaultImageTextBoxProps = {
  images: {
    main: {
      src: "/placeholder.webp",
      alt: "Featured Image",
    } as ImageProp,
  },
  title: "Stunning Visuals Meet Powerful Words",
  description: "This section combines a bold image with compelling text to tell your story with impact and elegance.",
  reverse: false,
  objectContain: false,
  textColor: "#1f2937",
  baseBgColor: "#f0f9ff",
  mainColor: "#3B82F6",
  bgLayout: {
    type: "radial",
    radialSize: "125% 125%",
    radialPosition: "50% 0%",
    radialBaseStop: 50,
  } as const,
}

export interface ImageTextBoxProps extends Partial<BaseComponentProps> {
  images?: {
    main?: ImageProp;
  };
  title?: string;
  description?: string;
  reverse?: boolean;
  objectContain?: boolean;
}

export { ImageTextBoxEdit };
