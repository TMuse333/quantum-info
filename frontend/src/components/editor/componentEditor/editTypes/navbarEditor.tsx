// import { useState, useEffect, useMemo } from "react";
// import { NavItem, NavItemType, NavbarProps } from "@/types/navbar";
// import useWebsiteStore from "@/stores/websiteStore";
// import { Plus, X, ChevronDown, Edit2 } from "lucide-react";
// // import { LandingNavbar } from "@/components/designs/navbars/navbar1";

// export default function NavbarEditorPanel() {
//   // const currentPageData = useWebsiteStore((s) => s.currentPageData);
//   // const updateNavbarProps = useWebsiteStore((s) => s.updateNavbarProps);

//   // ────── ALL HOOKS AT THE TOP (unconditional) ──────
//   const [editingIndex, setEditingIndex] = useState<number | null>(null);
//   const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
//   const [editedTab, setEditedTab] = useState<NavItem | null>(null);

//   // ────── Find navbar component ──────
//   // const navbarComponent = useMemo(
//   //   () => currentPageData?.components?.find((c) => c.componentCategory === "navbar"),
//   //   [currentPageData]
//   // );

//   const navbarProps = navbarComponent?.props as NavbarProps | undefined;
//   const tabs = useMemo(() => navbarProps?.tabs ?? [], [navbarProps?.tabs]);

//   // ────── useEffect: Reset editedTab when editingIndex changes ──────
//   useEffect(() => {
//     if (editingIndex === null) {
//       setEditedTab(null);
//     } else if (tabs[editingIndex]) {
//       setEditedTab({ ...tabs[editingIndex] });
//     }
//   }, [editingIndex, tabs]);

//   // ────── Early return: AFTER all hooks ──────
//   if (!navbarComponent || !navbarProps) {
//     return (
//       <div className="h-full flex items-center justify-center p-8 text-center">
//         <div className="text-gray-400">
//           <div className="text-6xl mb-4">🧭</div>
//           <h3 className="text-lg font-semibold mb-2">No Navbar Found</h3>
//           <p className="text-sm">Add a navbar component to edit navigation</p>
//         </div>
//       </div>
//     );
//   }

//   // ────── Handlers ──────
//   const handleUpdateTabs = (newTabs: NavItem[]) => {
//     updateNavbarProps(navbarComponent.id, { tabs: newTabs });
//   };

//   const handleAddTab = () => {
//     const newTab: NavItem = { type: "link", label: "New Item", href: "#" };
//     handleUpdateTabs([...tabs, newTab]);
//   };

//   const handleRemoveTab = (idx: number) => {
//     handleUpdateTabs(tabs.filter((_, i) => i !== idx));
//   };

//   const handleSaveTab = () => {
//     if (editingIndex === null || !editedTab) return;
//     const newTabs = [...tabs];
//     newTabs[editingIndex] = editedTab;
//     handleUpdateTabs(newTabs);
//     setEditingIndex(null);
//   };

//   const handleAddSubmenuItem = (parentIdx: number) => {
//     const newTabs = [...tabs];
//     if (newTabs[parentIdx].type === "submenu") {
//       newTabs[parentIdx].children = [
//         ...(newTabs[parentIdx].children ?? []),
//         { type: "link", label: "Submenu Item", href: "#" },
//       ];
//       handleUpdateTabs(newTabs);
//     }
//   };

//   const handleRemoveSubmenuItem = (parentIdx: number, subIdx: number) => {
//     const newTabs = [...tabs];
//     if (newTabs[parentIdx].type === "submenu" && newTabs[parentIdx].children) {
//       newTabs[parentIdx].children = newTabs[parentIdx].children!.filter(
//         (_, i) => i !== subIdx
//       );
//       handleUpdateTabs(newTabs);
//     }
//   };

//   // ────── Render ──────
//   return (
//     <div className="h-full flex flex-col space-y-4">
//       {/* Preview */}
//       <div className="border-2 border-gray-200 rounded-lg overflow-hidden max-h-32">
//         {/* <LandingNavbar {...navbarProps} tabs={tabs} /> */}
//       </div>

//       {/* Editor */}
//       <div className="flex-1 flex flex-col p-4 space-y-4 bg-gray-50 rounded-lg">
//         <div>
//           <h3 className="font-semibold text-gray-800 mb-1">Navigation Items</h3>
//           <p className="text-xs text-gray-600">Add, remove, or modify navbar items</p>
//         </div>

//         <div className="flex-1 overflow-y-auto space-y-2">
//           {tabs.length === 0 ? (
//             <div className="text-center py-8 text-gray-500 text-sm">
//               <p>No navigation items yet</p>
//             </div>
//           ) : (
//             tabs.map((tab, idx) => (
//               <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
//                 {/* Header */}
//                 <div className="p-3 flex items-center gap-2 hover:bg-gray-50 transition">
//                   <div className="flex-1">
//                     <div className="flex items-center gap-2">
//                       <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
//                         {tab.type}
//                       </span>
//                       <span className="font-medium text-gray-800">{tab.label}</span>
//                     </div>
//                     {tab.type === "scroll" && (
//                       <p className="text-xs text-gray-500 mt-1">Target: {tab.scrollTo}</p>
//                     )}
//                     {(tab.type === "link" || tab.type === "external") && (
//                       <p className="text-xs text-gray-500 mt-1">{tab.href}</p>
//                     )}
//                   </div>

//                   <div className="flex gap-1">
//                     <button
//                       onClick={() => setEditingIndex(editingIndex === idx ? null : idx)}
//                       className="p-1 hover:bg-gray-200 rounded transition"
//                     >
//                       <Edit2 className="w-4 h-4 text-gray-600" />
//                     </button>
//                     <button
//                       onClick={() => handleRemoveTab(idx)}
//                       className="p-1 hover:bg-red-100 rounded transition"
//                     >
//                       <X className="w-4 h-4 text-red-600" />
//                     </button>
//                     {tab.type === "submenu" && (
//                       <button
//                         onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
//                         className="p-1 hover:bg-gray-200 rounded transition"
//                       >
//                         <ChevronDown
//                           className={`w-4 h-4 text-gray-600 transition-transform ${
//                             expandedIndex === idx ? "rotate-180" : ""
//                           }`}
//                         />
//                       </button>
//                     )}
//                   </div>
//                 </div>

//                 {/* Edit Form */}
//                 {editingIndex === idx && editedTab && (
//                   <TabEditForm
//                     edited={editedTab}
//                     setEdited={setEditedTab as React.Dispatch<React.SetStateAction<NavItem>>}
//                     onSave={handleSaveTab}
//                     onCancel={() => setEditingIndex(null)}
//                   />
//                 )}

//                 {/* Submenu */}
//                 {tab.type === "submenu" && expandedIndex === idx && (
//                   <div className="bg-gray-50 border-t border-gray-200 p-3 space-y-2">
//                     {(tab.children ?? []).map((sub, subIdx) => (
//                       <div
//                         key={subIdx}
//                         className="bg-white rounded border border-gray-200 p-2 flex items-center gap-2"
//                       >
//                         <div className="flex-1">
//                           <div className="flex items-center gap-2">
//                             <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
//                               {sub.type}
//                             </span>
//                             <span className="text-sm font-medium text-gray-800">{sub.label}</span>
//                           </div>
//                         </div>
//                         <button
//                           onClick={() => handleRemoveSubmenuItem(idx, subIdx)}
//                           className="p-1 hover:bg-red-100 rounded transition"
//                         >
//                           <X className="w-3 h-3 text-red-600" />
//                         </button>
//                       </div>
//                     ))}
//                     <button
//                       onClick={() => handleAddSubmenuItem(idx)}
//                       className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2 px-3 rounded hover:bg-blue-50 transition"
//                     >
//                       + Add Submenu Item
//                     </button>
//                   </div>
//                 )}
//               </div>
//             ))
//           )}
//         </div>

//         {/* Add Button */}
//         <button
//           onClick={handleAddTab}
//           className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
//         >
//           <Plus className="w-4 h-4" />
//           Add Navigation Item
//         </button>
//       </div>
//     </div>
//   );
// }

// /* --------------------------------------------------------------
//    TabEditForm – no hooks, pure controlled component
//    -------------------------------------------------------------- */
// type TabEditFormProps = {
//   edited: NavItem;
//   setEdited: React.Dispatch<React.SetStateAction<NavItem>>;
//   onSave: () => void;
//   onCancel: () => void;
// };

// function TabEditForm({ edited, setEdited, onSave, onCancel }: TabEditFormProps) {
//   return (
//     <div className="bg-gray-50 border-t border-gray-200 p-3 space-y-2">
//       <input
//         type="text"
//         value={edited.label}
//         onChange={(e) => setEdited((prev) => ({ ...prev, label: e.target.value }))}
//         placeholder="Label"
//         className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//       />

//       <select
//         value={edited.type}
//         onChange={(e) => {
//           const newType = e.target.value as NavItemType;
//           setEdited((prev) => ({ ...prev, type: newType }));
//         }}
//         className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//       >
//         <option value="link">Link</option>
//         <option value="scroll">Scroll</option>
//         <option value="external">External</option>
//         <option value="submenu">Submenu</option>
//       </select>

//       {edited.type === "scroll" && (
//         <input
//           type="text"
//           value={edited.scrollTo ?? ""}
//           onChange={(e) => setEdited((prev) => ({ ...prev, scrollTo: e.target.value }))}
//           placeholder="#section-id"
//           className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//         />
//       )}

//       {(edited.type === "link" || edited.type === "external") && (
//         <>
//           <input
//             type="text"
//             value={edited.href ?? ""}
//             onChange={(e) => setEdited((prev) => ({ ...prev, href: e.target.value }))}
//             placeholder={edited.type === "external" ? "https://..." : "/path"}
//             className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//           {edited.type === "external" && (
//             <label className="flex items-center gap-2 text-sm">
//               <input
//                 type="checkbox"
//                 checked={edited.target === "_blank"}
//                 onChange={(e) =>
//                   setEdited((prev) => ({
//                     ...prev,
//                     target: e.target.checked ? "_blank" : undefined,
//                   }))
//                 }
//               />
//               Open in new tab
//             </label>
//           )}
//         </>
//       )}

//       <div className="flex gap-2 pt-2">
//         <button
//           onClick={onSave}
//           className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition font-medium"
//         >
//           Save
//         </button>
//         <button
//           onClick={onCancel}
//           className="flex-1 px-3 py-2 bg-gray-400 text-white rounded text-sm hover:bg-gray-500 transition font-medium"
//         >
//           Cancel
//         </button>
//       </div>
//     </div>
//   );
// }


export const NavbarEditor = () => {
  return (
    <div>
      <h1>Navbar Editor</h1>
    </div>
  );
}