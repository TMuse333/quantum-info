import ProcessStepsEdit from "./processStepsEdit";
import { EditableComponent } from "@/types/editorial";
import { BaseComponentProps, ImageProp } from "@/types";;

export const processStepsDetails: EditableComponent = {
  name: "ProcessSteps",
  details: "A timeline or numbered step-by-step process section showing how working with the business unfolds. Perfect for demystifying complex processes and setting clear expectations.",
  uniqueEdits: ["title", "subTitle", "description", "textArray"],
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
      key: "description",
      label: "Description",
      description: "Supporting body text explaining the process overview",
      type: "text",
      wordLimit: 40,
    },
    {
      key: "textArray",
      label: "Process Steps",
      description: "Array of process steps with titles and descriptions",
      type: "standardArray",
      arrayLength: { min: 3, max: 8 },
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
      description: "Foreground color for highlights, gradients, step numbers, and connectors",
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

export interface ProcessStepsProps extends Partial<BaseComponentProps> {
  title?: string;
  subTitle?: string;
  description?: string;
  images?: {
    main?: ImageProp;
  };
  textArray?: {
    title: string;
    description: string;
  }[];
}

export const defaultProcessStepsProps: Required<Omit<ProcessStepsProps, 'textArray'>> & { textArray: { title: string; description: string }[] } = {
  textColor: '#1f2937',
  baseBgColor: '#f0f9ff',
  mainColor: '#3B82F6',
  bgLayout: {
    type: "radial",
    radialSize: "125% 125%",
    radialPosition: "50% 0%",
    radialBaseStop: 50,
  } as const,
  title: "Your Journey With Us",
  subTitle: "How It Works",
  description: "A clear, straightforward process designed to make your experience smooth and stress-free from start to finish.",
  buttonText: "",
  array: [],
  images: {},
  textArray: [
    {
      title: "Initial Consultation",
      description: "We meet to discuss your goals, timeline, and expectations. This is where we learn about your needs and answer all your questions.",
    },
    {
      title: "Strategy & Planning",
      description: "We develop a customized plan tailored to your specific situation, including market analysis and actionable next steps.",
    },
    {
      title: "Active Execution",
      description: "We put the plan into action, keeping you informed at every stage and handling all the complex details on your behalf.",
    },
    {
      title: "Review & Optimize",
      description: "We monitor progress closely and make adjustments as needed to ensure we're on track to meet your objectives.",
    },
    {
      title: "Successful Completion",
      description: "We finalize everything, ensure all paperwork is complete, and celebrate your success together.",
    },
  ],
  items: [],
};

export { ProcessStepsEdit };
