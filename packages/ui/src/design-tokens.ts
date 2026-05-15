export const designTokens = {
  color: {
    background: "#07090f",
    backgroundElevated: "#0d1119",
    surface: "rgba(22, 27, 38, 0.62)",
    surfaceQuiet: "rgba(255, 255, 255, 0.055)",
    surfaceStrong: "rgba(31, 37, 50, 0.82)",
    glass: "rgba(255, 255, 255, 0.075)",
    border: "rgba(255, 255, 255, 0.11)",
    borderStrong: "rgba(255, 255, 255, 0.18)",
    text: "#f6f8fb",
    textSecondary: "#c7d0dc",
    muted: "#8f9bad",
    blue: "#82b7ff",
    blueSoft: "#b7d8ff",
    amber: "#f4bd73",
    green: "#87d8ae",
    rose: "#ef8fa6",
    danger: "#ff8d8d"
  },
  radius: {
    xs: "8px",
    sm: "12px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    pill: "999px"
  },
  space: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
    "2xl": "2rem",
    "3xl": "3rem"
  },
  shadow: {
    panel: "0 18px 60px rgba(0, 0, 0, 0.28)",
    stage: "0 32px 90px rgba(0, 0, 0, 0.34)",
    control: "0 10px 26px rgba(0, 0, 0, 0.24)"
  },
  motion: {
    fast: "140ms ease",
    normal: "220ms cubic-bezier(0.2, 0.8, 0.2, 1)"
  }
} as const;
