"use client";

import { useState } from "react";
import useWebsiteStore from "@/stores/websiteStore";
import { Copy, Check, Download } from "lucide-react";
import type { WebsiteMaster, WebsitePage   } from '@/types/editorial';

export default function WebsiteMasterJsonPanel() {
  const websiteData = useWebsiteStore((state) => state.websiteData);
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<"websiteJson" | "fullMaster">("websiteJson");

  const handleCopy = async () => {
    try {
      const jsonString = JSON.stringify(websiteData, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleDownload = () => {
    const jsonString = JSON.stringify(websiteData!, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `website-master-${websiteData!.websiteName || websiteData!.templateName || 'website'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Extract website.json structure (pages and formData - the actual website content)
  const websiteJson = {
    formData: websiteData!.formData || {},
    pages: websiteData!.pages || [] as WebsitePage[],
  };

  const fullWebsiteMaster = websiteData!;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">Website Master JSON</h3>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Copy JSON"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Download JSON"
            >
              <Download className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-600">
          View the complete WebsiteMaster object structure
        </p>
      </div>

      {/* Tabs for website.json vs full WebsiteMaster */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveView("websiteJson")}
          className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
            activeView === 'websiteJson'
              ? 'bg-white text-[#0099cc] border-b-2 border-[#0099cc]'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          website.json
        </button>
        <button
          onClick={() => setActiveView("fullMaster")}
          className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
            activeView === 'fullMaster'
              ? 'bg-white text-[#0099cc] border-b-2 border-[#0099cc]'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Full WebsiteMaster
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeView === 'websiteJson' ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-800">
                <strong>website.json</strong> - This is the structure that represents the actual website content (pages and formData). 
                This is what gets synced with the GitHub repo.
              </p>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono">
              {JSON.stringify(websiteJson, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-purple-800">
                <strong>Full WebsiteMaster</strong> - Complete object including metadata, payment info, versions, etc.
              </p>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono">
              {JSON.stringify(fullWebsiteMaster, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

