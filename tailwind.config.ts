import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0A0A0A",
          darker: "#050505",
          card: "#111111",
          border: "#1a1a1a",
          accent: "#F0B90B",
          green: "#0ECB81",
          red: "#F6465D",
          gold: "#F0B90B",
          "gold-dark": "#C99A08",
          muted: "#848E9C",
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 1.5s ease-in-out infinite",
        "ticker-scroll": "ticker-scroll 30s linear infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        "ticker-scroll": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
