"use client";

import { storeKind } from "@/lib/store";

export function StoreBadge() {
  const kind = storeKind();
  const live = kind === "supabase";
  return (
    <span
      className="chip"
      title={
        live
          ? "Connected to Supabase — updates sync live across every device."
          : "Local mode — data is saved in this browser and syncs live across your open tabs. Add Supabase keys for cross-device sync."
      }
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${live ? "bg-win" : "bg-gold-300"} ${live ? "animate-pulse-live" : ""}`}
      />
      {live ? "Live sync" : "Local"}
    </span>
  );
}
