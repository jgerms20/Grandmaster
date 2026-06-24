import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // App chrome — deep, warm ink
        ink: {
          950: "#08090d",
          900: "#0b0d12",
          850: "#0f1218",
          800: "#14171f",
          700: "#1b1f29",
          600: "#252a36",
          500: "#333947",
        },
        // Grandmaster gold
        gold: {
          50: "#fbf6e9",
          100: "#f4e6bf",
          200: "#ecd28a",
          300: "#e3bd57",
          400: "#d8a73a",
          500: "#c28f2a",
          600: "#9c7020",
        },
        // Classic board squares
        board: {
          light: "#f0d9b5",
          dark: "#b58863",
        },
        cream: "#efe7d6",
        muted: "#8b93a2",
        live: "#f0563f",
        win: "#3fbf7f",
        loss: "#e0526b",
        draw: "#7a8294",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "ui-serif", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 16px 40px -24px rgba(0,0,0,0.9)",
        glow: "0 0 0 1px rgba(216,167,58,0.35), 0 8px 30px -10px rgba(216,167,58,0.35)",
      },
      backgroundImage: {
        "gold-sheen": "linear-gradient(135deg, #f4e6bf 0%, #d8a73a 45%, #9c7020 100%)",
        "ink-fade": "radial-gradient(1200px 600px at 50% -10%, rgba(216,167,58,0.10), transparent 60%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseLive: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        "pulse-live": "pulseLive 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
