"use client";

import { use } from "react";
import PageRenderer from "@/components/pageComponents/PageRenderer";

export default function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <PageRenderer pageSlug={slug} />;
}
