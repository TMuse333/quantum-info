import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Settings,
  MessageSquare,
  Database,
  X,
  Menu,
  GitBranch,
  FileJson,
  Eye,
  HelpCircle,
  Maximize2,
  Minimize2,
  History,
  Search,
  Globe,
  Image,
  Rocket,
  LayoutDashboard
} from "lucide-react";
import {ComponentEditor} from "../componentEditor";
import {WebsiteAssistant} from "../websiteAssistant";
import PageDebugPanel from "../websitePanel/websitePanel";
// import NavbarEditor from "../componentEditor/editTypes/navbarEditor";
import WebsiteMasterPanel from "../masterPanel/masterPanel";
import WebsiteMasterJsonPanel from "../masterPanel/websiteMasterJsonPanel";
import VersionControlPanel from "../versionControl/versionControlPanel";
import GeneralOverviewPanel from "./generalOverviewPanel";
import EditHistoryPanel from "./editHistoryPanel";
import SEOPanel from "./seoPanel";
import WebsiteSummaryPanel from "./websiteSummaryPanel";
import ImagesPanel from "./imagesPanel";
import DeployPanel from "./deployPanel";
import { useHelperBotStore } from "@/stores/helperBotStore";

type PanelType = "editor" | "assistant" | "versions" | "overview" | "editHistory" | "seo" | "summary" | "images" | "deploy" | null;
// Commented out for now: "data" | "master"

const PANEL_INFO = {
  editor: {
    title: "Component Editor",
    icon: Settings,
    description: "Customize and configure your website components with real-time visual editing.",
    color: "blue"
  },
  assistant: {
    title: "AI Assistant",
    icon: MessageSquare,
    description: "Get AI-powered help to build, modify, and optimize your website content.",
    color: "green"
  },
  summary: {
    title: "Website Summary",
    icon: Globe,
    description: "View a comprehensive, easy-to-read overview of your entire website structure and content.",
    color: "rose"
  },
  // data: {
  //   title: "Page Data",
  //   icon: Database,
  //   description: "View and manage the data structure and content of your current page.",
  //   color: "purple"
  // },
  overview: {
    title: "General Overview",
    icon: Eye,
    description: "View and manage your website's overall settings, color theme, and statistics.",
    color: "indigo"
  },
  versions: {
    title: "Version Control",
    icon: GitBranch,
    description: "Manage website versions, track changes, and restore previous states.",
    color: "purple"
  },
  editHistory: {
    title: "Edit History",
    icon: History,
    description: "View all edits made to your website including text, colors, themes, and structural changes.",
    color: "amber"
  },
  seo: {
    title: "SEO Configuration",
    icon: Search,
    description: "Configure SEO metadata for your pages including titles, descriptions, keywords, and Open Graph tags.",
    color: "teal"
  },
  images: {
    title: "Images",
    icon: Image,
    description: "Upload, manage, and organize your website images with Vercel Blob storage.",
    color: "emerald"
  },
  deploy: {
    title: "Deploy",
    icon: Rocket,
    description: "Deploy your website to production with one click. Test with dry-run mode first.",
    color: "purple"
  },
  // master: {
  //   title: "Master JSON",
  //   icon: FileJson,
  //   description: "View and edit the raw JSON configuration of your entire website.",
  //   color: "orange"
  // }
};

export default function UnifiedDashboard() {
  const router = useRouter();
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { setActiveTab, shouldShowTabIntroduction, markTabIntroduced } = useHelperBotStore();

  // Sync active panel with helper bot store for tab introductions
  useEffect(() => {
    if (activePanel === 'editor' || activePanel === 'assistant' || activePanel === 'versions') {
      setActiveTab(activePanel);
    } else {
      setActiveTab(null);
    }
  }, [activePanel, setActiveTab]);

  const togglePanel = (panel: PanelType) => {
    if (activePanel === panel) {
      setActivePanel(null);
      setIsExpanded(false);
    } else {
      setActivePanel(panel);
    }
  };

  const getPanelWidth = () => {
    if (!activePanel) return 0;
    return isExpanded ? "w-[70vw]" : "w-[480px]";
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {!activePanel && (
            <motion.button
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActivePanel("editor")}
              className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all flex items-center justify-center group"
            >
              <Menu className="w-8 h-8 group-hover:rotate-90 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Main Dashboard Panel */}
      <AnimatePresence>
        {activePanel && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePanel(null)}
              className="fixed inset-0 bg-black/20 z-40"
            />

            {/* Dashboard Container */}
            <motion.div
              initial={{ x: 500, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 500, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={`fixed right-0 top-0 h-full ${getPanelWidth()} bg-white shadow-2xl z-50 flex flex-col`}
            >
              {/* Header with Actions */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  {activePanel && PANEL_INFO[activePanel] && (
                    <>
                      {(() => {
                        const Icon = PANEL_INFO[activePanel].icon;
                        return <Icon className="w-6 h-6" />;
                      })()}
                      <div>
                        <h2 className="text-lg font-bold">
                          {PANEL_INFO[activePanel].title}
                        </h2>
                        <p className="text-xs text-white/80">
                          {PANEL_INFO[activePanel].description.split('.')[0]}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowHelp(true)}
                    className="hover:bg-white/20 p-2 rounded-lg transition-all"
                    title="Help"
                  >
                    <HelpCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="hover:bg-white/20 p-2 rounded-lg transition-all"
                    title={isExpanded ? "Normal size" : "Expand"}
                  >
                    {isExpanded ? (
                      <Minimize2 className="w-5 h-5" />
                    ) : (
                      <Maximize2 className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => setActivePanel(null)}
                    className="hover:bg-white/20 p-2 rounded-lg transition-all"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex flex-1 overflow-hidden">
                {/* Content Area - Takes most space */}
                <div className="flex-1 overflow-hidden bg-gray-50">
                  <AnimatePresence mode="wait">
                    {activePanel === "editor" && (
                      <motion.div
                        key="editor"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="h-full overflow-y-auto"
                      >
                        <ComponentEditor />
                      </motion.div>
                    )}
                    {activePanel === "assistant" && (
                      <motion.div
                        key="assistant"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="h-full"
                      >
                        <WebsiteAssistant />
                      </motion.div>
                    )}
                    {activePanel === "versions" && (
                      <motion.div
                        key="versions"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="h-full"
                      >
                        <VersionControlPanel />
                      </motion.div>
                    )}
                    {activePanel === "overview" && (
                      <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="h-full"
                      >
                        <GeneralOverviewPanel />
                      </motion.div>
                    )}
                    {activePanel === "editHistory" && (
                      <motion.div
                        key="editHistory"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="h-full"
                      >
                        <EditHistoryPanel />
                      </motion.div>
                    )}
                    {activePanel === "seo" && (
                      <motion.div
                        key="seo"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="h-full"
                      >
                        <SEOPanel />
                      </motion.div>
                    )}
                    {activePanel === "summary" && (
                      <motion.div
                        key="summary"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="h-full"
                      >
                        <WebsiteSummaryPanel />
                      </motion.div>
                    )}
                    {activePanel === "images" && (
                      <motion.div
                        key="images"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="h-full overflow-y-auto"
                      >
                        <ImagesPanel />
                      </motion.div>
                    )}
                    {activePanel === "deploy" && (
                      <motion.div
                        key="deploy"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="h-full overflow-y-auto bg-gray-900"
                      >
                        <DeployPanel />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Navigation Sidebar - Right side */}
                <div className="w-20 flex flex-col border-l border-gray-200 bg-white shadow-lg">
                  {/* Dashboard Navigation Button */}
                  <motion.button
                    onClick={() => router.push('/dashboard')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center justify-center py-4 px-2 transition-all relative group text-gray-600 hover:bg-blue-50 border-b-2 border-gray-200"
                    title="Dashboard"
                  >
                    <LayoutDashboard className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium text-center leading-tight">
                      Dashboard
                    </span>

                    {/* Tooltip on hover */}
                    <div className="absolute right-full mr-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl z-50">
                      <div className="font-semibold mb-1">Dashboard</div>
                      <div className="text-gray-300 max-w-xs">View deployment history and site analytics</div>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                        <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-4 border-l-gray-900" />
                      </div>
                    </div>
                  </motion.button>

                  <div className="py-3 px-2 border-b border-gray-200 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-500 text-center">
                      TOOLS
                    </p>
                  </div>

                  {Object.entries(PANEL_INFO).map(([key, info]) => {
                    const Icon = info.icon;
                    const isActive = activePanel === key;
                    return (
                      <motion.button
                        key={key}
                        onClick={() => togglePanel(key as PanelType)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex flex-col items-center justify-center py-4 px-2 transition-all relative group ${
                          isActive
                            ? `bg-gradient-to-r from-${info.color}-50 to-${info.color}-100 text-${info.color}-600`
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                        title={info.title}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-${info.color}-500 to-${info.color}-600`}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                        <Icon className={`w-5 h-5 mb-1 ${isActive ? 'animate-pulse' : ''}`} />
                        <span className={`text-[10px] font-medium text-center leading-tight ${
                          isActive ? 'font-bold' : ''
                        }`}>
                          {info.title.split(' ')[0]}
                        </span>
                        
                        {/* Tooltip on hover */}
                        <div className="absolute right-full mr-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl">
                          <div className="font-semibold mb-1">{info.title}</div>
                          <div className="text-gray-300 max-w-xs">{info.description}</div>
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                            <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-4 border-l-gray-900" />
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelp(false)}
              className="fixed inset-0 bg-black/50 z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-[70] max-h-[80vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Dashboard Help</h2>
                    <p className="text-sm text-white/80">Learn how to use the website builder</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="hover:bg-white/20 p-2 rounded-lg transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                <div className="space-y-6">
                  {/* Quick Start */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                      Quick Start
                    </h3>
                    <p className="text-gray-600 mb-3">
                      Click the floating button in the bottom-right corner to open the dashboard. Use the right sidebar to switch between different tools.
                    </p>
                  </div>

                  {/* Tool Descriptions */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                      Available Tools
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(PANEL_INFO).map(([key, info]) => {
                        const Icon = info.icon;
                        return (
                          <div key={key} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className={`w-10 h-10 bg-${info.color}-100 text-${info.color}-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">{info.title}</h4>
                              <p className="text-sm text-gray-600">{info.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tips */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                      Pro Tips
                    </h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>Use the <strong>expand button</strong> (⛶) to maximize the panel for detailed work</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>Hover over tool icons on the right to see detailed descriptions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>Click outside the dashboard or press the X to close it</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>Changes are saved automatically as you work</span>
                      </li>
                    </ul>
                  </div>

                  {/* Keyboard Shortcuts */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">4</span>
                      Keyboard Shortcuts
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Close Panel</span>
                        <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">Esc</kbd>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Help</span>
                        <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">?</kbd>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowHelp(false)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
                  >
                    Got it, thanks!
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
