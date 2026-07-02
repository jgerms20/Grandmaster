import Link from "next/link";
import { Crown } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5">
      <span className="relative grid h-9 w-9 place-items-center rounded-[10px] bg-gold-400 text-onaccent shadow-[0_3px_0_0_rgb(var(--gold-600))] transition-transform group-hover:-rotate-6">
        <Crown className="h-5 w-5" strokeWidth={2.5} />
      </span>
      {!compact && (
        <span className="font-display text-xl font-black tracking-tight text-cream">
          Grand<span className="text-gradient-gold">master</span>
        </span>
      )}
    </Link>
  );
}
