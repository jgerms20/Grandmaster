/** Small shared helpers (framework-agnostic). */

export function uid(prefix = ""): string {
  const rnd =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return prefix ? `${prefix}_${rnd}` : rnd;
}

/** Fisher–Yates shuffle (pure — returns a new array). */
export function shuffle<T>(arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** Smallest power of two >= n (min 1). */
export function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Capitalize the first letter of each word, leaving the rest as typed. */
export function titleCase(s: string): string {
  return s.replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}

/** Short date like "Jun 24". */
export function formatShortDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Friendly deadline countdown, e.g. "5 days left", "Ends today", "Ended". */
export function countdownLabel(endIso?: string): string | null {
  if (!endIso) return null;
  const end = new Date(endIso).getTime();
  const days = Math.ceil((end - Date.now()) / 86400000);
  if (days < 0) return "Ended";
  if (days === 0) return "Ends today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

/** Human elapsed time, e.g. 1h 04m or 47s. */
export function formatElapsed(fromIso?: string, toIso?: string): string {
  if (!fromIso) return "—";
  const from = new Date(fromIso).getTime();
  const to = toIso ? new Date(toIso).getTime() : Date.now();
  let s = Math.max(0, Math.floor((to - from) / 1000));
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  s -= m * 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}
