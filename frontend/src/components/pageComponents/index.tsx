"use client";

import AuroraImageHero from '@/components/designs/herobanners/auroraImageHero/auroraImageHero';
import TextAndList from '@/components/designs/textComponents/textAndList/textAndList';
import ExperienceCard from '@/components/designs/contentPieces/experienceCard/experienceCard';
import ImageTextBox from '@/components/designs/contentPieces/imageTextBox/imageTextBox';
import Testimonials3 from '@/components/designs/testimonials/testimonials3/testimonials3';
import { component1Props, component2Props, component3Props, component4Props, component5Props } from '@/data/index.data';

export default function HomePage() {
  return (
    <main>
      <AuroraImageHero {...component1Props} />
      <TextAndList {...component2Props} />
      <ExperienceCard {...component3Props} />
      <ImageTextBox {...component4Props} />
      <Testimonials3 {...component5Props} />
    </main>
  );
}
