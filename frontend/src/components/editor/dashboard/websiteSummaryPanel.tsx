"use client";

import React from "react";
import { motion } from "framer-motion";
import useWebsiteStore from "@/stores/websiteStore";
import {
  FileText,
  Layout,
  Image,
  Type,
  Star,
  Globe,
  Calendar,
  CheckCircle2,
  Clock,
  Palette
} from "lucide-react";

interface ComponentCount {
  [key: string]: number;
}

const WebsiteSummaryPanel: React.FC = () => {
  const { websiteData } = useWebsiteStore();

  if (!websiteData) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No website data available</p>
      </div>
    );
  }

  const pages = websiteData.pages || {};
  const pageArray = Array.isArray(pages)
    ? pages
    : Object.entries(pages).map(([key, value]: [string, any]) => ({
        ...value,
        slug: key,
      }));

  // Calculate totals
  const totalPages = pageArray.length;
  const totalComponents = pageArray.reduce((sum, page) => {
    return sum + (page.components?.length || 0);
  }, 0);

  // Get component type counts across all pages
  const getComponentTypeCounts = (): ComponentCount => {
    const counts: ComponentCount = {};
    pageArray.forEach(page => {
      page.components?.forEach((comp: any) => {
        const type = comp.type || "unknown";
        counts[type] = (counts[type] || 0) + 1;
      });
    });
    return counts;
  };

  const componentTypeCounts = getComponentTypeCounts();

  // Format component type names to be more readable
  const formatComponentType = (type: string): string => {
    return type
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'published':
        return 'bg-green-100 text-green-700';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  // Format date
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Globe className="w-7 h-7 text-rose-500" />
          Website Summary
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          A comprehensive overview of your website structure and content
        </p>
      </div>

      {/* Website Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg p-6 border border-rose-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-rose-600" />
          Website Information
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Template Name</p>
            <p className="text-sm font-medium text-gray-900">
              {websiteData.templateName || 'Unnamed Template'}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(websiteData.status || '')}`}>
              {websiteData.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
              {websiteData.status === 'in-progress' && <Clock className="w-3 h-3" />}
              {websiteData.status || 'N/A'}
            </span>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Created</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDate(websiteData.createdAt)}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last Updated</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDate(websiteData.updatedAt)}
            </p>
          </div>
        </div>

        {/* Color Theme Preview */}
        {websiteData.colorTheme && (
          <div className="mt-4 pt-4 border-t border-rose-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Palette className="w-3 h-3" />
              Color Theme
            </p>
            <div className="flex gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded border border-gray-200 shadow-sm"
                  style={{ backgroundColor: websiteData.colorTheme.primary }}
                  title="Primary Color - All variations derived from this"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-700">Primary</span>
                  <span className="text-xs text-gray-500">{websiteData.colorTheme.primary}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded border border-gray-200 shadow-sm"
                  style={{ backgroundColor: websiteData.colorTheme.text }}
                  title="Text Color"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-700">Text</span>
                  <span className="text-xs text-gray-500">{websiteData.colorTheme.text}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded border border-gray-200 shadow-sm"
                  style={{ backgroundColor: websiteData.colorTheme.background }}
                  title="Background Color"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-700">Background</span>
                  <span className="text-xs text-gray-500">{websiteData.colorTheme.background}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-50 rounded-lg p-4 border border-blue-200"
        >
          <FileText className="w-8 h-8 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-blue-900">{totalPages}</p>
          <p className="text-xs text-blue-700">Total Pages</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-purple-50 rounded-lg p-4 border border-purple-200"
        >
          <Layout className="w-8 h-8 text-purple-600 mb-2" />
          <p className="text-2xl font-bold text-purple-900">{totalComponents}</p>
          <p className="text-xs text-purple-700">Total Components</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-green-50 rounded-lg p-4 border border-green-200"
        >
          <Star className="w-8 h-8 text-green-600 mb-2" />
          <p className="text-2xl font-bold text-green-900">
            {Object.keys(componentTypeCounts).length}
          </p>
          <p className="text-xs text-green-700">Component Types</p>
        </motion.div>
      </div>

      {/* Component Types Breakdown */}
      {Object.keys(componentTypeCounts).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg p-6 border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Layout className="w-5 h-5 text-indigo-600" />
            Component Types Used
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(componentTypeCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {formatComponentType(type)}
                  </span>
                  <span className="text-sm font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Pages Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Pages Overview
        </h3>

        {pageArray.map((page, index) => {
          const componentCounts: ComponentCount = {};
          page.components?.forEach((comp: any) => {
            const type = comp.type || "unknown";
            componentCounts[type] = (componentCounts[type] || 0) + 1;
          });

          return (
            <motion.div
              key={page.id || page.slug || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="bg-white rounded-lg p-5 border border-gray-200 hover:border-blue-300 transition-colors"
            >
              {/* Page Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-base font-semibold text-gray-900">
                    {page.name || page.slug || 'Unnamed Page'}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Path: {page.path || `/${page.slug}` || '/'}
                  </p>
                </div>
                <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                  {page.components?.length || 0} components
                </div>
              </div>

              {/* Components List */}
              {page.components && page.components.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Components:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {page.components.map((comp: any, compIndex: number) => (
                      <div
                        key={comp.id || compIndex}
                        className="flex items-center gap-3 p-2 bg-gray-50 rounded border border-gray-200"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">
                          {compIndex + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {formatComponentType(comp.type)}
                          </p>
                          {comp.props?.title && (
                            <p className="text-xs text-gray-500 truncate">
                              {comp.props.title}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded border border-gray-200">
                            {comp.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {(!page.components || page.components.length === 0) && (
                <p className="text-sm text-gray-400 italic">No components on this page</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {pageArray.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No pages found</p>
          <p className="text-sm">Create your first page to get started</p>
        </div>
      )}
    </div>
  );
};

export default WebsiteSummaryPanel;
