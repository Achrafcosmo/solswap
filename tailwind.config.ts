import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0a0e1a",
          darker: "#060912",
          card: "#111827",
          border: "#1f2937",
          accent: "#14f195",
          purple: "#9945ff",
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 1.5s ease-in-out infinite",
        "float": "float-card 6s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        "float-card": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
