import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "ink-navy": "#1a1d2e",
        "ink-slate": "#3d3f4d",
        "marigold": "#f5a623",
        "sage": "#7cb342",
        "coral": "#ff6b6b",
        "sky": "#4db8ff",
      },
      fontFamily: {
        "space-grotesk": ["Space Grotesk", "sans-serif"],
        "inter": ["Inter", "sans-serif"],
        "ibm-plex-mono": ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
