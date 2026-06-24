"use client";

import { useEffect, useState } from "react";
import { Check, KeyRound, Loader2, Sparkles, X } from "lucide-react";
import type { Format, Rules } from "@/lib/types";
import {
  DURATION_PRESETS,
  TIEBREAK_OPTIONS,
  TIME_CONTROL_PRESETS,
  recommendedRounds,
} from "@/lib/formats";
import { clearAiKey, getAiKey, setAiKey } from "@/lib/ai";

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

function Chips({
  options,
  value,
  onPick,
}: {
  options: { value: string; label: string }[];
  value: string;
  onPick: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onPick(o.value)}
          className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
            value === o.value
              ? "border-gold-300/60 bg-gold-500/15 text-gold-100"
              : "border-ink-700/70 bg-ink-850/50 text-muted hover:border-ink-600"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function RulesEditor({
  rules,
  onChange,
  format,
  rounds,
  onRounds,
  playerCount,
  duration,
  onDuration,
  onSuggest,
  suggesting,
}: {
  rules: Rules;
  onChange: (patch: Partial<Rules>) => void;
  format: Format;
  rounds: number;
  onRounds: (n: number) => void;
  playerCount: number;
  duration: number;
  onDuration: (n: number) => void;
  onSuggest: () => void;
  suggesting?: boolean;
}) {
  const isPresetTC = TIME_CONTROL_PRESETS.some((p) => p.value === rules.timeControl);
  const isCustomTiebreak = !TIEBREAK_OPTIONS.includes(rules.tiebreak);

  const [aiKey, setAiKeyState] = useState("");
  const [keyPanel, setKeyPanel] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  useEffect(() => {
    setAiKeyState(getAiKey());
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <button
          type="button"
          onClick={onSuggest}
          disabled={suggesting}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold-300/40 bg-gold-500/10 px-4 py-2.5 text-sm font-semibold text-gold-100 transition hover:bg-gold-500/20 disabled:opacity-60"
        >
          {suggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {suggesting ? "Thinking…" : aiKey ? "Suggest rules with Claude" : "Suggest rules for me"}
        </button>
        <div className="mt-1.5 flex items-center justify-between px-1 text-[11px]">
          <span className="text-muted">
            {aiKey ? "Powered by Claude (your API key)" : "Smart suggestions — no setup needed"}
          </span>
          <button
            type="button"
            onClick={() => setKeyPanel((o) => !o)}
            className="inline-flex items-center gap-1 text-muted hover:text-gold-200"
          >
            <KeyRound className="h-3 w-3" />
            {aiKey ? "AI on" : "Use AI"}
          </button>
        </div>
        {keyPanel && (
          <div className="mt-2 rounded-xl border border-ink-700/70 bg-ink-900/50 p-3">
            {aiKey ? (
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-win">
                  <Check className="h-3.5 w-3.5" /> Claude connected
                </span>
                <button
                  type="button"
                  onClick={() => {
                    clearAiKey();
                    setAiKeyState("");
                    setKeyInput("");
                  }}
                  className="inline-flex items-center gap-1 text-xs text-muted hover:text-loss"
                >
                  <X className="h-3.5 w-3.5" /> Remove key
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="sk-ant-…  (your Anthropic API key)"
                  className="input text-xs"
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted">Stored only in this browser. Used to call Claude directly.</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!keyInput.trim()) return;
                      setAiKey(keyInput);
                      setAiKeyState(keyInput.trim());
                    }}
                    className="btn-subtle px-3 py-1.5 text-xs"
                  >
                    Save key
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <span className="field-label">How long should it run?</span>
        <Chips
          options={DURATION_PRESETS.map((d) => ({ value: String(d.days), label: d.label }))}
          value={String(duration)}
          onPick={(v) => onDuration(Number(v))}
        />
      </div>

      <div>
        <span className="field-label">Time control</span>
        <div className="flex flex-wrap gap-2">
          <Chips options={TIME_CONTROL_PRESETS} value={rules.timeControl} onPick={(v) => onChange({ timeControl: v })} />
          <input
            value={isPresetTC ? "" : rules.timeControl}
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
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${
              rules.rematchOnDraw ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>
      </label>

      <div>
        <span className="field-label">Tiebreak</span>
        <select
          value={isCustomTiebreak ? "__custom__" : rules.tiebreak}
          onChange={(e) => onChange({ tiebreak: e.target.value === "__custom__" ? "" : e.target.value })}
          className="input cursor-pointer"
        >
          {TIEBREAK_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          <option value="__custom__">Custom…</option>
        </select>
        {isCustomTiebreak && (
          <input
            value={rules.tiebreak}
            onChange={(e) => onChange({ tiebreak: e.target.value })}
            placeholder="Describe your tiebreak"
            className="input mt-2"
            autoFocus
          />
        )}
      </div>

      <div>
        <span className="field-label">Describe your own rules (optional)</span>
        <textarea
          value={rules.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={4}
          placeholder="e.g. Best of 3 in the final. No takebacks. Show up within 10 minutes or forfeit. Trash talk encouraged."
          className="input resize-y"
        />
      </div>
    </div>
  );
}
