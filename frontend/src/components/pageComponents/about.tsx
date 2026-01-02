"use client";

import ProfileCredentials from '@/components/designs/contentPieces/profileCredentials/profileCredentials';
import ProcessSteps from '@/components/designs/textComponents/processSteps/processSteps';
import { component1Props, component2Props } from '@/data/about.data';

export default function AboutPage() {
  return (
    <main>
      <ProfileCredentials {...component1Props} />
      <ProcessSteps {...component2Props} />
    </main>
  );
}
