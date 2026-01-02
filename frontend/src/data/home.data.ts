/**
 * Generated page data file
 * This file contains the props and metadata for all components on this page
 */

import { AuroraImageHeroProps } from "@/components/designs/herobanners/auroraImageHero";
import { TextAndListProps } from "@/components/designs/textComponents/textAndList";
import { ExperienceCardProps } from "@/components/designs/contentPieces/experienceCard";
import { ImageTextBoxProps } from "@/components/designs/contentPieces/imageTextBox";
import { Testimonials3Props } from "@/components/designs/testimonials/testimonials3";

// Component Props
export const component1Props: AuroraImageHeroProps = {
  "title": "the ai web developer",
  "description": "refresh",
  "mainColor": "#006d8f",
  "textColor": "#ffffff",
  "baseBgColor": "#000000",
  "bgLayout": {
    "type": "radial",
    "radialSize": "125% 125%",
    "radialPosition": "50% 0%",
    "radialBaseStop": 50
  },
  "images": {
    "main": {
      "src": "https://maf7vdyjaxjtyxfd.public.blob.vercel-storage.com/users/thomaslmusial%40gmail.com/focusFlow-brain-nobg-NFaUur9QoSpvDvYj5MSC5JXEtc9yjn.webp",
      "alt": "Hero Image"
    }
  },
  "subTitle": "focusflow software presents",
  "buttonText": "get yours today"
};

export const component2Props: TextAndListProps = {
  "title": "this is excellent!",
  "description": "this is a solid piece of software",
  "textArray": [
    {
      "title": "real one",
      "description": "lots of leg days"
    },
    {
      "title": "Feature Two",
      "description": "big arms"
    }
  ],
  "mainColor": "#006d8f",
  "textColor": "#ffffff",
  "baseBgColor": "#000000",
  "bgLayout": {
    "type": "radial",
    "radialSize": "125% 125%",
    "radialPosition": "50% 0%",
    "radialBaseStop": 50
  },
  "images": {
    "main": {
      "src": "https://maf7vdyjaxjtyxfd.public.blob.vercel-storage.com/users/thomaslmusial%40gmail.com/aboubacar-5-fire-KpuQm2cDnmKDm6dWOTdkiJt6BwKXR1.webp",
      "alt": "placeholder"
    }
  },

  "subTitle": "ai web developer",
  "buttonText": ""
};

export const component3Props: ExperienceCardProps = {
  "title": "work faster and smarter",
  "description": "wakey wakey",
  "subTitle": "Trusted by Many",
  "buttonText": "Learn More",
  "mainColor": "#006d8f",
  "textColor": "#ffffff",
  "baseBgColor": "#000000",
  "bgLayout": {
    "type": "radial",
    "radialSize": "125% 125%",
    "radialPosition": "50% 0%",
    "radialBaseStop": 50
  },
  "array": [
    {
      "type": "StandardText",
      "title": "playas play playa"
    },
    {
      "type": "StandardText",
      "title": "ah"
    },
    {
      "type": "StandardText",
      "title": "be pure (at least try)"
    }
  ],
  "images": {
    "main": {
      "src": "https://maf7vdyjaxjtyxfd.public.blob.vercel-storage.com/users/thomaslmusial%40gmail.com/Gemini_Generated_Image_vxy9isvxy9isvxy9-fhxdwcGggnwpcG3wtEOmpzr7WDpEjA.png",
      "alt": "Intro Placeholder Image"
    }
  },

};

export const component4Props: ImageTextBoxProps = {
  "title": "be about it",
  "description": "This component combines images with text content.",
  "mainColor": "#006d8f",
  "textColor": "#ffffff",
  "baseBgColor": "#000000",
  "bgLayout": {
    "type": "radial",
    "radialSize": "125% 125%",
    "radialPosition": "50% 0%",
    "radialBaseStop": 50
  },
  "images": {
    "main": {
      "src": "https://maf7vdyjaxjtyxfd.public.blob.vercel-storage.com/users/thomaslmusial%40gmail.com/focusFlow-brain-nobg-NFaUur9QoSpvDvYj5MSC5JXEtc9yjn.webp",
      "alt": "Featured Image"
    }
  },

  "subTitle": "",
  "buttonText": ""
};

export const component5Props: Testimonials3Props = {
  "title": "Client Testimonials",
  "description": "What our clients say about us.",
  "testimonials": [
    {
      "name": "John Doe",
      "role": "Client",
      "quote": "Great service and attention to detail!"
    }
  ],
  "mainColor": "#006d8f",
  "textColor": "#ffffff",
  "baseBgColor": "#000000",
  "bgLayout": {
    "type": "radial",
    "radialSize": "125% 125%",
    "radialPosition": "50% 0%",
    "radialBaseStop": 50
  },
  "subTitle": "",
  "buttonText": ""
};

// Components Array with metadata
export const components = [
  {
    "id": "hero-1",
    "type": "auroraImageHero",
    "order": 0,
    "propsVar": "component1Props"
  },
  {
    "id": "text-and-list-1",
    "type": "textAndList",
    "order": 1,
    "propsVar": "component2Props"
  },
  {
    "id": "experience-card-1",
    "type": "experienceCard",
    "order": 2,
    "propsVar": "component3Props"
  },
  {
    "id": "image-text-box-1",
    "type": "imageTextBox",
    "order": 3,
    "propsVar": "component4Props"
  },
  {
    "id": "testimonials-1",
    "type": "testimonials3",
    "order": 5,
    "propsVar": "component5Props"
  }
];
