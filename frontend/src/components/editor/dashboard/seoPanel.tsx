"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Sparkles, Loader2, Save, Globe, Share2, Settings, CheckCircle2, AlertCircle } from "lucide-react";
import useWebsiteStore from "@/stores/websiteStore";
import { useEditHistoryStore } from "@/stores/editHistoryStore";
import { SEOMetadata } from "@/types/website";

export default function SEOPanel() {
  const websiteData = useWebsiteStore((state) => state.websiteData);
  const setWebsiteData = useWebsiteStore((state) => state.setWebsiteData);
  const currentPageData = useWebsiteStore((state) => state.getPage(state.currentPageSlug));
  const editHistory = useEditHistoryStore();
  
  const [generating, setGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [activeTab, setActiveTab] = useState<'basic' | 'social' | 'advanced'>('basic');
  
  const pageSlug = currentPageData?.slug || 'index';
  const currentSEO = websiteData?.seoMetadata?.[pageSlug];
  
  // Use refs to track initialization and prevent infinite loops
  const lastInitializedPageSlug = useRef<string | null>(null);
  const lastSEOString = useRef<string>("");
  
  const [metadata, setMetadata] = useState<SEOMetadata>({
    title: "",
    description: "",
    keywords: "",
    openGraph: {
      title: "",
      description: "",
      url: "",
      siteName: "",
      type: "website",
      locale: "en_US",
      images: [{
        url: "",
        width: 1200,
        height: 630,
        alt: "",
      }],
    },
    icons: {
      icon: ["/favicon.ico?v=4"],
    },
  });

  // Initialize metadata only when pageSlug changes
  useEffect(() => {
    // Skip if we've already initialized for this page
    if (lastInitializedPageSlug.current === pageSlug) {
      return;
    }

    // Mark this page as initialized
    lastInitializedPageSlug.current = pageSlug;

    if (currentSEO) {
      const seoString = JSON.stringify(currentSEO);
      // Only update if SEO actually changed
      if (seoString !== lastSEOString.current) {
        lastSEOString.current = seoString;
        setMetadata(currentSEO);
      }
    } else if (websiteData) {
      // Try to extract basic info from websiteData
      const websiteInfo = {
        businessName: websiteData.websiteName || websiteData.templateName || "",
        location: (websiteData.formData?.location as any)?.answer || "",
        industry: (websiteData.formData?.industry as any)?.answer || "",
      };
      // Don't auto-generate, just set defaults
      const defaultMetadata: SEOMetadata = {
        title: websiteInfo.businessName || "Website Title",
        description: "",
        keywords: "",
        openGraph: {
          title: websiteInfo.businessName || "",
          description: "",
          url: `https://www.${(websiteInfo.businessName || "example").toLowerCase().replace(/\s+/g, "")}.com`,
          siteName: websiteInfo.businessName || "",
          type: "website",
          locale: "en_US",
          images: [{
            url: "",
            width: 1200,
            height: 630,
            alt: "",
          }],
        },
        icons: {
          icon: ["/favicon.ico?v=4"],
        },
      };
      lastSEOString.current = JSON.stringify(defaultMetadata);
      setMetadata(defaultMetadata);
    }
  }, [pageSlug]); // Only depend on pageSlug to prevent infinite loops

  const generateMetadata = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt describing what SEO metadata you want to generate.");
      return;
    }

    setGenerating(true);
    try {
      // Extract website info for context
      const websiteInfo = websiteData ? {
        businessName: websiteData.websiteName || websiteData.templateName || "",
        location: (websiteData.formData?.location as any)?.answer || "",
        industry: (websiteData.formData?.industry as any)?.answer || "",
        pageName:  pageSlug,
      } : {};

      const response = await fetch("/api/assistant/generate-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          websiteInfo,
          pageSlug,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate SEO metadata");
      }

      const data = await response.json();
      if (data.success) {
        setMetadata(data.metadata);
        lastSEOString.current = JSON.stringify(data.metadata);
        setPrompt(""); // Clear prompt after successful generation
      } else {
        throw new Error(data.error || "Failed to generate metadata");
      }
    } catch (error: any) {
      console.error("Error generating SEO metadata:", error);
      alert(`Failed to generate SEO metadata: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const saveMetadata = () => {
    if (!websiteData) {
      console.error("Cannot save: websiteData is null");
      return;
    }

    // Update websiteData with SEO metadata
    if (websiteData) {
      const updatedSEO = {
        ...(websiteData.seoMetadata || {}),
        [pageSlug]: metadata,
      };

      setWebsiteData({
        ...websiteData,
        seoMetadata: updatedSEO,
        updatedAt: new Date(),
      });
    }

    // Track the edit
    editHistory.addEdit({
      type: 'manual',
      pageSlug: pageSlug,
      changes: {
        props: {
          seoMetadata: {
            old: currentSEO || null,
            new: metadata,
          },
        },
      },
      metadata: {
        source: 'manual',
        editMode: 'single',
      },
    });

    // Update the ref to prevent re-initialization
    lastSEOString.current = JSON.stringify(metadata);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const updateField = (path: string, value: string | number) => {
    const keys = path.split(".");
    const newMetadata: SEOMetadata = structuredClone(metadata);
    let current: any = newMetadata;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (/^\d+$/.test(key)) {
        current = current[parseInt(key)];
      } else {
        current = current[key];
      }
    }
    const lastKey = keys[keys.length - 1];
    if (/^\d+$/.test(lastKey)) {
      current[parseInt(lastKey)] = value;
    } else {
      current[lastKey] = value;
    }
    setMetadata(newMetadata);
  };

  const CharCounter = ({ current, max, warning = 0 }: { current: number; max: number; warning?: number }) => {
    const isWarning = warning > 0 && current > warning;
    const isError = current > max;
    return (
      <span className={`text-xs font-medium ${isError ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-gray-400'}`}>
        {current}/{max}
      </span>
    );
  };

  const InputField = ({ 
    label, 
    value, 
    onChange, 
    placeholder, 
    maxLength, 
    helpText,
    charCount = false,
    warningAt = 0,
    type = "text"
  }: any) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {charCount && <CharCounter current={value.length} max={maxLength} warning={warningAt} />}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
      />
      {helpText && <p className="text-xs text-gray-500">{helpText}</p>}
    </div>
  );

  const TextAreaField = ({ 
    label, 
    value, 
    onChange, 
    placeholder, 
    maxLength, 
    helpText,
    charCount = false,
    warningAt = 0,
    rows = 3
  }: any) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {charCount && <CharCounter current={value.length} max={maxLength} warning={warningAt} />}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none"
      />
      {helpText && <p className="text-xs text-gray-500">{helpText}</p>}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        
        {/* Header with Save Button */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">SEO Settings</h1>
              <p className="text-sm text-gray-500">
                Editing: <span className="font-medium text-gray-700">{ pageSlug}</span>
              </p>
            </div>
            <button
              onClick={saveMetadata}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">SEO metadata saved successfully!</span>
            </div>
          )}

          {/* AI Generation */}
          <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-5 border border-indigo-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">AI-Powered SEO Generation</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Describe your business or page, and AI will generate optimized SEO content.
                </p>
                <div className="flex gap-2 flex-col">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., 'Create SEO for a web design business in Halifax'"
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        generateMetadata();
                      }
                    }}
                  />
                  <button
                    onClick={generateMetadata}
                    disabled={generating || !prompt.trim()}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium shadow-sm"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('basic')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'basic'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Search className="w-4 h-4" />
              Basic SEO
            </button>
            <button
              onClick={() => setActiveTab('social')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'social'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Share2 className="w-4 h-4" />
              Social Media
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'advanced'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Settings className="w-4 h-4" />
              Advanced
            </button>
          </div>

          <div className="p-6">
            {/* Basic SEO Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">SEO Best Practices</p>
                    <p className="text-blue-700">Keep titles under 60 characters and descriptions under 160 characters for optimal search results display.</p>
                  </div>
                </div>

                <InputField
                  label="Page Title"
                  value={metadata.title}
                  onChange={(val: string) => updateField("title", val)}
                  placeholder="Your Business Name | Main Keyword"
                  maxLength={70}
                  charCount
                  warningAt={60}
                  helpText="This appears as the main title in search results and browser tabs"
                />

                <TextAreaField
                  label="Meta Description"
                  value={metadata.description}
                  onChange={(val: string) => updateField("description", val)}
                  placeholder="Compelling description that encourages clicks from search results..."
                  maxLength={170}
                  rows={4}
                  charCount
                  warningAt={160}
                  helpText="This appears below the title in search results - make it compelling!"
                />

                <InputField
                  label="Keywords"
                  value={metadata.keywords}
                  onChange={(val: string) => updateField("keywords", val)}
                  placeholder="web design, halifax, business website, digital marketing"
                  helpText="5-10 relevant keywords separated by commas"
                />
              </div>
            )}

            {/* Social Media Tab */}
            {activeTab === 'social' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <Share2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-purple-900">
                    <p className="font-medium mb-1">Open Graph Settings</p>
                    <p className="text-purple-700">Control how your page appears when shared on Facebook, Twitter, LinkedIn, and other social platforms.</p>
                  </div>
                </div>

                <InputField
                  label="Social Title"
                  value={metadata.openGraph.title}
                  onChange={(val: string) => updateField("openGraph.title", val)}
                  placeholder="Your Business Name | Main Keyword"
                  helpText="Title shown when shared on social media"
                />

                <TextAreaField
                  label="Social Description"
                  value={metadata.openGraph.description}
                  onChange={(val: string) => updateField("openGraph.description", val)}
                  placeholder="Engaging description for social media shares..."
                  rows={3}
                  helpText="Description shown when shared on social media"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Website URL"
                    value={metadata.openGraph.url}
                    onChange={(val: string) => updateField("openGraph.url", val)}
                    placeholder="https://www.yourbusiness.com"
                    type="url"
                  />

                  <InputField
                    label="Site Name"
                    value={metadata.openGraph.siteName}
                    onChange={(val: string) => updateField("openGraph.siteName", val)}
                    placeholder="Your Business Name"
                  />
                </div>

                <div className="space-y-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="font-medium text-gray-900 text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Social Image
                  </h4>
                  
                  <InputField
                    label="Image URL"
                    value={metadata.openGraph.images?.[0]?.url || ""}
                    onChange={(val: string) => updateField("openGraph.images.0.url", val)}
                    placeholder="https://example.com/social-image.png"
                    type="url"
                    helpText="Recommended size: 1200x630px"
                  />

                  <InputField
                    label="Image Alt Text"
                    value={metadata.openGraph.images?.[0]?.alt || ""}
                    onChange={(val: string) => updateField("openGraph.images.0.alt", val)}
                    placeholder="Description of the social image"
                  />
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Locale</label>
                    <select
                      value={metadata.openGraph.locale}
                      onChange={(e) => updateField("openGraph.locale", e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    >
                      <option value="en_US">English (US)</option>
                      <option value="en_CA">English (Canada)</option>
                      <option value="en_GB">English (UK)</option>
                      <option value="es_ES">Spanish (Spain)</option>
                      <option value="fr_FR">French (France)</option>
                      <option value="de_DE">German</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Content Type</label>
                    <select
                      value={metadata.openGraph.type}
                      onChange={(e) => updateField("openGraph.type", e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    >
                      <option value="website">Website</option>
                      <option value="article">Article</option>
                      <option value="product">Product</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="font-medium text-gray-900 text-sm">Favicon</h4>
                  <InputField
                    label="Favicon Path"
                    value={metadata.icons.icon[0] || ""}
                    onChange={(val: string) => {
                      const newMetadata = structuredClone(metadata);
                      newMetadata.icons.icon = [val];
                      setMetadata(newMetadata);
                    }}
                    placeholder="/favicon.ico?v=4"
                    helpText="Path to your favicon file (usually in /public folder)"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}