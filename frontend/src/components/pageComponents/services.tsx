"use client";

import UniqueValueProposition from '@/components/designs/textComponents/valueProposition/valueProposition';
import MarketingShowcase from '@/components/designs/contentPieces/marketingShowcase/marketingShowcase';
import { component1Props, component2Props } from '@/data/services.data';

export default function ServicesPage() {
  return (
    <main>
      <UniqueValueProposition {...component1Props} />
      <MarketingShowcase {...component2Props} />
    </main>
  );
}
