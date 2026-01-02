"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CarouselItem } from '@/types/editorial';
import CarouselSlideEditor from "./carouselSlideEditor";
import { GripVertical } from "lucide-react";

export default function CarouselList({ id, items }: { id: string; items: CarouselItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <SortableSlide key={index} id={id} item={item} index={index} />
      ))}
    </div>
  );
}

function SortableSlide({ id, item, index }: { id: string; item: CarouselItem; index: number }) {
  const { setNodeRef, attributes, listeners, transform, transition } = useSortable({ id: index });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-lg border p-3 flex items-start gap-3">
      <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
        <GripVertical size={18} />
      </div>
      <CarouselSlideEditor id={id} item={item} index={index} />
    </div>
  );
}
