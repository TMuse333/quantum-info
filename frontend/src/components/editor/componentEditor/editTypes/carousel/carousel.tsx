"use client";

import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useEffect, useMemo } from "react";

import { useComponentEditor } from "@/context";
import { useCarouselStore } from "@/stores/carouselStore";
import { CarouselItem } from '@/types/editorial';
import CarouselImageUploader from "./carouselImageUploader";
import CarouselList from "./carouselList";
import { Plus } from "lucide-react";

const MAX_IMAGES = 20;

export default function CarouselEditorPanel() {
  const { currentComponent } = useComponentEditor();
  const isCarousel = currentComponent!.category === "carousel" && !!currentComponent!.id;

  const carousels = useCarouselStore((s) => s.carousels);
  const setCarousel = useCarouselStore((s) => s.setCarousel);
  const addItem = useCarouselStore((s) => s.addItem);
  const reorderItems = useCarouselStore((s) => s.reorderItems);

 

  const id = currentComponent!.id!;
  const items = useCarouselStore((s) => s.carousels[id] ?? []);

  useEffect(() => {
    // Initialize empty list if it doesn’t exist yet
    if (!carousels[id]) setCarousel(id, []);
  }, [id, carousels, setCarousel]);

  const handleAddSlide = () =>
    addItem(id, {
      image: { src: "/placeholder.webp", alt: "New Slide" },
      title: "New Slide",
      description: "",
    });

    if (!isCarousel) {
      return <div>Not a carousel component</div>;
    }

  return (
    <div className="flex flex-col space-y-4">
      <h3 className="font-semibold">Carousel Items ({items.length})</h3>
      <CarouselImageUploader componentId={id} />
      <DndContext collisionDetection={closestCenter} onDragEnd={(e) => {
        if (e.over && e.active.id !== e.over.id) {
          reorderItems(id, Number(e.active.id), Number(e.over.id));
        }
      }}>
        <SortableContext items={items.map((_, i) => i)} strategy={verticalListSortingStrategy}>
          <CarouselList id={id} items={items} />
        </SortableContext>
      </DndContext>
      <button
        onClick={handleAddSlide}
        className="flex items-center justify-center gap-2 bg-blue-600 text-white p-2 rounded-lg"
      >
        <Plus size={16} /> Add Slide
      </button>
    </div>
  );
}
