"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles, Trophy } from "lucide-react";
import { FormatPicker } from "@/components/create/FormatPicker";
import { PlayerEditor, emptyPlayer, type PlayerDraft } from "@/components/create/PlayerEditor";
import { RulesEditor } from "@/components/create/RulesEditor";
import { createTournament, defaultRules, recommendedRounds, suggestRules } from "@/lib/formats";
import type { Format, Rules } from "@/lib/types";
import { commit } from "@/lib/store";
import { getAiKey, suggestRulesAI } from "@/lib/ai";
import { titleCase } from "@/lib/util";

function Step({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-gold-sheen text-sm font-bold text-onaccent">
        {n}
      </span>
      <div>
        <h2 className="font-display text-lg font-semibold text-cream">{title}</h2>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
    </div>
  );
}

export default function NewTournamentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<Format>("round_robin");
  const [players, setPlayers] = useState<PlayerDraft[]>(() => [
    emptyPlayer(),
    emptyPlayer(),
    emptyPlayer(),
    emptyPlayer(),
  ]);
  const [rules, setRules] = useState<Rules>(() => defaultRules("round_robin"));
  const [rounds, setRounds] = useState(0);
  const [duration, setDuration] = useState(14);
  const [seedByRating, setSeedByRating] = useState(true);
  const [creating, setCreating] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const named = useMemo(() => players.filter((p) => p.name.trim()), [players]);
  const isElim = format === "single_elim" || format === "double_elim";
  const effRounds = rounds || recommendedRounds("swiss", Math.max(2, named.length));

  async function handleSuggest() {
    setSuggesting(true);
    try {
      const count = Math.max(2, named.length);
      const key = getAiKey();
      let s = suggestRules(format, count, duration);
      if (key) {
        try {
          s = await suggestRulesAI(
            { name, format, playerNames: named.map((p) => p.name), playerCount: count, durationDays: duration },
            key,
          );
        } catch {
          s = suggestRules(format, count, duration); // graceful fallback
        }
      }
      setRules((r) => ({ ...r, ...s.rules }));
      if (format === "swiss" && s.plannedRounds) setRounds(s.plannedRounds);
    } finally {
      setSuggesting(false);
    }
  }

  async function handleCreate() {
    if (named.length < 2) {
      setError("Add at least two named players.");
      return;
    }
    setError(null);
    setCreating(true);
    try {
      let ordered = named;
      if (isElim && seedByRating) {
        ordered = [...named].sort((a, b) => (b.info?.rating ?? 0) - (a.info?.rating ?? 0));
      }
      const t = createTournament({
        name,
        format,
        players: ordered.map((p) => ({ name: p.name, chessUsername: p.chessUsername || undefined })),
        rules,
        plannedRounds: format === "swiss" ? effRounds : undefined,
        durationDays: duration,
      });
      // Attach hydrated Chess.com info (order is preserved by createTournament).
      t.players.forEach((tp, i) => {
        const info = ordered[i]?.info;
        if (info?.found) {
          tp.avatarUrl = info.avatarUrl;
          tp.rating = info.rating;
          tp.title = info.title;
          tp.countryCode = info.countryCode;
          tp.profileUrl = info.profileUrl;
        }
      });
      await commit(t);
      try {
        localStorage.setItem(`grandmaster:org:${t.id}`, t.adminCode);
      } catch {
        /* ignore */
      }
      router.push(`/t?id=${t.id}`);
    } catch (e) {
      setError("Something went wrong creating the tournament.");
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-cream">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div>
        <h1 className="font-display text-3xl font-bold text-cream">New tournament</h1>
        <p className="mt-1 text-sm text-muted">Set it up once — everyone gets a live link to follow along.</p>
      </div>

      <section className="panel p-5">
        <Step n={1} title="Basics" />
        <label className="block">
          <span className="field-label">Tournament name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name && setName(titleCase(name))}
            placeholder="Friday Night Arena"
            className="input"
            autoFocus
          />
        </label>
      </section>

      <section className="panel p-5">
        <Step n={2} title="Format" hint="Round robin is the base — switch any time before you start." />
        <FormatPicker value={format} onChange={setFormat} />
        {isElim && (
          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={seedByRating}
              onChange={(e) => setSeedByRating(e.target.checked)}
              className="h-4 w-4 accent-gold-400"
            />
            Seed the bracket by Chess.com rating
          </label>
        )}
      </section>

      <section className="panel p-5">
        <Step n={3} title="Players" />
        <PlayerEditor players={players} onChange={setPlayers} />
      </section>

      <section className="panel p-5">
        <Step n={4} title="Rules" hint="Sensible defaults are filled in — tweak whatever you like." />
        <RulesEditor
          rules={rules}
          onChange={(patch) => setRules((r) => ({ ...r, ...patch }))}
          format={format}
          rounds={effRounds}
          onRounds={setRounds}
          playerCount={Math.max(2, named.length)}
          duration={duration}
          onDuration={setDuration}
          onSuggest={handleSuggest}
          suggesting={suggesting}
        />
      </section>

      {error && (
        <div className="rounded-xl border border-loss/40 bg-loss/10 px-4 py-3 text-sm text-loss">{error}</div>
      )}

      <div className="sticky bottom-4 z-10">
        <div className="panel flex items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-2 px-2 text-sm text-muted">
            <Sparkles className="h-4 w-4 text-gold-300" />
            <span>
              {named.length} players · <span className="text-cream">{format.replace("_", " ")}</span>
            </span>
          </div>
          <button onClick={handleCreate} disabled={creating || named.length < 2} className="btn-gold">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
            {creating ? "Creating…" : "Create & open bracket"}
          </button>
        </div>
      </div>
    </div>
  );
}
