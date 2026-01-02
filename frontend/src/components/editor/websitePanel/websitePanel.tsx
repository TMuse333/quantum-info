// COMMENTED OUT - Component not currently being rendered
// This file is imported but not used in the dashboard

/*
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useWebsiteStore from "@/stores/websiteStore";
import { BaseArrayItem, StandardText, TestimonialText } from '@/types/editorial';
import { useComponentEditor } from "@/context";

interface PageDebugPanelProps {
  isVisible?: boolean;
}

function StandardTextComponent({ title, description }: StandardText) {
  return (
    <div className="border border-green-700/40 bg-green-950/40 p-2 rounded mb-2">
      <p className="font-semibold text-green-300 text-xs">StandardText</p>
      <p className="text-green-100 text-[11px]">{title}</p>
      <p className="text-green-400 text-[10px]">{description}</p>
    </div>
  );
}

function TestimonialComponent({ name, quote, role }: TestimonialText) {
  return (
    <div className="border border-blue-700/40 bg-blue-950/40 p-2 rounded mb-2">
      <p className="font-semibold text-blue-300 text-xs">Testimonial</p>
      <p className="text-blue-100 text-[11px] italic">"{quote}"</p>
      <p className="text-blue-400 text-[10px] mt-1">
        – {name}
        {role ? `, ${role}` : ""}
      </p>
    </div>
  );
}

export default function PageDebugPanel({ isVisible = true }: PageDebugPanelProps) {
  // const currentPageData = useWebsiteStore((state) => state.currentPageData);
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentTab, setCurrentTab] = useState<"components" | "text">("components");
  const { editorMode, setEditorMode } = useComponentEditor();
  // const { moveComponentUp, moveComponentDown } = useWebsiteStore();
  // const resetToOriginalOrder = useWebsiteStore((state) => state.resetToOriginalOrder);


  useEffect(() => {
    console.log("current page data", currentPageData);
  }, [currentPageData]);

  if (!currentPageData || !currentPageData.components || !isVisible) {
    return (
      <>
      </>
      // <div className="p-4 bg-gray-800 text-white rounded-lg shadow-lg">
      //   No Page Loaded
      // </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-2xl border border-gray-300 flex flex-col">
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <h3 className="font-bold text-lg">Page Debug</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setEditorMode(!editorMode)}
            className="text-sm px-2 py-1 rounded hover:bg-blue-700"
          >
            {editorMode ? "View production mode" : "Editor mode"}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm px-2 py-1 rounded hover:bg-blue-700"
          >
            {isExpanded ? "▲" : "▼"}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex border-b border-gray-300">
              <button
                onClick={() => setCurrentTab("components")}
                className={`flex-1 px-4 py-2 font-semibold transition-colors ${
                  currentTab === "components"
                    ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Components ({currentPageData.components.length})
              </button>
              <button
                onClick={() => setCurrentTab("text")}
                className={`flex-1 px-4 py-2 font-semibold transition-colors ${
                  currentTab === "text"
                    ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Text Data ({currentPageData.text.length})
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm max-h-[60vh]">
            <button
  onClick={resetToOriginalOrder}
  className="px-3 py-2 bg-gray-200 text-sm rounded hover:bg-gray-300"
>
  Reset Order
</button>
<button
  onClick={()=>setEditorMode(!editorMode)}
  className="px-3 ml-4 py-2 bg-gray-200 text-sm rounded hover:bg-gray-300"
>
  Editor mode
</button>

            {currentTab === "components" &&
  currentPageData.components.map((comp, index) => (
    <div
      key={comp.id}
      className="bg-gray-50 rounded-lg p-3 border border-gray-200"
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-blue-600">#{index + 1}</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            {comp.type}
          </span>
        </div>
        <div className="flex gap-2">
          <button
           onClick={() => moveComponentUp(comp.id)}
            disabled={index === 0}
            className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            ↑
          </button>
          <button
           onClick={() => moveComponentDown(comp.id)}
            disabled={index === currentPageData.components.length - 1}
            className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            ↓
          </button>
        </div>
      </div>
      <div className="space-y-1 text-xs text-gray-700">
        <div>
          <span className="font-semibold">ID:</span>{" "}
          <span className="font-mono text-[10px]">{comp.id}</span>
        </div>
        {comp.context && (
          <div>
            <span className="font-semibold">Context:</span>{" "}
            <span className="text-gray-600">{comp.context}</span>
          </div>
        )}
        <details className="mt-2">
          <summary className="cursor-pointer font-semibold text-gray-800 hover:text-blue-600">
            Props
          </summary>
          <pre className="mt-1 bg-gray-900 text-green-400 p-2 rounded text-[10px] overflow-x-auto">
            {JSON.stringify(comp.props, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  ))}

              {currentTab === "text" &&
                currentPageData.text.map((textSnapshot, index) => {
                  const text = textSnapshot.text;
                  return (
                    <div
                      key={textSnapshot.componentId}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-green-600">#{index + 1}</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          {textSnapshot.componentType}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-gray-700">
                        <div>
                          <span className="font-semibold">ID:</span>{" "}
                          <span className="font-mono text-[10px]">
                            {textSnapshot.componentId}
                          </span>
                        </div>
                        {text.title && (
                          <div>
                            <span className="font-semibold">Title:</span>{" "}
                            <span className="text-gray-800">{text.title}</span>
                          </div>
                        )}
                        {text.subTitle && (
                          <div>
                            <span className="font-semibold">Subtitle:</span>{" "}
                            <span className="text-gray-800">{text.subTitle}</span>
                          </div>
                        )}
                        {text.description && (
                          <div>
                            <span className="font-semibold">Description:</span>{" "}
                            <span className="text-gray-600 line-clamp-2">
                              {text.description}
                            </span>
                          </div>
                        )}
                        {text.buttonText && (
                          <div>
                            <span className="font-semibold">Button:</span>{" "}
                            <span className="text-gray-800">{text.buttonText}</span>
                          </div>
                        )}
                        {Array.isArray(text.array) && text.array.length > 0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer font-semibold text-gray-800 hover:text-green-600">
                              Array ({text.array.length} items)
                            </summary>
                            <div className="mt-1 rounded text-[10px] overflow-x-auto">
                              {text.array.map((item: BaseArrayItem, i: number) => {
                                if (item.type === "StandardText") {
                                  return <StandardTextComponent key={i} {...item} />;
                                }
                                if (item.type === "Testimonial") {
                                  return <TestimonialComponent key={i} {...item} />;
                                }
                                return null;
                              })}
                            </div>
                          </details>
                        )}
                        <details className="mt-2">
                          <summary className="cursor-pointer font-semibold text-gray-800 hover:text-green-600">
                            Full Text Object
                          </summary>
                          <pre className="mt-1 bg-gray-900 text-green-400 p-2 rounded text-[10px] overflow-x-auto">
                            {JSON.stringify(text, null, 2)}
                          </pre>
                        </details>
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="bg-gray-50 p-3 rounded-b-lg border-t border-gray-300 text-xs text-gray-600">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
*/

// Minimal export to prevent import errors
export default function PageDebugPanel() {
  return null;
}
