"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useWebsiteStore from "@/stores/websiteStore";
import { WebsitePage, WebsiteFormAnswer } from '@/types/editorial';

export default function WebsiteMasterPanel({ isVisible = true }: { isVisible?: boolean }) {
  const websiteData = useWebsiteStore((state) => state.websiteData);
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentTab, setCurrentTab] = useState<"overview" | "pages" | "formData">("overview");

  if (!isVisible) return null;

  return (
    <div className="w-full bg-white rounded-lg shadow-2xl border border-gray-300 flex flex-col">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <h3 className="font-bold text-lg">Website Overview</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm px-2 py-1 rounded hover:bg-indigo-700"
        >
          {isExpanded ? "▲" : "▼"}
        </button>
      </div>

      {/* Body */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            {/* Tabs */}
            <div className="flex border-b border-gray-300">
              {["overview", "pages", "formData"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCurrentTab(tab as "overview" | "pages" | "formData")}
                  className={`flex-1 px-4 py-2 font-semibold transition-colors ${
                    currentTab === tab
                      ? "bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {tab === "overview" && "Overview"}
                  {tab === "pages" && `Pages (${websiteData!.pages?.length || 0})`}
                  {tab === "formData" && `Form Data (${Object.keys(websiteData!.formData || {}).length})`}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm max-h-[60vh]">
              {currentTab === "overview" && (
                <div className="space-y-2 text-gray-700">
                  <div>
                    <span className="font-semibold">Template:</span>{" "}
                    <span>{websiteData!.templateName || "None selected"}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Website Name:</span>{" "}
                    <span>{websiteData!.websiteName || "Untitled"}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Status:</span>{" "}
                    <span className="capitalize">{websiteData!.status}</span>
                  </div>
                  {/* <div>
                    <span className="font-semibold">Total Pages:</span>{" "}
                    <span>{websiteData!.pages?.length || 0}</span>
                  </div> */}
                  <div>
                    <span className="font-semibold">Repository:</span>{" "}
                    <span>{websiteData!.repoName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Deployment URL:</span>{" "}
                    <a
                      href={websiteData!.deploymentUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 underline hover:text-indigo-800"
                    >
                      {websiteData!.deploymentUrl || "Not deployed"}
                    </a>
                  </div>
                  <div>
                    <span className="font-semibold">Owner ID:</span>{" "}
                    <span>{websiteData!.ownerId || "Not linked yet"}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-3 border-t pt-2">
                    <div>Created: {new Date(websiteData!.createdAt).toLocaleString()}</div>
                    <div>Updated: {new Date(websiteData!.updatedAt).toLocaleString()}</div>
                  </div>
                </div>
              )}

              {currentTab === "pages" && (
                <>
                  {Object.keys(websiteData!.pages || {}).length === 0 ? (
                    <p className="text-gray-500 italic">No pages added yet.</p>
                  ) : (
                    Object.values(websiteData!.pages).map((page: WebsitePage, index: number) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-bold text-indigo-600 text-base">
                            {page.pageName || `Page ${index + 1}`}
                          </div>
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                            #{index + 1}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Route:</span>
                            <code className="bg-white px-2 py-0.5 rounded border border-gray-200">
                              {page.slug || '/'}
                            </code>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Components:</span>
                            <span>{page.components?.length || 0}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Text Snapshots:</span>
                            <span>{page.text?.length || 0}</span>
                          </div>
                          
                          {/* Component breakdown */}
                          {page.components && page.components.length > 0 && (
                            <details className="mt-2">
                              <summary className="cursor-pointer font-semibold text-gray-700 hover:text-indigo-600">
                                View Components
                              </summary>
                              <ul className="mt-2 ml-4 space-y-1">
                                {page.components.map((comp, compIndex) => (
                                  <li key={compIndex} className="text-xs text-gray-600">
                                    • {comp.type} ({comp.componentCategory || 'unknown'})
                                  </li>
                                ))}
                              </ul>
                            </details>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {currentTab === "formData" && (
                <>
                  {Object.keys(websiteData!.formData || {}).length === 0 ? (
                    <p className="text-gray-500 italic">No form data submitted yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(websiteData!.formData).map(([key, answer]: [string, WebsiteFormAnswer]) => (
                        <div
                          key={key}
                          className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="font-bold text-indigo-600 mb-1 text-sm">
                            {key.split(/(?=[A-Z])/).join(' ')}
                          </div>
                          <p className="text-gray-700 text-sm whitespace-pre-wrap">
                            {answer.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}