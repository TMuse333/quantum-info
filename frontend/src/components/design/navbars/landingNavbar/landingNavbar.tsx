"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Sparkles, Globe, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { NavbarProps, NavItem, NavItemType } from "@/types";
import { deriveColorPalette, useAnimatedGradient } from "@/lib/colorUtils";

export interface LandingNavbarProps extends NavbarProps {

}


const LandingNavbar: React.FC<LandingNavbarProps> = ({
  logoSrc,
  logoAlt = "Logo",
  logoText,
  tabs,
  sticky = false,
  alignment = "right",
  ctaDestination = "#",
  buttonText,
  textColor,
  baseBgColor,
  mainColor,

  bgLayout,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);

  const colors = deriveColorPalette({ textColor, baseBgColor, mainColor, bgLayout });
  const backgroundImage = useAnimatedGradient(bgLayout, colors);

  const renderNavItem = (item: NavItem, index: number, isMobile = false) => {
    const key = `${item.label}-${index}`;
    const isSubmenu = item.type === "submenu";
    const isOpen = openSubmenu === index;

    const handleClick = () => {
      if (isSubmenu) {
        setOpenSubmenu(isOpen ? null : index);
      } else if (item.type === "scroll" && item.scrollTo) {
        const element = document.querySelector(item.scrollTo);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
          setIsMobileMenuOpen(false);
        }
      } else {
        setIsMobileMenuOpen(false);
      }
    };

    return (
      <div key={key} className={isMobile ? "block relative" : "relative"}>
        {isSubmenu ? (
          <div className="group">
            <button
              className={`flex items-center space-x-1 ${isMobile ? "w-full text-left px-3 py-2" : "px-3 py-2"} hover:bg-gray-50 rounded-lg font-medium transition-colors`}
              style={{ color: colors.textColor }}
              onClick={handleClick}
            >
              <span>{item.label}</span>
              <ChevronDown className={`h-4 w-4 transform ${isOpen ? "rotate-180" : ""} transition-transform`} />
            </button>
            <AnimatePresence>
              {isOpen && item.children && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`${isMobile ? "ml-4 space-y-2" : "absolute top-full left-0 bg-white shadow-lg rounded-lg p-2 min-w-[150px]"}`}
                >
                  {item.children.map((subItem, subIndex) => (
                    <div key={`${subItem.label}-${subIndex}`}>
                      {subItem.type === "scroll" ? (
                        <button
                          onClick={() => {
                            if (subItem.scrollTo) {
                              const element = document.querySelector(subItem.scrollTo);
                              if (element) {
                                element.scrollIntoView({ behavior: "smooth" });
                                setIsMobileMenuOpen(false);
                              }
                            }
                          }}
                          className={`${isMobile ? "block w-full text-left px-3 py-2" : "block px-3 py-2"} hover:bg-gray-50 rounded-lg font-medium transition-colors`}
                          style={{ color: colors.textColor }}
                        >
                          {subItem.label}
                        </button>
                      ) : (
                        <Link
                          href={subItem.href || "#"}
                          target={subItem.target}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`${isMobile ? "block w-full text-left px-3 py-2" : "block px-3 py-2"} hover:bg-gray-50 rounded-lg font-medium transition-colors`}
                          style={{ color: colors.textColor }}
                        >
                          {subItem.label}
                        </Link>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : item.type === "scroll" ? (
          <button
            className={`${isMobile ? "block w-full text-left px-3 py-2" : "px-3 py-2"} hover:bg-gray-50 rounded-lg font-medium transition-colors`}
            style={{ color: colors.textColor }}
            onClick={handleClick}
          >
            {item.label}
          </button>
        ) : (
          <Link
            href={item.href || "#"}
            target={item.target}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`${isMobile ? "block w-full text-left px-3 py-2" : "px-3 py-2"} hover:bg-gray-50 rounded-lg font-medium transition-colors`}
            style={{ color: colors.textColor }}
          >
            {item.label}
          </Link>
        )}
      </div>
    );
  };

  return (
    <motion.nav
      style={{
        backgroundColor: `${colors.baseBgColor}/90`,
        color: colors.textColor,
        backgroundImage,
        // position: sticky ? "fixed" : "relative",
        // top: 0,
        // zIndex: 50,
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full border-b border-gray-200 backdrop-blur-md shadow-sm"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg shadow-md group-hover:shadow-lg transition-all overflow-hidden"
              style={{ background: `linear-gradient(to bottom right, ${colors.mainColor}, ${colors.accentColor})` }}
            >
              {logoSrc ? (
                <Image
                  src={logoSrc}
                  alt={logoAlt}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Globe className="h-6 w-6 text-white" />
              )}
            </div>
            {logoText && (
              <span className="text-xl font-bold" style={{ color: colors.textColor }}>{logoText}</span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div
            className={`hidden md:flex items-center space-x-8 ${
              alignment === "left"
                ? "justify-start"
                : alignment === "center"
                ? "justify-center flex-1"
                : "justify-end"
            }`}
          >
            {tabs.map((tab, index) => renderNavItem(tab, index))}
          </div>

          {/* CTA Button - Desktop */}
          {buttonText && (
            <div className="hidden md:block">
              <Link
                href={ctaDestination}
                className="group relative px-6 py-2.5 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all hover:scale-105 inline-block"
                style={{
                  background: `linear-gradient(to right, ${colors.mainColor}, ${colors.accentColor})`,
                  color: "#ffffff",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  <span>{buttonText}</span>
                </span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg transition-colors hover:bg-gray-100"
            style={{ color: colors.textColor }}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-gray-200 py-4 space-y-3"
            >
              {tabs.map((tab, index) => renderNavItem(tab, index, true))}
              {buttonText && (
                <Link
                  href={ctaDestination}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block mt-4"
                >
                  <div
                    className="relative px-6 py-2.5 rounded-lg text-center shadow-lg overflow-hidden"
                    style={{
                      background: `linear-gradient(to right, ${colors.mainColor}, ${colors.accentColor})`,
                      color: "#ffffff",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <span className="relative flex items-center justify-center space-x-2">
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      <span>{buttonText}</span>
                    </span>
                  </div>
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default LandingNavbar;