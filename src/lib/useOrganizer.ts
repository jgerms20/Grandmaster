"use client";

import { useEffect, useState } from "react";
import type { Tournament } from "@/lib/types";

const keyFor = (id: string) => `grandmaster:org:${id}`;

/**
 * Lightweight "organizer mode" gate. Anyone holding the tournament's admin code
 * can run it (record results, set games live). Viewers without it get a live,
 * read-only view. Not hardened auth — just enough to stop accidental edits.
 */
export function useOrganizer(t: Tournament | null) {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (!t) return;
    try {
      setUnlocked(localStorage.getItem(keyFor(t.id)) === t.adminCode);
    } catch {
      setUnlocked(false);
    }
  }, [t]);

  const unlock = (code: string): boolean => {
    if (!t) return false;
    if (code.trim() === t.adminCode) {
      try {
        localStorage.setItem(keyFor(t.id), t.adminCode);
      } catch {
        /* ignore */
      }
      setUnlocked(true);
      return true;
    }
    return false;
  };

  const lock = () => {
    if (t) {
      try {
        localStorage.removeItem(keyFor(t.id));
      } catch {
        /* ignore */
      }
    }
    setUnlocked(false);
  };

  return { unlocked, unlock, lock };
}
