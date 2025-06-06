import type { ThemeConfig } from "./types"

export const predefinedThemes: ThemeConfig[] = [
  {
    id: "default",
    name: "Default",
    colors: {
      primary: "#3b82f6",
      secondary: "#8b5cf6",
      background: "#f8fafc",
      text: "#1e293b",
      accent: "#10b981",
    },
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "14px",
      fontWeight: "400",
    },
    spacing: {
      base: "8px",
      scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64],
    },
  },
  {
    id: "dark",
    name: "Dark",
    colors: {
      primary: "#60a5fa",
      secondary: "#a78bfa",
      background: "#0f172a",
      text: "#f1f5f9",
      accent: "#34d399",
    },
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "14px",
      fontWeight: "400",
    },
    spacing: {
      base: "8px",
      scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64],
    },
  },
  {
    id: "warm",
    name: "Warm",
    colors: {
      primary: "#f59e0b",
      secondary: "#ef4444",
      background: "#fef7ed",
      text: "#92400e",
      accent: "#10b981",
    },
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "14px",
      fontWeight: "400",
    },
    spacing: {
      base: "8px",
      scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64],
    },
  },
  {
    id: "cool",
    name: "Cool",
    colors: {
      primary: "#0891b2",
      secondary: "#7c3aed",
      background: "#f0f9ff",
      text: "#0c4a6e",
      accent: "#059669",
    },
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "14px",
      fontWeight: "400",
    },
    spacing: {
      base: "8px",
      scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64],
    },
  },
]
