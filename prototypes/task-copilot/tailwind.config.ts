import type { Config } from "tailwindcss";

const config: Config = {
  // Use design system preset for shared tokens
  presets: [require("../../packages/design-system/tailwind.preset.cjs")],
  // Enable class-based dark mode for user toggle (light/dark/auto)
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // Include design system components
    "../../packages/design-system/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};

export default config;
