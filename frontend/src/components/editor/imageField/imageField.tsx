"use client";

import React, { useRef, useState } from "react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import useWebsiteStore from "@/stores/websiteStore";
import axios from "axios";
import { useUserAccountStore } from "@/stores/account";
import { ImageSelectionModal } from "./ImageSelectionModal";

interface EditableImageFieldProps {
  value: { src: string; alt: string; styles?: string };
  onChange: (val: { src: string; alt: string; styles?: string }) => void;
  placeholder?: string;
  fieldKey: string;
  componentId: string;
  className?: string; // size, shadow, border, etc.
  rounded?: boolean; // optional: full circle
  style?: React.CSSProperties; 
  objectCover?:boolean
}

const imageVariants: Variants = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

const ImageField: React.FC<EditableImageFieldProps> = ({
  value,
  onChange,
  placeholder,
  fieldKey,
  componentId,
  className,
  rounded = false,
  style,
  objectCover
}) => {
  const [preview, setPreview] = useState<string>(value?.src || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const updateComponentProps = useWebsiteStore((state) => state.updateComponentProps);
  const currentPageSlug = useWebsiteStore((state) => state.currentPageSlug);

  // Get component data from store (source of truth)
  const componentData = useWebsiteStore((state) => {
    if (!state.websiteData?.pages || !state.currentPageSlug) return null;

    const pages = state.websiteData.pages;
    const page = pages[state.currentPageSlug];

    // Find this component by ID
    return page?.components?.find((c) => c.id === componentId);
  });

  const triggerFileInput = () => fileInputRef.current?.click();

  const {user} = useUserAccountStore()

  // Sync preview with store data (runs on mount and when store updates)
  React.useEffect(() => {
    // Priority: Store > Props > Placeholder
    const storeImageSrc = componentData?.props?.[fieldKey] as string;

    if (storeImageSrc) {
      // Store has data - use it (saved from GitHub)
      setPreview(storeImageSrc);
      console.log(`🔄 [imageField] Synced ${fieldKey} from store: ${storeImageSrc}`);
    } else if (value?.src && value.src !== "" && value.src !== placeholder) {
      // Store empty, but props have real data - use props
      setPreview(value.src);
      console.log(`🔄 [imageField] Synced ${fieldKey} from props: ${value.src}`);
    } else {
      // Neither store nor props have real data - show placeholder
      setPreview("");
      console.log(`🔄 [imageField] No image for ${fieldKey} - showing placeholder`);
    }
  }, [componentData, value, fieldKey, placeholder]);

  const uploadToVercelBlob = async (file: File) => {
    console.log(`📤 [imageField] Uploading ${file.name}`);

    const formData = new FormData();
    formData.append("file", file);

    // Use new Vercel Blob upload API (no userId needed - uses USER_EMAIL from env)
    const res = await axios.post("/api/images/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.data?.success) {
      console.log(`✅ [imageField] Uploaded ${file.name}. Current count: ${res.data.currentImageCount}/${res.data.maxImages}`);
      return res.data.url;
    } else {
      const errorMessage = res.data?.error || "Upload failed";
      console.error(`❌ [imageField] Upload failed: ${errorMessage}`);
      // Show user-friendly error message
      if (res.status === 403 && errorMessage.includes("limit")) {
        alert(errorMessage);
      }
      throw new Error(errorMessage);
    }
  };
  


const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const url = await uploadToVercelBlob(file);
    setPreview(url);
    const updated = { ...value, src: url };
    onChange(updated);
    // Update component props in websiteData with correct parameters
    if (currentPageSlug) {
      updateComponentProps(currentPageSlug, componentId, { [fieldKey]: updated });
      console.log(`✅ [imageField] Updated ${fieldKey} in component ${componentId} on page ${currentPageSlug}`);
    }
  } catch (err) {
    console.error("Upload error:", err);
    alert("Failed to upload image.");
  }
};

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      const file = e.dataTransfer.files[0];
      try {
        const url = await uploadToVercelBlob(file);
        setPreview(url);
        const updated = { ...value, src: url };
        onChange(updated);
        // Update component props in websiteData with correct parameters
        if (currentPageSlug) {
          updateComponentProps(currentPageSlug, componentId, { [fieldKey]: updated });
          console.log(`✅ [imageField] Updated ${fieldKey} in component ${componentId} on page ${currentPageSlug}`);
        }
      } catch (err) {
        console.error("Upload error:", err);
        alert("Failed to upload image.");
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const handleSelectFromGallery = (url: string) => {
    setPreview(url);
    const updated = { ...value, src: url };
    onChange(updated);
    // Update component props in websiteData with correct parameters
    if (currentPageSlug) {
      updateComponentProps(currentPageSlug, componentId, { [fieldKey]: updated });
      console.log(`✅ [imageField] Updated ${fieldKey} in component ${componentId} on page ${currentPageSlug}`);
    }
  };

  const handleUploadNew = async (file: File) => {
    const url = await uploadToVercelBlob(file);
    setPreview(url);
    const updated = { ...value, src: url };
    onChange(updated);
    // Update component props in websiteData with correct parameters
    if (currentPageSlug) {
      updateComponentProps(currentPageSlug, componentId, { [fieldKey]: updated });
      console.log(`✅ [imageField] Updated ${fieldKey} in component ${componentId} on page ${currentPageSlug}`);
    }
  };

  const handleImageClick = () => {
    setShowModal(true);
  };

  return (
    <div className="relative flex justify-center items-center">
      <AnimatePresence mode="wait">
        <motion.div
          className={`editable-image-field ${className || ""} flex items-center justify-center overflow-hidden cursor-pointer relative`}
          style={{ borderRadius: rounded ? "9999px" : "0px", position: "relative",
          ...style, }}
          variants={imageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={handleImageClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {preview ? (
            <img
              src={preview}
              alt={value.alt || placeholder || "Image"}
              className={`w-full h-full object-cover ${rounded ? "rounded-full" : ""}
              ${objectCover ? 'object-contain' : 'object-cover'}`}
            />
          ) : (
            <p className="flex items-center justify-center w-full h-full bg-gray-300 text-gray-700">
              {placeholder || "Drag & drop an image, or click to select"}
            </p>
          )}

          {/* Hover tooltip */}
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none"
            >
              <p className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                Click to change image from your preuploaded images or drag and drop
              </p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <input
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <ImageSelectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelectImage={handleSelectFromGallery}
        onUploadNew={handleUploadNew}
        currentImageUrl={preview}
      />
    </div>
  );
};

export default ImageField;
