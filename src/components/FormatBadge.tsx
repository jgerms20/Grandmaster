import { GitFork, Repeat, Shield, Swords } from "lucide-react";
import type { Format } from "@/lib/types";
import { FORMAT_LABELS } from "@/lib/types";

const META: Record<Format, { icon: typeof Repeat; tint: string }> = {
  round_robin: { icon: Repeat, tint: "text-sky-300" },
  single_elim: { icon: Swords, tint: "text-gold-200" },
  double_elim: { icon: Shield, tint: "text-emerald-300" },
  swiss: { icon: GitFork, tint: "text-violet-300" },
};

export function FormatBadge({ format, className = "" }: { format: Format; className?: string }) {
  const { icon: Icon, tint } = META[format];
  return (
    <span className={`chip ${className}`}>
      <Icon className={`h-3.5 w-3.5 ${tint}`} />
      {FORMAT_LABELS[format]}
    </span>
  );
}
