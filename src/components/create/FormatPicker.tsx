"use client";

import { Check, GitFork, Repeat, Shield, Swords } from "lucide-react";
import type { Format } from "@/lib/types";
import { FORMAT_BLURBS, FORMAT_LABELS } from "@/lib/types";

const ORDER: { format: Format; icon: typeof Repeat; tint: string; base?: boolean }[] = [
  { format: "round_robin", icon: Repeat, tint: "text-sky-300", base: true },
  { format: "single_elim", icon: Swords, tint: "text-gold-200" },
  { format: "double_elim", icon: Shield, tint: "text-emerald-300" },
  { format: "swiss", icon: GitFork, tint: "text-violet-300" },
];

export function FormatPicker({
  value,
  onChange,
}: {
  value: Format;
  onChange: (f: Format) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {ORDER.map(({ format, icon: Icon, tint, base }) => {
        const active = value === format;
        return (
          <button
            key={format}
            type="button"
            onClick={() => onChange(format)}
            className={`relative rounded-2xl border p-4 text-left transition ${
              active
                ? "border-gold-300/60 bg-gold-500/10 shadow-glow"
                : "border-ink-700/70 bg-ink-850/50 hover:border-ink-600"
            }`}
          >
            {active && (
              <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-gold-sheen text-onaccent">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
            )}
            <div className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${tint}`} />
              <span className="font-semibold text-cream">{FORMAT_LABELS[format]}</span>
              {base && (
                <span className="rounded bg-ink-700/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gold-200">
                  Base
                </span>
              )}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">{FORMAT_BLURBS[format]}</p>
          </button>
        );
      })}
    </div>
  );
}
