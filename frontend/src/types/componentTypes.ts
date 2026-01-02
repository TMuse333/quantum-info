import { GradientConfig } from "./colors";
import { NavItemType } from "./navbar";
// import { ComponentCategory } from "./websiteComponents";

export type ComponentCategory =
  | "hero"
  | "contentPiece"
  | "textComponent"
  | "testimonial"
  | "navbar"
  | "footer"
  | "misc"
  | "carousel";

export type TitleDescriptionItem = {
    type: "title-description";
    fields: {
      title: string;
      description: string;
    };
  };
  
  export type TestimonialItem = {
    type: "testimonial-array";
    fields: {
      name: string;
      role: string;
      quote: string;
      src?: string;
      alt?: string;
    };
  };
  
  export type CustomItem = {
    type: "custom";
    fields: Record<string, string | number | boolean>;
  };

 export type CarouselItem = {
  title?: string;
  description?: string;
  buttonText?: string;
  extraInfo?:string
  image:ImageProp
 }

 export type CarouselProps = {
  items: CarouselItem[]
 }

  export type CarouselArrayItem = {
    type:'carousel-item'
    fields:{
      title?: string;
      description?: string;
      buttonText?: string;
      extraInfo?:string
      Image:ImageProp
    }
  }
  
  export type ArrayItemSchema =
  | TitleDescriptionItem
  | TestimonialItem
  | CarouselArrayItem

  export type ImageProp = {
    src:string,
    alt:string,
    styles?:string
    objectCover?:boolean
  }



 // Update to EditableComponent in componentTypes.ts
export type EditableField =
| {
    key: string;
    label: string;
    description: string;
    type: "text";
    wordLimit?: number;
  }
| {
    key: string;
    label: string;
    description: string;
    type: "image" | "color" | "gradient";
  }
| {
    key: string;
    label: string;
    description: string;
    type: "standardArray";
    arrayLength?: { fixed?: number; min?: number; max?: number };
  }
| {
    key: string;
    label: string;
    description: string;
    type: "testimonialArray";
    arrayLength?: { fixed?: number; min?: number; max?: number };
  }

  | {
    key: "items"; // Only "items" key for navbar
    label: string;
    description: string;
    type: "navbar";
    // Navbar-specific config
    allowedItemTypes?: NavItemType[];
    maxDepth?: number;
    
    // How deep submenu nesting can go
  }

  | {
    key: string;
    label: string;
    description: string;
    type: "standardTabArray";
    arrayLength?: { fixed?: number; min?: number; max?: number };
    itemSchema?: {
      nameLabel?: string;
      hrefLabel?: string;
      hrefType?: "url" | "email" | "phone" | "internal";
    };
  }
  | {
    key: string;
    label: string;
    description: string;
    type: "carousel";
    arrayLength?: { fixed?: number; min?: number; max?: number };
    
  };





    export type StandardText = {
      type: "StandardText"; // discriminant
      title: string;
      description: string;
    };
    
    export type TestimonialText = {
      type: "Testimonial"; // discriminant
      name: string;
      role: string;
      quote: string;
      src?: string;
      alt?: string;
    };
    
    export type BaseArrayItem = StandardText | TestimonialText | CarouselArrayItem;
    
    export interface BaseTextProps {
      title: string;
      description: string;
      subTitle: string;
      buttonText: string;
      array?: BaseArrayItem[]; // optional array of discriminated union items
    }
    
    export interface BaseColorProps {
      textColor: string;
      baseBgColor: string;
      mainColor:string
      bgLayout:GradientConfig
    }

    export interface BaseComponentProps extends BaseTextProps, BaseColorProps
     {

      images?: Record<string, ImageProp>;
      items?:CarouselItem[]
     }

export type EditableComponent = {

  name: string;
 
  details: string;

  editableFields: EditableField[];

  uniqueEdits?: string[];

  category: ComponentCategory

  id?:string
};