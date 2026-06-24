import Link from "next/link";
import { Plus } from "lucide-react";
import { Logo } from "./Logo";
import { StoreBadge } from "./StoreBadge";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink-800/70 bg-ink-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <StoreBadge />
          </div>
          <ThemeToggle />
          <Link href="/tournaments/new" className="btn-gold">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New tournament</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
