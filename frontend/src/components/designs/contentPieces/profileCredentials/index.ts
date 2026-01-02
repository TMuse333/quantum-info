import { BaseComponentProps, EditableComponent, ImageProp } from "@/types";

export const profileCredentialsDetails: EditableComponent = {
  name: "ProfileCredentials",
  details: "A two-column section combining personal introduction with professional credentials. Left side features a personal photo and bio, right side showcases achievements, badges, and affiliations.",
  uniqueEdits: ["title", "subTitle", "description", "textArray"],
  editableFields: [
    {
      key: "title",
      label: "Title",
      description: "Main section headline",
      type: "text",
      wordLimit: 10,
    },
    {
      key: "subTitle",
      label: "Subtitle",
      description: "Optional supporting text below title",
      type: "text",
      wordLimit: 12,
    },
    {
      key: "description",
      label: "Personal Bio",
      description: "Personal story, background, or connection to the work",
      type: "text",
      wordLimit: 80,
    },
    {
      key: "textArray",
      label: "Credentials/Achievements",
      description: "Array of credentials, certifications, or achievements",
      type: "standardArray",
      arrayLength: { min: 3, max: 8 },
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
      description: "Accent color for highlights, badges, and borders",
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

export interface ProfileCredentialsProps extends BaseComponentProps {
  title: string;
  subTitle: string;
  description: string;
  buttonText: string;
  images: {
    profile: ImageProp;
  };
  textArray: {
    title: string;
    description: string;
  }[];
}

export const defaultProfileCredentialsProps: Required<Omit<ProfileCredentialsProps, 'textArray' >> & { textArray: { title: string; description: string }[] } = {
  textColor: "#1f2937",
  baseBgColor: "#f0f9ff",
  mainColor: "#3B82F6",
  bgLayout: {
    type: "radial",
    radialSize: "125% 125%",
    radialPosition: "50% 0%",
    radialBaseStop: 50,
  } as const,
  title: "Get to Know Me",
  subTitle: "Building trust through transparency and dedication",
  description: "I've lived in this community for over 20 years and have watched it grow into the vibrant place it is today. My passion for helping people find their perfect home comes from my own experience - I know how important this decision is for you and your family.\n\nWhether you're a first-time buyer or looking to sell, I'm here to guide you through every step with honesty, expertise, and genuine care.",
  buttonText: "",
  array: [],
  images: {
    profile: {
      src: '/placeholder.webp',
      alt: 'Professional profile photo',
    },
  },
  textArray: [
    {
      title: "Local Expert",
      description: "20+ years of experience in the local real estate market",
    },
    {
      title: "Top Producer",
      description: "Consistently ranked in the top 5% of agents nationwide",
    },
    {
      title: "Client-Focused",
      description: "Dedicated to making your real estate journey smooth and successful",
    },
  ],
  items: [],
};

export { };