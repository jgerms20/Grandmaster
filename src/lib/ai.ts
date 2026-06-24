"use client";

import type { Suggestion } from "@/lib/formats";
import type { Format, Rules } from "@/lib/types";

// Optional real-LLM rule suggestions. The user supplies their own Anthropic API
// key (stored only in this browser); the request goes straight from the browser
// to the Anthropic API via fetch (see note in suggestRulesAI for why not the SDK).
// If anything fails, callers fall back to the local heuristic engine.

const KEY = "grandmaster:anthropic_key";

export function getAiKey(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function setAiKey(k: string): void {
  try {
    localStorage.setItem(KEY, k.trim());
  } catch {
    /* ignore */
  }
}

export function clearAiKey(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export interface AiSuggestInput {
  name: string;
  format: Format;
  playerNames: string[];
  playerCount: number;
  durationDays: number;
}

function parseJson(text: string): Record<string, unknown> {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(cleaned);
}

export async function suggestRulesAI(input: AiSuggestInput, apiKey: string): Promise<Suggestion> {
  // Raw fetch (not the @anthropic-ai/sdk) on purpose: this app ships as a static
  // browser bundle and the SDK imports Node-only modules (node:path) that don't
  // build for the browser. The dangerous-direct-browser-access header is what the
  // SDK's dangerouslyAllowBrowser flag sets under the hood.
  const length = input.durationDays ? `${input.durationDays} days` : "open-ended (no deadline)";
  const prompt = `You are an expert chess tournament organizer. Design tailored rules for this tournament.

Tournament: ${input.name || "(unnamed)"}
Format: ${input.format.replace("_", " ")}
Players (${input.playerCount}): ${input.playerNames.join(", ") || "unnamed"}
Intended length: ${length}

Pick a sensible pace for the length (daily time controls like "3 days" per move for multi-week events; live "10|0" rapid for a single day). Respond with ONLY a JSON object (no prose, no code fence) with exactly these keys:
{
  "timeControl": string,        // e.g. "3 days" or "10|0"
  "pointsWin": number,          // usually 1
  "pointsDraw": number,         // usually 0.5
  "pointsLoss": number,         // usually 0
  "tiebreak": string,           // one sentence
  "description": string,        // 2-4 sentences players will read explaining how it works
  "plannedRounds": number       // for swiss only, else 0
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API error ${res.status}`);
  const body = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = (body.content ?? []).map((b) => (b.type === "text" ? (b.text ?? "") : "")).join("");
  const data = parseJson(text);

  const num = (v: unknown, d: number) => (typeof v === "number" && !Number.isNaN(v) ? v : d);
  const rules: Partial<Rules> = {
    timeControl: typeof data.timeControl === "string" ? data.timeControl : undefined,
    pointsWin: num(data.pointsWin, 1),
    pointsDraw: num(data.pointsDraw, 0.5),
    pointsLoss: num(data.pointsLoss, 0),
    tiebreak: typeof data.tiebreak === "string" ? data.tiebreak : undefined,
    description: typeof data.description === "string" ? data.description : undefined,
  };
  const plannedRounds = input.format === "swiss" ? num(data.plannedRounds, 0) || undefined : undefined;
  return { rules, plannedRounds };
}
