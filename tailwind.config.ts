import type { Config } from "tailwindcss";

// Colors resolve to CSS variables (RGB triplets) defined in globals.css, so
// light/dark themes and accent colors can swap them at runtime via [data-theme]
// and [data-accent] without touching component classes.
const v = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: v("--ink-950"),
          900: v("--ink-900"),
          850: v("--ink-850"),
          800: v("--ink-800"),
          700: v("--ink-700"),
          600: v("--ink-600"),
          500: v("--ink-500"),
        },
        gold: {
          50: v("--gold-50"),
          100: v("--gold-100"),
          200: v("--gold-200"),
          300: v("--gold-300"),
          400: v("--gold-400"),
          500: v("--gold-500"),
          600: v("--gold-600"),
        },
        cream: v("--cream"),
        muted: v("--muted"),
        onaccent: v("--on-accent"),
        board: { light: v("--board-light"), dark: v("--board-dark") },
        live: v("--live"),
        win: v("--win"),
        loss: v("--loss"),
        draw: v("--draw"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "ui-serif", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 0 rgb(var(--hairline) / 0.05) inset, 0 14px 36px -22px rgb(0 0 0 / 0.6)",
        glow: "0 0 0 1px rgb(var(--gold-400) / 0.35), 0 10px 34px -12px rgb(var(--gold-400) / 0.4)",
      },
      backgroundImage: {
        "gold-sheen":
          "linear-gradient(135deg, rgb(var(--gold-100)) 0%, rgb(var(--gold-400)) 48%, rgb(var(--gold-600)) 100%)",
        "ink-fade": "radial-gradient(1200px 600px at 50% -10%, rgb(var(--gold-400) / 0.10), transparent 60%)",
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
