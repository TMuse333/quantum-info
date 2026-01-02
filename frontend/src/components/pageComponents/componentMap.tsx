import React from "react";
import { EditorialComponentProps } from "@/types/templateTypes";

// Imported components
import AuroraImageHeroEdit from "@/components/designs/herobanners/auroraImageHero/auroraImageHeroEdit";
import ImageTextBoxEdit from "@/components/designs/contentPieces/imageTextBox/imageTextBoxEdit";
import TextAndListEdit from "@/components/designs/textComponents/textAndList/textAndListEdit";
import ImageTextPointsEdit from "@/components/designs/contentPieces/imageTextPoints/imageTextPointsEdit";
import Testimonials3Edit from "@/components/designs/testimonials/testimonials3/testimonials3Edit";
import ContactCloserEdit from "@/components/designs/misc/contactCloser/contactCloserEdit";
import CarouselHeroEdit from "@/components/designs/herobanners/carouselHero/carouselHeroEdit";
import ExperienceCardEdit from "@/components/designs/contentPieces/experienceCard/experienceCardEdit";
import UniqueValuePropositionEdit from "@/components/designs/textComponents/uniqueValueProposition/uniqueValuePropositionEdit";
import ProcessStepsEdit from "@/components/designs/textComponents/processSteps/processStepsEdit";
import TestimonialsRealEstateEdit from "@/components/designs/testimonials/testimonialsRealEstate/testimonialsRealEstateEdit";
import ScrollCarouselEdit from "@/components/designs/carousels/scrollCarousel/scrollCarouselEdit";
import SplitScreenHeroEdit from "@/components/designs/herobanners/splitScreenHero/splitScreenHeroEdit";
import ProfileCredentialsEdit from "@/components/designs/contentPieces/profileCredentials/profileCredentialsEdit";
import PropertyCarouselEdit from "@/components/designs/carousels/propertyCarousel/propertyCarouselEdit";
import MarketingShowcaseEdit from "@/components/designs/contentPieces/marketingShowcase/marketingShowcaseEdit";

export const componentMap: Record<string, React.ComponentType<EditorialComponentProps>> = {
  auroraImageHero: AuroraImageHeroEdit,
  imageTextBox: ImageTextBoxEdit,
  textAndList: TextAndListEdit,
  imageTextPoints: ImageTextPointsEdit,
  testimonials3: Testimonials3Edit,
  contactCloser: ContactCloserEdit,
  carouselHero: CarouselHeroEdit,
  experienceCard: ExperienceCardEdit,
  uniqueValueProposition: UniqueValuePropositionEdit,
  processSteps: ProcessStepsEdit,
  testimonialsRealEstate: TestimonialsRealEstateEdit,
  scrollCarousel: ScrollCarouselEdit,
  splitScreenHero: SplitScreenHeroEdit,
  profileCredentials: ProfileCredentialsEdit,
  propertyCarousel: PropertyCarouselEdit,
  marketingShowcase: MarketingShowcaseEdit,
};

/**
 * Creates a render function that maps component types to their editorial components
 */
export function createRenderComponent() {
  return (component: any) => {
    // Hardcoded skip for removed samuraiCard component
    if (component.type === "samuraiCard") {
      console.warn(`Skipping removed component type: samuraiCard`);
      return null;
    }

    const Component = componentMap[component.type];
    if (!Component) {
      console.warn(`Unknown component type: ${component.type}`);
      return (
        <div className="p-4 border-2 border-dashed border-red-300 rounded-lg text-center">
          <p className="text-red-500 text-sm">
            Component <code className="bg-red-100 px-2 py-1 rounded">{component.type}</code> not found
          </p>
        </div>
      );
    }
    return <Component id={component.id} />;
  };
}

export default componentMap;
