/**
 * Production Component Registry
 *
 * Maps component types (as used in websiteData.json) to their production file paths,
 * component names, and prop types for code generation during deployment.
 */

export interface ComponentRegistryEntry {
  /** The import path for the component */
  componentImportPath: string;
  /** The component name (PascalCase) */
  componentName: string;
  /** The props type name (e.g., "AuroraImageHeroProps") */
  propsTypeName: string;
  /** The import path for the props type (same as component, from .tsx file) */
  propsImportPath: string;
  /** The category of the component */
  category: 'hero' | 'navbar' | 'footer' | 'carousel' | 'content' | 'text' | 'testimonial' | 'form' | 'solution' | 'animation' | 'misc';
}

export const PRODUCTION_COMPONENTS: Record<string, ComponentRegistryEntry> = {
  // ============================================================================
  // HERO BANNERS
  // ============================================================================
  auroraHero: {
    componentImportPath: '@/components/designs/herobanners/auroraHero/auroraHero',
    componentName: 'AuroraHero',
    propsTypeName: 'AuroraHeroProps',
    propsImportPath: '@/components/designs/herobanners/auroraHero/auroraHero',
    category: 'hero',
  },
  auroraImageHero: {
    componentImportPath: '@/components/designs/herobanners/auroraImageHero/auroraImageHero',
    componentName: 'AuroraImageHero',
    propsTypeName: 'AuroraImageHeroProps',
    propsImportPath: '@/components/designs/herobanners/auroraImageHero/auroraImageHero',
    category: 'hero',
  },
  bgImageHero: {
    componentImportPath: '@/components/designs/herobanners/bgImageHero/bgImageHero',
    componentName: 'BgImageHero',
    propsTypeName: 'BgImageHeroProps',
    propsImportPath: '@/components/designs/herobanners/bgImageHero/bgImageHero',
    category: 'hero',
  },
  carouselHero: {
    componentImportPath: '@/components/designs/herobanners/carouselHero/carouselHero',
    componentName: 'CarouselHero',
    propsTypeName: 'CarouselHeroProps',
    propsImportPath: '@/components/designs/herobanners/carouselHero/carouselHero',
    category: 'hero',
  },
  centeredHero: {
    componentImportPath: '@/components/designs/herobanners/centeredHero/centeredHero',
    componentName: 'CenteredHero',
    propsTypeName: 'CenteredHeroProps',
    propsImportPath: '@/components/designs/herobanners/centeredHero/centeredHero',
    category: 'hero',
  },
  dynamicHerobanner: {
    componentImportPath: '@/components/designs/herobanners/dynamicHerobanner/dynamicHerobanner',
    componentName: 'DynamicHerobanner',
    propsTypeName: 'DynamicHerobannerProps',
    propsImportPath: '@/components/designs/herobanners/dynamicHerobanner/dynamicHerobanner',
    category: 'hero',
  },
  fullBodyHero: {
    componentImportPath: '@/components/designs/herobanners/fullBodyHero/fullBodyHero',
    componentName: 'FullBodyHero',
    propsTypeName: 'FullBodyHeroProps',
    propsImportPath: '@/components/designs/herobanners/fullBodyHero/fullBodyHero',
    category: 'hero',
  },
  imageLogoHero: {
    componentImportPath: '@/components/designs/herobanners/imageLogoHero/imageLogoHero',
    componentName: 'ImageLogoHero',
    propsTypeName: 'ImageLogoHeroProps',
    propsImportPath: '@/components/designs/herobanners/imageLogoHero/imageLogoHero',
    category: 'hero',
  },
  splitScreenHero: {
    componentImportPath: '@/components/designs/herobanners/splitScreenHero/splitScreenHero',
    componentName: 'SplitScreenHero',
    propsTypeName: 'SplitScreenHeroProps',
    propsImportPath: '@/components/designs/herobanners/splitScreenHero/splitScreenHero',
    category: 'hero',
  },
  threeBoxHero: {
    componentImportPath: '@/components/designs/herobanners/threeBoxHero/threeBoxHero',
    componentName: 'ThreeBoxHero',
    propsTypeName: 'ThreeBoxHeroProps',
    propsImportPath: '@/components/designs/herobanners/threeBoxHero/threeBoxHero',
    category: 'hero',
  },

  // ============================================================================
  // NAVBARS
  // ============================================================================
  landingNavbar: {
    componentImportPath: '@/components/designs/navbars/landingNavbar/landingNavbar',
    componentName: 'LandingNavbar',
    propsTypeName: 'LandingNavbarProps',
    propsImportPath: '@/components/designs/navbars/landingNavbar/landingNavbar',
    category: 'navbar',
  },
  navbar1: {
    componentImportPath: '@/components/designs/navbars/navbar1/navbar1',
    componentName: 'Navbar1',
    propsTypeName: 'Navbar1Props',
    propsImportPath: '@/components/designs/navbars/navbar1/navbar1',
    category: 'navbar',
  },

  // ============================================================================
  // FOOTERS
  // ============================================================================
  footer1: {
    componentImportPath: '@/components/designs/footers/footer1/footer1',
    componentName: 'Footer1',
    propsTypeName: 'Footer1Props',
    propsImportPath: '@/components/designs/footers/footer1/footer1',
    category: 'footer',
  },
  landingFooter: {
    componentImportPath: '@/components/designs/footers/landingFooter/landingFooter',
    componentName: 'LandingFooter',
    propsTypeName: 'LandingFooterProps',
    propsImportPath: '@/components/designs/footers/landingFooter/landingFooter',
    category: 'footer',
  },

  // ============================================================================
  // CAROUSELS
  // ============================================================================
  carousel: {
    componentImportPath: '@/components/designs/carousels/carousel/carousel',
    componentName: 'Carousel',
    propsTypeName: 'CarouselProps',
    propsImportPath: '@/components/designs/carousels/carousel',
    category: 'carousel',
  },
  googleReviews: {
    componentImportPath: '@/components/designs/carousels/googleReviews/googleReviews',
    componentName: 'GoogleReviews',
    propsTypeName: 'GoogleReviewsProps',
    propsImportPath: '@/components/designs/carousels/googleReviews',
    category: 'carousel',
  },
  gridCarousel: {
    componentImportPath: '@/components/designs/carousels/gridCarousel/gridCarousel',
    componentName: 'GridCarousel',
    propsTypeName: 'GridCarouselProps',
    propsImportPath: '@/components/designs/carousels/gridCarousel',
    category: 'carousel',
  },
  longCarousel: {
    componentImportPath: '@/components/designs/carousels/longCarousel/longCarousel',
    componentName: 'LongCarousel',
    propsTypeName: 'LongCarouselProps',
    propsImportPath: '@/components/designs/carousels/longCarousel',
    category: 'carousel',
  },
  propertyCarousel: {
    componentImportPath: '@/components/designs/carousels/propertyCarousel/propertyCarousel',
    componentName: 'PropertyCarousel',
    propsTypeName: 'PropertyCarouselProps',
    propsImportPath: '@/components/designs/carousels/propertyCarousel',
    category: 'carousel',
  },
  scrollCarousel: {
    componentImportPath: '@/components/designs/carousels/scrollCarousel/scrollCarousel',
    componentName: 'ScrollCarousel',
    propsTypeName: 'ScrollCarouselProps',
    propsImportPath: '@/components/designs/carousels/scrollCarousel',
    category: 'carousel',
  },
  slideShowCarousel: {
    componentImportPath: '@/components/designs/carousels/slideShowCarousel/slideShowCarousel',
    componentName: 'SlideShowCarousel',
    propsTypeName: 'SlideShowCarouselProps',
    propsImportPath: '@/components/designs/carousels/slideShowCarousel',
    category: 'carousel',
  },
  stepsCarousel: {
    componentImportPath: '@/components/designs/carousels/stepsCarousel/stepsCarousel',
    componentName: 'StepsCarousel',
    propsTypeName: 'StepsCarouselProps',
    propsImportPath: '@/components/designs/carousels/stepsCarousel',
    category: 'carousel',
  },

  // ============================================================================
  // CONTENT PIECES
  // ============================================================================
  closingStatement: {
    componentImportPath: '@/components/designs/contentPieces/closingStatement/closingStatement',
    componentName: 'ClosingStatement',
    propsTypeName: 'ClosingStatementProps',
    propsImportPath: '@/components/designs/contentPieces/closingStatement',
    category: 'content',
  },
  countUpImageText: {
    componentImportPath: '@/components/designs/contentPieces/countUpImageText/countUpImageText',
    componentName: 'CountUpImageText',
    propsTypeName: 'CountUpImageTextProps',
    propsImportPath: '@/components/designs/contentPieces/countUpImageText',
    category: 'content',
  },
  experienceCard: {
    componentImportPath: '@/components/designs/contentPieces/experienceCard/experienceCard',
    componentName: 'ExperienceCard',
    propsTypeName: 'ExperienceCardProps',
    propsImportPath: '@/components/designs/contentPieces/experienceCard/experienceCard',
    category: 'content',
  },
  imageTextBox: {
    componentImportPath: '@/components/designs/contentPieces/imageTextBox/imageTextBox',
    componentName: 'ImageTextBox',
    propsTypeName: 'ImageTextBoxProps',
    propsImportPath: '@/components/designs/contentPieces/imageTextBox/imageTextBox',
    category: 'content',
  },
  imageTextPoints: {
    componentImportPath: '@/components/designs/contentPieces/imageTextPoints/imageTextPoints',
    componentName: 'ImageTextPoints',
    propsTypeName: 'ImageTextPointsProps',
    propsImportPath: '@/components/designs/contentPieces/imageTextPoints',
    category: 'content',
  },
  marketingShowcase: {
    componentImportPath: '@/components/designs/contentPieces/marketingShowcase/marketingShowcase',
    componentName: 'MarketingShowcase',
    propsTypeName: 'MarketingShowcaseProps',
    propsImportPath: '@/components/designs/contentPieces/marketingShowcase/marketingShowcase',
    category: 'content',
  },
  parallaxText: {
    componentImportPath: '@/components/designs/contentPieces/parallaxText/parallaxText',
    componentName: 'ParallaxText',
    propsTypeName: 'ParallaxTextProps',
    propsImportPath: '@/components/designs/contentPieces/parallaxText',
    category: 'content',
  },
  profileCredentials: {
    componentImportPath: '@/components/designs/contentPieces/profileCredentials/profileCredentials',
    componentName: 'ProfileCredentials',
    propsTypeName: 'ProfileCredentialsProps',
    propsImportPath: '@/components/designs/contentPieces/profileCredentials/profileCredentials',
    category: 'content',
  },
  samuraiCard: {
    componentImportPath: '@/components/designs/contentPieces/samuraiCard/samuraiCard',
    componentName: 'SamuraiCard',
    propsTypeName: 'SamuraiCardProps',
    propsImportPath: '@/components/designs/contentPieces/samuraiCard',
    category: 'content',
  },
  statsIntro: {
    componentImportPath: '@/components/designs/contentPieces/statsIntro/statsIntro',
    componentName: 'StatsIntro',
    propsTypeName: 'StatsIntroProps',
    propsImportPath: '@/components/designs/contentPieces/statsIntro',
    category: 'content',
  },
  textBoxPoints: {
    componentImportPath: '@/components/designs/contentPieces/textBoxPoints/textBoxPoints',
    componentName: 'TextBoxPoints',
    propsTypeName: 'TextBoxPointsProps',
    propsImportPath: '@/components/designs/contentPieces/textBoxPoints',
    category: 'content',
  },
  tiltingContent: {
    componentImportPath: '@/components/designs/contentPieces/tiltingContent/tiltingContent',
    componentName: 'TiltingContent',
    propsTypeName: 'TiltingContentProps',
    propsImportPath: '@/components/designs/contentPieces/tiltingContent',
    category: 'content',
  },
  verticalImageTextBox: {
    componentImportPath: '@/components/designs/contentPieces/verticalImageTextBox/verticalImageTextBox',
    componentName: 'VerticalImageTextBox',
    propsTypeName: 'VerticalImageTextBoxProps',
    propsImportPath: '@/components/designs/contentPieces/verticalImageTextBox',
    category: 'content',
  },

  // ============================================================================
  // TEXT COMPONENTS
  // ============================================================================
  accordion: {
    componentImportPath: '@/components/designs/textComponents/accordion/accordion',
    componentName: 'Accordion',
    propsTypeName: 'AccordionProps',
    propsImportPath: '@/components/designs/textComponents/accordion',
    category: 'text',
  },
  featureBoxes: {
    componentImportPath: '@/components/designs/textComponents/featureBoxes/featureBoxes',
    componentName: 'FeatureBoxes',
    propsTypeName: 'FeatureBoxesProps',
    propsImportPath: '@/components/designs/textComponents/featureBoxes',
    category: 'text',
  },
  howItWorks: {
    componentImportPath: '@/components/designs/textComponents/howItWorks/howItWorks',
    componentName: 'HowItWorks',
    propsTypeName: 'HowItWorksProps',
    propsImportPath: '@/components/designs/textComponents/howItWorks',
    category: 'text',
  },
  imageAspects: {
    componentImportPath: '@/components/designs/textComponents/imageAspects/imageAspects',
    componentName: 'ImageAspects',
    propsTypeName: 'ImageAspectsProps',
    propsImportPath: '@/components/designs/textComponents/imageAspects',
    category: 'text',
  },
  processSteps: {
    componentImportPath: '@/components/designs/textComponents/processSteps/processSteps',
    componentName: 'ProcessSteps',
    propsTypeName: 'ProcessStepsProps',
    propsImportPath: '@/components/designs/textComponents/processSteps/processSteps',
    category: 'text',
  },
  textAndList: {
    componentImportPath: '@/components/designs/textComponents/textAndList/textAndList',
    componentName: 'TextAndList',
    propsTypeName: 'TextAndListProps',
    propsImportPath: '@/components/designs/textComponents/textAndList/textAndList',
    category: 'text',
  },
  valueProposition: {
    componentImportPath: '@/components/designs/textComponents/valueProposition/valueProposition',
    componentName: 'UniqueValueProposition',
    propsTypeName: 'UniqueValuePropositionProps',
    propsImportPath: '@/components/designs/textComponents/valueProposition/valueProposition',
    category: 'text',
  },

  // ============================================================================
  // TESTIMONIALS
  // ============================================================================
  testimonials: {
    componentImportPath: '@/components/designs/testimonials/testimonials/testimonials',
    componentName: 'Testimonials',
    propsTypeName: 'TestimonialsProps',
    propsImportPath: '@/components/designs/testimonials/testimonials',
    category: 'testimonial',
  },
  testimonials2: {
    componentImportPath: '@/components/designs/testimonials/testimonials2/testimonials2',
    componentName: 'Testimonials2',
    propsTypeName: 'Testimonials2Props',
    propsImportPath: '@/components/designs/testimonials/testimonials2',
    category: 'testimonial',
  },
  testimonials3: {
    componentImportPath: '@/components/designs/testimonials/testimonials3/testimonials3',
    componentName: 'Testimonials3',
    propsTypeName: 'Testimonials3Props',
    propsImportPath: '@/components/designs/testimonials/testimonials3/testimonials3',
    category: 'testimonial',
  },
  testimonialsRealEstate: {
    componentImportPath: '@/components/designs/testimonials/testimonialsRealEstate/testimonialsRealEstate',
    componentName: 'TestimonialsRealEstate',
    propsTypeName: 'TestimonialsRealEstateProps',
    propsImportPath: '@/components/designs/testimonials/testimonialsRealEstate',
    category: 'testimonial',
  },

  // ============================================================================
  // FORMS
  // ============================================================================
  contactCloser2: {
    componentImportPath: '@/components/designs/forms/contactCloser2/contactCloser',
    componentName: 'ContactCloser2',
    propsTypeName: 'ContactCloser2Props',
    propsImportPath: '@/components/designs/forms/contactCloser2',
    category: 'form',
  },

  // ============================================================================
  // SOLUTION PIECES
  // ============================================================================
  displayBoxes: {
    componentImportPath: '@/components/designs/solutionPieces/displayBoxes/displayBoxes',
    componentName: 'DisplayBoxes',
    propsTypeName: 'DisplayBoxesProps',
    propsImportPath: '@/components/designs/solutionPieces/displayBoxes',
    category: 'solution',
  },
  fullImageDisplay: {
    componentImportPath: '@/components/designs/solutionPieces/fullImageDisplay/fullImageDisplayBox',
    componentName: 'FullImageDisplay',
    propsTypeName: 'FullImageDisplayProps',
    propsImportPath: '@/components/designs/solutionPieces/fullImageDisplay',
    category: 'solution',
  },
  priceCards: {
    componentImportPath: '@/components/designs/solutionPieces/priceCards/priceCards',
    componentName: 'PriceCards',
    propsTypeName: 'PriceCardsProps',
    propsImportPath: '@/components/designs/solutionPieces/priceCards',
    category: 'solution',
  },

  // ============================================================================
  // TEXT ANIMATIONS
  // ============================================================================
  appearingGradient: {
    componentImportPath: '@/components/designs/textAnimations/appearingGradient/appearingGradient',
    componentName: 'AppearingGradient',
    propsTypeName: 'AppearingGradientProps',
    propsImportPath: '@/components/designs/textAnimations/appearingGradient',
    category: 'animation',
  },
  fadeInFromLeftText: {
    componentImportPath: '@/components/designs/textAnimations/fadeInFromLeftText/fadeInFromLeftText',
    componentName: 'FadeInFromLeftText',
    propsTypeName: 'FadeInFromLeftTextProps',
    propsImportPath: '@/components/designs/textAnimations/fadeInFromLeftText',
    category: 'animation',
  },
  slidingText: {
    componentImportPath: '@/components/designs/textAnimations/slidingText/slidingText',
    componentName: 'SlidingText',
    propsTypeName: 'SlidingTextProps',
    propsImportPath: '@/components/designs/textAnimations/slidingText',
    category: 'animation',
  },
  typeAlongText: {
    componentImportPath: '@/components/designs/textAnimations/typeAlongText/typeAlongText',
    componentName: 'TypeAlongText',
    propsTypeName: 'TypeAlongTextProps',
    propsImportPath: '@/components/designs/textAnimations/typeAlongText',
    category: 'animation',
  },
  typeWriter: {
    componentImportPath: '@/components/designs/textAnimations/typeWriter/typeWriter',
    componentName: 'TypeWriter',
    propsTypeName: 'TypeWriterProps',
    propsImportPath: '@/components/designs/textAnimations/typeWriter',
    category: 'animation',
  },

  // ============================================================================
  // MISC
  // ============================================================================
  contactCloser: {
    componentImportPath: '@/components/designs/misc/contactCloser/contactCloser',
    componentName: 'ContactCloser',
    propsTypeName: 'ContactCloserProps',
    propsImportPath: '@/components/designs/misc/contactCloser',
    category: 'misc',
  },
  imageTextAspects: {
    componentImportPath: '@/components/designs/imageText/imageTextAspects/imageTextAspects',
    componentName: 'ImageTextAspects',
    propsTypeName: 'ImageTextAspectsProps',
    propsImportPath: '@/components/designs/imageText/imageTextAspects',
    category: 'misc',
  },
};

/**
 * Helper function to get component information by type
 * @param type - The component type as used in websiteData.json (e.g., "auroraImageHero")
 * @returns The registry entry for the component, or undefined if not found
 */
export function getComponentInfo(type: string): ComponentRegistryEntry | undefined {
  return PRODUCTION_COMPONENTS[type];
}

/**
 * Helper function to get all component types
 * @returns Array of all registered component types
 */
export function getAllComponentTypes(): string[] {
  return Object.keys(PRODUCTION_COMPONENTS);
}

/**
 * Helper function to get components by category
 * @param category - The category to filter by
 * @returns Array of component types in that category
 */
export function getComponentsByCategory(
  category: ComponentRegistryEntry['category']
): string[] {
  return Object.entries(PRODUCTION_COMPONENTS)
    .filter(([_, entry]) => entry.category === category)
    .map(([type, _]) => type);
}

/**
 * Helper function to validate if a component type exists
 * @param type - The component type to check
 * @returns True if the component type is registered
 */
export function isValidComponentType(type: string): boolean {
  return type in PRODUCTION_COMPONENTS;
}
