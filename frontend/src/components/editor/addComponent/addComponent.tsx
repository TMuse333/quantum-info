"use client";

import { useState } from "react";

interface ComponentsMap {
  [type: string]: string[];
}

const componentsByType: ComponentsMap = {
  carousels: ["carousel", "slideShowCarousel", "googleReviews",
   "stepsCarousel", "gridCarousel",
"longCarousel"],
  herobanners: ["carouselHero",
   "imageLogoHero",
    "fullBodyHero",
     "threeBoxHero",
    "auroraImageHero",
    "bgImageHero",
       ],
  textComponents: ["featureBoxes", "testimonials", "imageAspects", "textAndList","accordion"],
  contentPieces: [
    "countUpImageText",
    "parallaxText",
    "experienceCard",
    "tiltingContent",
    "imageTextBox",
    "verticalImageTextBox",
    "statsIntro",
    "textBoxPoints"
  ],
  solutionPieces: ["displayBoxes", "priceCards", "fullImageDisplay",],
  textAnimations: ["appearingGradient", "fadeInFromLeftText", "slidingText", "typeAlongText", "typeWriter"],
  footers: ['footer1']
};

const AddComponentButton: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [pageName, setPageName] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({});
  const [isOpen, setIsOpen] = useState(false); // For chatbot-style toggle

  const toggleExpand = (type: string) => {
    setExpandedTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleClick = async () => {
    if (!selectedType || !selectedComponent || !pageName.trim()) {
      setStatus("Please select a type, component, and page.");
      return;
    }

    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/inject-component", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageName: pageName.trim(),
          componentType: selectedType,
          componentName: selectedComponent,
        }),
      });
      const data = await res.json();
      setStatus(data.message ?? "Done.");
    } catch {
      setStatus("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const selectedPath =
    selectedType && selectedComponent
      ? `src/components/${selectedType}/${selectedComponent}/${selectedComponent}.tsx`
      : null;

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      {/* Chatbot-style toggle button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-t-lg shadow-lg"
      >
        {isOpen ? "Close Component Panel" : "Open Component Panel"}
      </button>

      {/* Expandable panel */}
      {isOpen && (
        <div className="bg-gray-900 text-white rounded-b-lg shadow-lg p-4 max-h-[80vh] overflow-y-auto space-y-4">
          <h2 className="text-xl font-bold mb-2">Inject Component Into Page</h2>
          <p className="text-gray-300 mb-2">
            Select a component type and component, then enter the page filename (e.g., homepage.tsx).
          </p>

          <div className="space-y-2">
            {Object.entries(componentsByType).map(([type, components]) => (
              <div key={type} className="bg-gray-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleExpand(type)}
                  className="w-full flex justify-between items-center p-2 font-semibold capitalize bg-gray-700 hover:bg-gray-600"
                >
                  {type}
                  <span>{expandedTypes[type] ? "▲" : "▼"}</span>
                </button>

                {expandedTypes[type] && (
                  <ul className="p-2 space-y-1">
                    {components.map((comp) => {
                      const isSelected = selectedComponent === comp && selectedType === type;
                      return (
                        <li
                          key={comp}
                          onClick={() => {
                            setSelectedType(type);
                            setSelectedComponent(comp);
                          }}
                          className={`cursor-pointer p-1 rounded ${
                            isSelected ? "bg-blue-600 font-bold" : "hover:bg-gray-700"
                          }`}
                        >
                          {comp}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <input
            type="text"
            value={pageName}
            onChange={(e) => setPageName(e.target.value)}
            placeholder="Page Filename (e.g., homepage.tsx)"
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="text-sm text-gray-400 space-y-1">
            <p>
              Selected component:{" "}
              <span className="font-bold">
                {selectedType && selectedComponent ? `${selectedType}/${selectedComponent}` : "None"}
              </span>
            </p>
            <p>
              Page: <span className="font-bold">{pageName || "None"}</span>
            </p>
            {selectedPath && (
              <p className="truncate">
                Import path preview: <span className="font-mono">{selectedPath}</span>
              </p>
            )}
          </div>

          <button
            onClick={handleClick}
            disabled={loading}
            className={`w-full py-2 px-4 bg-blue-600 rounded hover:bg-blue-700 transition-colors ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Injecting..." : "Add Component"}
          </button>

          {status && <p className="mt-2 text-center text-gray-200">{status}</p>}
        </div>
      )}
    </div>
  );
};

export default AddComponentButton;
