export function darkenHexColor(hex: string, amount: number = 20): string {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
  
    const num = parseInt(hex, 16);
    let r = (num >> 16) & 0xff;
    let g = (num >> 8) & 0xff;
    let b = num & 0xff;
  
    r = Math.max(0, r - amount);
    g = Math.max(0, g - amount);
    b = Math.max(0, b - amount);
  
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
  }
  
  /**
   * Lighten a hex color by increasing each RGB channel.
   */
  export function lightenHexColor(hex: string, amount: number = 20): string {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
  
    const num = parseInt(hex, 16);
    let r = (num >> 16) & 0xff;
    let g = (num >> 8) & 0xff;
    let b = num & 0xff;
  
    r = Math.min(255, r + amount);
    g = Math.min(255, g + amount);
    b = Math.min(255, b + amount);
  
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
  }
  
  /**
   * Convert hex → rgba string with alpha
   */
  export function hexToRgba(hex: string, alpha: number): string {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
  
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
  
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  /**
   * Append alpha to hex (e.g. "#ff0000" + 0.5 → "#ff000080")
   */
  export function hexWithAlpha(hex: string, alpha: number): string {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
  
    const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, "0");
    return `#${hex}${alphaHex}`;
  }
  
  /**
   * Invert a hex color (e.g. black → white).
   */
  export function invertHexColor(hex: string): string {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
  
    const num = parseInt(hex, 16);
    const r = 255 - ((num >> 16) & 0xff);
    const g = 255 - ((num >> 8) & 0xff);
    const b = 255 - (num & 0xff);
  
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
  }
  
  /**
   * Calculate relative luminance (WCAG standard).
   */
  export function getLuminance(hex: string): number {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
  
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
  
    const a = [r, g, b].map(v =>
      v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    );
  
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }
  
  /**
   * Choose best text color (black or white) for readability against a background.
   */
  export function bestTextColor(bgHex: string): string {
    return getLuminance(bgHex) > 0.5 ? "#000000" : "#FFFFFF";
  }
  
  /**
   * Mix/blend two hex colors together by a weight.
   */
  export function mixHexColors(hex1: string, hex2: string, weight: number = 0.5): string {
    hex1 = hex1.replace(/^#/, "");
    hex2 = hex2.replace(/^#/, "");
    if (hex1.length === 3) hex1 = hex1.split("").map(c => c + c).join("");
    if (hex2.length === 3) hex2 = hex2.split("").map(c => c + c).join("");
  
    const r1 = parseInt(hex1.slice(0, 2), 16);
    const g1 = parseInt(hex1.slice(2, 4), 16);
    const b1 = parseInt(hex1.slice(4, 6), 16);
  
    const r2 = parseInt(hex2.slice(0, 2), 16);
    const g2 = parseInt(hex2.slice(2, 4), 16);
    const b2 = parseInt(hex2.slice(4, 6), 16);
  
    const r = Math.round(r1 * (1 - weight) + r2 * weight);
    const g = Math.round(g1 * (1 - weight) + g2 * weight);
    const b = Math.round(b1 * (1 - weight) + b2 * weight);
  
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
  }