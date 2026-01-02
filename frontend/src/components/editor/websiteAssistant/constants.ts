import React from 'react';
import { Palette, FileText, HelpCircle, Settings, Plus } from 'lucide-react';
import type { ModeOption } from './types';
import type { EditableComponent } from '@/types/editorial';

// Component detail imports
import { auroraImageHeroDetails } from "@/components/designs/herobanners/auroraImageHero";
import { imageTextBoxDetails } from "@/components/designs/contentPieces/imageTextBox";
import { textAndListDetails } from "@/components/designs/textComponents/textAndList";
import { imageTextPointsDetails } from "@/components/designs/contentPieces/imageTextPoints";
import { testimonials3Details } from "@/components/designs/testimonials/testimonials3";
import { contactCloserDetails } from "@/components/designs/misc/contactCloser";
import { carouselHeroDetails } from "@/components/designs/herobanners/carouselHero";
import { experienceCardDetails } from "@/components/designs/contentPieces/experienceCard";
import { uniqueValuePropositionDetails } from "@/components/designs/textComponents/uniqueValueProposition";
import { processStepsDetails } from "@/components/designs/textComponents/processSteps";
import { testimonialsRealEstateDetails } from "@/components/designs/testimonials/testimonialsRealEstate";
import { scrollCarouselDetails } from "@/components/designs/carousels/scrollCarousel";
import { splitScreenHeroDetails } from "@/components/designs/herobanners/splitScreenHero";
import { profileCredentialsDetails } from "@/components/designs/contentPieces/profileCredentials";
import { propertyCarouselDetails } from "@/components/designs/carousels/propertyCarousel";
import { marketingShowcaseDetails } from "@/components/designs/contentPieces/marketingShowcase";

// Mode options configuration
export const MODE_OPTIONS: ModeOption[] = [
  {
    id: 'colors',
    label: 'Edit Colors',
    icon: React.createElement(Palette, { className: "w-5 h-5" }),
    description: 'Change colors and styles',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'text',
    label: 'Edit Text',
    icon: React.createElement(FileText, { className: "w-5 h-5" }),
    description: 'Update content and copy',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'general',
    label: 'General Question',
    icon: React.createElement(HelpCircle, { className: "w-5 h-5" }),
    description: 'Ask about website building',
    collection: 'general-website-knowledge',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'modify-component',
    label: 'Modify Component',
    icon: React.createElement(Settings, { className: "w-5 h-5" }),
    description: 'Change component structure',
    collection: 'component-knowledge',
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'new-component',
    label: 'Make New Component',
    icon: React.createElement(Plus, { className: "w-5 h-5" }),
    description: 'Create a new component',
    collection: 'component-knowledge',
    color: 'from-indigo-500 to-purple-500',
  },
];

// Map component types to their details
export const COMPONENT_DETAILS_MAP: Record<string, EditableComponent> = {
  auroraImageHero: auroraImageHeroDetails,
  imageTextBox: imageTextBoxDetails,
  textAndList: textAndListDetails,
  imageTextPoints: imageTextPointsDetails,
  testimonials3: testimonials3Details,
  contactCloser: contactCloserDetails,
  carouselHero: carouselHeroDetails,
  experienceCard: experienceCardDetails,
  uniqueValueProposition: uniqueValuePropositionDetails,
  processSteps: processStepsDetails,
  testimonialsRealEstate: testimonialsRealEstateDetails,
  scrollCarousel: scrollCarouselDetails,
  splitScreenHero: splitScreenHeroDetails,
  profileCredentials: profileCredentialsDetails,
  propertyCarousel: propertyCarouselDetails,
  marketingShowcase: marketingShowcaseDetails,
};
