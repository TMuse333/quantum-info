export type GradientType = 
| "radial"
| "linear"
| "solid";

export interface GradientConfig {
  type: GradientType;
  // Radial specific
  radialSize?: string;
  radialPosition?: string;
  radialBaseStop?: number;
  // Linear specific
  direction?: string;
  colorStops?: number[]; // Positions for gradient colors (0-100)
}