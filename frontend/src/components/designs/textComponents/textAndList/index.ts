// components/textAndList/index.ts
import TextAndListEdit from "./textAndListEdit";
import { EditableComponent } from "@/types/editorial";
import { BaseComponentProps, ImageProp } from "@/types";;

export const textAndListDetails: EditableComponent = {
    name: "TextAndList",
    details:
      "A structured section featuring a subtitle, title, image, supporting description, and a list of aspects with titles and descriptions.",
    uniqueEdits: ["subTitle", "title", "description", "src", "alt", "textArray"],
    editableFields: [
      {
        key: "subTitle",
        label: "Subtitle",
        description: "The subtext above the main headline to set context",
        type: "text",
        wordLimit: 8,
      },
      {
        key: "title",
        label: "Title",
        description: "Main headline text",
        type: "text",
        wordLimit: 10,
      },
      {
        key: "description",
        label: "Description",
        description: "Supporting body text",
        type: "text",
        wordLimit: 40,
      },
      {
        key: "textArray",
        label: "Text Array",
        description: "Array of items with title and description",
        type: "standardArray", // ✅ changed from "array" to "standardArray"
        arrayLength: { min: 3, max: 8 }, // optional constraints
      },
      {
        key: "textColor",
        label: "Text Color",
        description:
          "Main body text color and header; should contrast with the baseBgColor",
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
        description:
          "Foreground color for highlights, gradients, buttons, borders, and accents",
        type: "color",
      },
      {
        key: "bgLayout",
        label: "Background layout",
        description: "The layout for the background colors",
        type: "color",
      },
    ],
    category:'textComponent'
  };

export const defaultTextAndListProps = {
  subTitle: "Introducing the Text and List Component",
  title: "What This Section Can Showcase",
  images: {
    main: {
      src: "/placeholder.webp",
      alt: "placeholder",
    } as ImageProp,
  },
  description: "Use this component to highlight key points, features, or benefits in a clear and engaging way. Combine a short intro paragraph with a supporting image and a structured list to communicate value effectively.",
  textArray: [
    {
      title: "Data-Backed Highlights",
      description: "Display information supported by facts, numbers, or research to add credibility and help viewers make informed decisions.",
    },
    {
      title: "Personalized Messaging",
      description: "Present points that connect emotionally or logically with your audience, using a tone that matches your brand’s personality.",
    },
    {
      title: "Strategic Structure",
      description: "Organize details into concise, scannable blocks so readers can easily follow and absorb your main ideas.",
    },
    {
      title: "Multilingual Flexibility",
      description: "Adapt your content for multiple languages to reach broader audiences while keeping formatting and style consistent.",
    },
    {
      title: "Global-Friendly Design",
      description: "Showcase diverse experiences, services, or features with a layout that supports cultural adaptability and inclusive presentation.",
    },
  ],
  textColor: "#1f2937",
  baseBgColor: "#f0f9ff",
  mainColor: "#3B82F6",
  bgLayout: {
    type: "radial" as const,
    radialSize: "125% 125%",
    radialPosition: "50% 0%",
    radialBaseStop: 50,
  },
  items: [],
  array: [],
}

export interface TextAndListProps extends Partial<BaseComponentProps> {
  subTitle?: string;
  title?: string;
  images?: {
    main?: ImageProp;
  };
  description?: string;
  textArray?: Array<{ title: string; description: string }>;
}

export { TextAndListEdit };
