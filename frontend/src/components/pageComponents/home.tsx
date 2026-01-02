import AuroraImageHero, { AuroraImageHeroProps } from '@/components/designs/herobanners/auroraImageHero/auroraImageHero';
import TextAndList, { TextAndListProps } from '@/components/designs/textComponents/textAndList/textAndList';
import ExperienceCard, { ExperienceCardProps } from '@/components/designs/contentPieces/experienceCard/experienceCard';
import ImageTextBox, { ImageTextBoxProps } from '@/components/designs/contentPieces/imageTextBox/imageTextBox';
import Testimonials3, { Testimonials3Props } from '@/components/designs/testimonials/testimonials3/testimonials3';
import { component1Props, component2Props, component3Props, component4Props, component5Props } from '@/data/home.data';

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
