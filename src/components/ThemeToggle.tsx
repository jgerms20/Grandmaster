"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Moon, Palette, Sun } from "lucide-react";
import { ACCENT_HEX, ACCENTS, useTheme } from "@/lib/useTheme";

export function ThemeToggle() {
  const { mode, accent, setThemeAccent, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={toggle}
        title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        className="grid h-9 w-9 place-items-center rounded-xl border border-ink-600/60 bg-ink-800/40 text-cream transition hover:border-gold-300/50"
      >
        {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          title="Accent color"
          className="grid h-9 w-9 place-items-center rounded-xl border border-ink-600/60 bg-ink-800/40 transition hover:border-gold-300/50"
        >
          <Palette className="h-4 w-4" style={{ color: ACCENT_HEX[accent] }} />
        </button>
        {open && (
          <div className="panel absolute right-0 top-11 z-40 flex gap-2 p-2.5">
            {ACCENTS.map((a) => (
              <button
                key={a}
                onClick={() => {
                  setThemeAccent(a);
                  setOpen(false);
                }}
                title={a}
                className="grid h-7 w-7 place-items-center rounded-full ring-2 ring-transparent transition hover:scale-110"
                style={{ backgroundColor: ACCENT_HEX[a], boxShadow: accent === a ? `0 0 0 2px rgb(var(--ink-850)), 0 0 0 4px ${ACCENT_HEX[a]}` : undefined }}
              >
                {accent === a && <Check className="h-3.5 w-3.5 text-black/70" strokeWidth={3} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
