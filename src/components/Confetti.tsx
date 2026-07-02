"use client";

import { useMemo } from "react";

const COLORS = ["#d8a73a", "#81b64c", "#f0d9b5", "#e2e8f0", "#38bdf8", "#fb7185"];

/** Full-screen celebration burst (pure CSS animation, respects reduced motion). */
export function Confetti({ fire }: { fire: boolean }) {
  const pieces = useMemo(() => {
    if (!fire) return [];
    return Array.from({ length: 110 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.2,
      duration: 2.8 + Math.random() * 2.4,
      drift: (Math.random() - 0.5) * 220,
      size: 6 + Math.random() * 7,
      color: COLORS[i % COLORS.length],
      round: Math.random() > 0.6,
    }));
  }, [fire]);

  if (!fire) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            top: "-6vh",
            left: `${p.left}%`,
            width: p.size,
            height: p.size * (p.round ? 1 : 0.45),
            backgroundColor: p.color,
            borderRadius: p.round ? "50%" : 2,
            ["--drift" as string]: `${p.drift}px`,
            animation: `confetti-fall ${p.duration}s ${p.delay}s cubic-bezier(0.25, 0.4, 0.55, 1) forwards`,
          }}
        />
      ))}
    </div>
  );
}
