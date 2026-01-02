"use client";
import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { useCarouselStore } from "@/stores/carouselStore";
import { AnimatePresence, motion } from "framer-motion";

const MAX_IMAGES = 20;

export default function CarouselImageUploader({ componentId }: { componentId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const addItem = useCarouselStore((s) => s.addItem);

  const [previews, setPreviews] = useState<string[]>([]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    
    // Enforce limit
    if (previews.length + images.length > MAX_IMAGES) {
      alert(`Cannot add ${images.length} images. Maximum limit is ${MAX_IMAGES} images. You currently have ${previews.length} images.`);
      return;
    }

    const urls = images.map((f) => URL.createObjectURL(f));
    setPreviews((p) => [...p, ...urls]);

    images.forEach((f) =>
      addItem(componentId, {
        image: { src: URL.createObjectURL(f), alt: f.name },
        title: f.name,
        description: "",
      })
    );
  };

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 p-6 text-center cursor-pointer hover:border-blue-500 transition"
      >
        <Upload className="mx-auto mb-2" />
        <p>Click or drop images to upload</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <div className="grid grid-cols-4 gap-2">
        <AnimatePresence>
          {previews.map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="relative"
            >
              <img src={src} alt="" className="w-full h-20 object-cover rounded border" />
              <button
                onClick={() =>
                  setPreviews((prev) => prev.filter((_, idx) => idx !== i))
                }
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
              >
                <X size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
