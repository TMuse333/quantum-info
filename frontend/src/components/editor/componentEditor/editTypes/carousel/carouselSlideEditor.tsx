"use client";
import { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import EditableTextField from "@/components/editor/editableTextField/editableTextArea";
import { useCarouselStore } from "@/stores/carouselStore";
import { AnimatePresence, motion } from "framer-motion";
import { CarouselItem } from '@/types/editorial';

interface Props {
    id: string;
    item: CarouselItem;
    index: number;
}

export default function CarouselSlideEditor({ id, item, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const updateItem = useCarouselStore((s) => s.updateItem);
  const removeItem = useCarouselStore((s) => s.removeItem);

  // Grab the current carousel items from the store
  const carouselItems = useCarouselStore((s) => s.carousels[id] ?? []);

  // Log whenever this carousel's items change
  useEffect(() => {
    console.log(`Carousel "${id}" items changed:`, carouselItems);
  }, [carouselItems, id]);

  return (
    <div className="flex-1 space-y-2">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">{item.title || "Untitled Slide"}</h4>
        <div className="flex gap-2">
          <button onClick={() => setExpanded(!expanded)}>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
          <button onClick={() => removeItem(id, index)}>
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <EditableTextField
              value={item.title || ""}
              onChange={(val) => updateItem(id, index, { title: val })}
              placeholder="Title"
              fieldKey={`items[${index}].title`}
              componentId={id}
            />
            <EditableTextField
              value={item.description || ""}
              onChange={(val) => updateItem(id, index, { description: val })}
              placeholder="Description"
              isTextarea
              rows={3}
              fieldKey={`items[${index}].description`}
              componentId={id}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
