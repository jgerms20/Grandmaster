"use client";

import type { Format, Rules } from "@/lib/types";
import { recommendedRounds, TIME_CONTROL_PRESETS } from "@/lib/formats";

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex-1">
      <span className="field-label">{label}</span>
      <input
        type="number"
        step="0.5"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="input font-mono"
      />
    </label>
  );
}

export function RulesEditor({
  rules,
  onChange,
  format,
  rounds,
  onRounds,
  playerCount,
}: {
  rules: Rules;
  onChange: (patch: Partial<Rules>) => void;
  format: Format;
  rounds: number;
  onRounds: (n: number) => void;
  playerCount: number;
}) {
  const isPreset = TIME_CONTROL_PRESETS.some((p) => p.value === rules.timeControl);
  return (
    <div className="space-y-5">
      <div>
        <span className="field-label">Time control</span>
        <div className="flex flex-wrap gap-2">
          {TIME_CONTROL_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange({ timeControl: p.value })}
              className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                rules.timeControl === p.value
                  ? "border-gold-300/60 bg-gold-500/15 text-gold-100"
                  : "border-ink-700/70 bg-ink-850/50 text-muted hover:border-ink-600"
              }`}
            >
              {p.label}
            </button>
          ))}
          <input
            value={isPreset ? "" : rules.timeControl}
            onChange={(e) => onChange({ timeControl: e.target.value })}
            placeholder="custom (e.g. 45|15)"
            className="w-36 rounded-xl border border-ink-700/70 bg-ink-900/60 px-3 py-1.5 text-xs text-cream placeholder:text-muted/60 focus:border-gold-300/60 focus:outline-none"
          />
        </div>
      </div>

      {format === "swiss" && (
        <div>
          <span className="field-label">Number of rounds</span>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              value={rounds}
              onChange={(e) => onRounds(Math.max(1, Number(e.target.value)))}
              className="input w-28 font-mono"
            />
            <span className="text-xs text-muted">
              Recommended for {playerCount}: <b className="text-cream">{recommendedRounds("swiss", playerCount)}</b>
            </span>
          </div>
        </div>
      )}

      <div>
        <span className="field-label">Scoring</span>
        <div className="flex gap-3">
          <NumberField label="Win" value={rules.pointsWin} onChange={(n) => onChange({ pointsWin: n })} />
          <NumberField label="Draw" value={rules.pointsDraw} onChange={(n) => onChange({ pointsDraw: n })} />
          <NumberField label="Loss" value={rules.pointsLoss} onChange={(n) => onChange({ pointsLoss: n })} />
        </div>
      </div>

      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-ink-700/70 bg-ink-900/40 px-3.5 py-3">
        <span>
          <span className="block text-sm font-medium text-cream">Replay draws</span>
          <span className="text-xs text-muted">Drawn games are replayed instead of splitting the point.</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={rules.rematchOnDraw}
          onClick={() => onChange({ rematchOnDraw: !rules.rematchOnDraw })}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            rules.rematchOnDraw ? "bg-gold-sheen" : "bg-ink-600"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-ink-950 transition ${
              rules.rematchOnDraw ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>
      </label>

      <div>
        <span className="field-label">Tiebreak</span>
        <input
          value={rules.tiebreak}
          onChange={(e) => onChange({ tiebreak: e.target.value })}
          className="input"
        />
      </div>

      <div>
        <span className="field-label">Describe your own rules (optional)</span>
        <textarea
          value={rules.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          placeholder="e.g. Best of 3 in the final. No takebacks. Show up within 10 minutes or forfeit. Trash talk encouraged."
          className="input resize-y"
        />
      </div>
    </div>
  );
}
