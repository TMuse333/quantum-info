"use client";

import { useComponentEditor } from "@/context/context";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ColorEditor from "./editTypes/colorEditor";
// import NavbarEditor from "./editTypes/navbarEditor"; // Import NavbarEditor
import { EditableField, EditableComponent } from '@/types/editorial';
import useWebsiteStore from "@/stores/websiteStore";
import { Component } from "lucide-react";
import CarouselEditorPanel from "./editTypes/carousel/carousel";





interface ComponentEditorProps {
  isVisible?: boolean;
}

const ComponentEditor = ({ isVisible = true }: ComponentEditorProps) => {
  const { currentComponent, currentColorEdits, setCurrentColorEdits, setCurrentComponent } = useComponentEditor();
  const [expanded, setExpanded] = useState(true);

  // Show message if not visible
  if (!isVisible) {
    return null;
  }

  // Show message if no component selected
  if (!currentComponent) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center">
        <div className="text-gray-400">
          <div className="text-6xl mb-4">👆</div>
          <h3 className="text-lg font-semibold mb-2">No Component Selected</h3>
          <p className="text-sm">You can select a component by clicking on it!</p>
        </div>
      </div>
    );
  }

  // Check if currentComponent is a navbar
  // const isNavbar = getComponentsByCategory('navbar', componentRegistry).some(
  //   (entry) => entry.componentCategory === currentComponent.category
  // );

  // const isCarousel = getComponentsByCategory('carousel', componentRegistry).some(
  //   (entry) => entry.componentCategory === currentComponent.category
  // );

  // Get color/gradient fields for non-navbar components
  // Safety check: ensure editableFields exists and is an array
  const colorFields = (currentComponent.editableFields && Array.isArray(currentComponent.editableFields) 
    ? currentComponent.editableFields 
    : [])
    .filter((f: EditableField) => f.type === 'color' || f.type === 'gradient')
    .map((f: EditableField) => f.key);


  return (
    <div className="w-full bg-gray-100 rounded-lg shadow-lg text-black overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-gray-300">
        <h3 className="font-bold text-lg">{currentComponent.name} Editor</h3>
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="text-sm px-2 py-1 rounded hover:bg-gray-200"
        >
          {expanded ? "▲" : "▼"}
        </button>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="editor-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 space-y-4  overflow-y-auto"
          >
           {/* {isNavbar && (
            <NavbarEditor/>
           )}
           {isCarousel && (
            <CarouselEditorPanel/>
           )} */}
              
            
           
              <ColorEditor
                colors={currentColorEdits || {}}
                onChange={setCurrentColorEdits}
                availableFields={colorFields}
              />
            
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComponentEditor;
