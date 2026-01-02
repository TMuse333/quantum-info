import { lightenHexColor, darkenHexColor, getLuminance } from "./colorMath";
import { BaseColorProps } from "@/types";

export interface DerivedColorPalette extends BaseColorProps {
    accentColor: string;           // Darker version of mainColor
    textHighlightColor: string;    // Same as mainColor for consistency
    gradientBg: string[];          // Array of shades from mainColor
    lightAccent: string;           // Lighter version for hover states
    darkAccent: string
  }

  export function deriveColorPalette(
    baseColors: BaseColorProps,
    gradientType: "radial" | "linear" | "solid" = "radial"
  ): DerivedColorPalette {
    const { baseBgColor, textColor, mainColor, bgLayout } = baseColors;
  
    // 🎯 Select which color drives the gradient generation
    const gradientBase = gradientType === "radial" ? mainColor : baseBgColor;
    const luminance = getLuminance(gradientBase);
    const isBright = luminance > 0.5;
  
    // Choose the correct transformation depending on brightness
    const lightenOrDarken = isBright ? darkenHexColor : lightenHexColor;
    const reverseAdjust = isBright ? lightenHexColor : darkenHexColor;
  
    // 🌈 Generate gradient colors differently based on type
    let gradientBg: string[];
  
    if (gradientType === "solid") {
      // Solid background: just a single color
      gradientBg = [gradientBase];
    } else if (gradientType === "linear") {
      // For linear: start with base, create contrast by adjusting both directions
      gradientBg = [
        reverseAdjust(gradientBase, 10), // slightly lighter/darker on start
        lightenOrDarken(gradientBase, 30), // more contrast toward end
      ];
    } else {
      // For radial: use richer expansion from mainColor outward
      gradientBg = [
        gradientBase,
        lightenOrDarken(gradientBase, 10),
        lightenOrDarken(gradientBase, 50),
        lightenOrDarken(gradientBase, 120),
      ];
    }
  
    return {
      baseBgColor,
      textColor,
      mainColor,
      bgLayout,
      accentColor: darkenHexColor(mainColor, 20),
      textHighlightColor: mainColor,
      gradientBg,
      lightAccent: lightenHexColor(mainColor, 30),
      darkAccent: darkenHexColor(mainColor, 30),
    };
  }
  
  