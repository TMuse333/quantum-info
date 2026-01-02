import AuroraImageHeroEdit from "./auroraImageHeroEdit";
import { EditableComponent } from "@/types/editorial";
import { BaseComponentProps, ImageProp } from "@/types";;

export const auroraImageHeroDetails:EditableComponent  = {
    name: "AuroraImageHero",
    details: "A visually striking hero section with gradient background, image, title, description, and CTA button.",
    uniqueEdits: [],
    editableFields: [
      // Text Fields
      { key: "subTitle", label: "Subtitle", description: "Subtext above the headline", type: "text", wordLimit: 4 },
      { key: "title", label: "Title", description: "Main headline", type: "text", wordLimit: 10 },
      { key: "description", label: "Description", description: "Supporting text", type: "text", wordLimit: 25 },
      { key: "buttonText", label: "Button Text", description: "CTA button text", type: "text", wordLimit: 5 },

      // Color Fields
      { key: "textColor", label: "Text Color", description: "Main body text color and header, this should typically be black or white, depending on if the background is light or dark, the text color should contrast with the baseBgColor", type: "color" },
      { key: "baseBgColor", label: "Background Color", description: `This is the base background color on the screen,
      it will usually contrast with the gradient colors below`, type: "color" },
      { key: "mainColor", label: "Main color", description: `This is the main color of
      the component, that will be used for accents buttons and gradients if
      applicable, this is usually the brand main foreground color
      `, type: "color" },
      {
        key:'bgLayout', label:'Background layout',
        description:'The layout for the background colors',
        type:'color'
      }

    ],
    category:'hero'
  };

 export const defaultAuroraImageHeroProps: Required<AuroraImageHeroProps> = {
    textColor: "#1f2937",
    baseBgColor: "#f0f9ff",
    mainColor: "#3B82F6",
    bgLayout: {
      type: "radial",
      radialSize: "125% 125%",
      radialPosition: "50% 0%",
      radialBaseStop: 50,
    },
    images: {
      main: {
        src: "/placeholder.webp",
        alt: "Hero Image",
      },
    },
    subTitle: "Welcome",
    title: "Beautiful Hero Section",
    description: "This is a clean and modern hero banner designed to showcase your message with impact.",
    buttonText: "Get Started",
    items:[],
    array:[]
  };

  export interface AuroraImageHeroProps extends Partial<BaseComponentProps> {
    // Since this component only needs one main image,
    // you can give it a descriptive key like "main", "hero", or "background"
    images?: {
      main?: ImageProp;
    };
  }

  // Use Partial here for the production component
    export { AuroraImageHeroEdit };
