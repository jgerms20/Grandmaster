"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import type { Tournament } from "@/lib/types";
import { DURATION_PRESETS, type SettingsPatch } from "@/lib/formats";
import { Modal } from "./Modal";

export function SettingsModal({
  tournament: t,
  onSave,
  onClose,
}: {
  tournament: Tournament;
  onSave: (patch: SettingsPatch) => Promise<void> | void;
  onClose: () => void;
}) {
  const [name, setName] = useState(t.name);
  const [timeControl, setTimeControl] = useState(t.rules.timeControl);
  const [pointsWin, setPointsWin] = useState(t.rules.pointsWin);
  const [pointsDraw, setPointsDraw] = useState(t.rules.pointsDraw);
  const [pointsLoss, setPointsLoss] = useState(t.rules.pointsLoss);
  const [tiebreak, setTiebreak] = useState(t.rules.tiebreak);
  const [description, setDescription] = useState(t.rules.description);
  const [duration, setDuration] = useState(t.durationDays ?? 0);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        name,
        rules: { timeControl, pointsWin, pointsDraw, pointsLoss, tiebreak, description },
        durationDays: duration,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Tournament settings" onClose={onClose}>
      <div className="space-y-4">
        <label className="block">
          <span className="field-label">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="field-label">Time control</span>
            <input value={timeControl} onChange={(e) => setTimeControl(e.target.value)} className="input font-mono" />
          </label>
          <label className="block">
            <span className="field-label">Deadline</span>
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="input cursor-pointer">
              {DURATION_PRESETS.map((d) => (
                <option key={d.days} value={d.days}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <span className="field-label">Scoring (win / draw / loss)</span>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                [pointsWin, setPointsWin],
                [pointsDraw, setPointsDraw],
                [pointsLoss, setPointsLoss],
              ] as const
            ).map(([value, set], i) => (
              <input
                key={i}
                type="number"
                step="0.5"
                value={value}
                onChange={(e) => set(Number(e.target.value))}
                className="input font-mono"
              />
            ))}
          </div>
        </div>

        <label className="block">
          <span className="field-label">Tiebreak</span>
          <input value={tiebreak} onChange={(e) => setTiebreak(e.target.value)} className="input" />
        </label>

        <label className="block">
          <span className="field-label">House rules</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="input resize-y"
          />
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="btn-subtle text-sm">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-gold text-sm">
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
