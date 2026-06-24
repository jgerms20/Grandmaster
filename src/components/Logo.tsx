import Link from "next/link";
import { Crown } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5">
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gold-sheen text-ink-950 shadow-glow">
        <Crown className="h-5 w-5" strokeWidth={2.25} />
      </span>
      {!compact && (
        <span className="font-display text-xl font-bold tracking-wide text-cream">
          Grand<span className="text-gradient-gold">master</span>
        </span>
      )}
    </Link>
  );
}
