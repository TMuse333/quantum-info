import { ArrayItemSchema, StandardText, TestimonialText } from "./componentTypes";

export interface LlmTextOutput {
  title?: string;
  description?: string;
  subTitle?: string;
  buttonText?: string;
  array?: Array<StandardText | TestimonialText>;
}

  
  // types/types.ts
  export type LlmColorOutput = {
    mainColor: string;              // Primary color of site, hex
    textColor: string;              // Hex color
    baseBgColor?: string;           // Hex color
           // Hex color
    bgLayout: {
      type: "radial" | "linear" | "solid";
      radialSize?: string;
      radialPosition?: string;
      radialBaseStop?: number;
      direction?: string;
      colorStops?: number[];
           }       // "border-purple-500" for buttons/borders
  };

