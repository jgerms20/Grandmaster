"use client";

import { useEffect, useState } from "react";

export type ThemeMode = "dark" | "light";
export type Accent = "gold" | "emerald" | "sky" | "violet" | "rose";

export const ACCENTS: Accent[] = ["gold", "emerald", "sky", "violet", "rose"];
export const ACCENT_HEX: Record<Accent, string> = {
  gold: "#d8a73a",
  emerald: "#34d399",
  sky: "#38bdf8",
  violet: "#a78bfa",
  rose: "#fb7185",
};

const THEME_KEY = "grandmaster:theme";
const ACCENT_KEY = "grandmaster:accent";

function apply(mode: ThemeMode, accent: Accent) {
  const el = document.documentElement;
  el.dataset.theme = mode;
  if (accent === "gold") delete el.dataset.accent;
  else el.dataset.accent = accent;
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [accent, setAccent] = useState<Accent>("gold");

  useEffect(() => {
    const m = (localStorage.getItem(THEME_KEY) as ThemeMode) || "dark";
    const a = (localStorage.getItem(ACCENT_KEY) as Accent) || "gold";
    setMode(m);
    setAccent(a);
    apply(m, a);
  }, []);

  const setThemeMode = (m: ThemeMode) => {
    setMode(m);
    try {
      localStorage.setItem(THEME_KEY, m);
    } catch {
      /* ignore */
    }
    apply(m, accent);
  };

  const setThemeAccent = (a: Accent) => {
    setAccent(a);
    try {
      localStorage.setItem(ACCENT_KEY, a);
    } catch {
      /* ignore */
    }
    apply(mode, a);
  };

  return { mode, accent, setThemeMode, setThemeAccent, toggle: () => setThemeMode(mode === "dark" ? "light" : "dark") };
}
