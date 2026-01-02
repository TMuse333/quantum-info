"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, FileText, X } from "lucide-react";
import useWebsiteStore from "@/stores/websiteStore";

export function PageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { websiteData } = useWebsiteStore();
  const [isExpanded, setIsExpanded] = useState(true);

  const pages = websiteData?.pages || {};
  const pageArray = Object.values(pages);
  const currentPageSlug = pathname?.replace('/', '') || 'index';

  // If no pages, don't render
  if (pageArray.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-16 right-4 z-50 w-64"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <h3 className="font-semibold text-sm">Pages</h3>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              {pageArray.length}
            </span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover:bg-white/20 p-1 rounded transition-colors"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
                {pageArray.map((page, index) => {
                  const isActive = (page.slug || 'index') === currentPageSlug;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        const slug = page.slug || 'index';
                        router.push(`/${slug}`);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md transition-all flex items-center gap-2 ${
                        isActive
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <FileText className={`w-3 h-3 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                      <span className="text-sm truncate">
                        {page.pageName || page.slug || `Page ${index + 1}`}
                      </span>
                      {isActive && (
                        <span className="ml-auto w-2 h-2 bg-indigo-600 rounded-full"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

