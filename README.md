# ♚ Grandmaster

A live, shared chess‑tournament hub for you and your friends — think *ESPN Tournament Challenge*, but for your group's chess games and built on top of **Chess.com**.

Set up a tournament once, drop in your players, pick a format, and Grandmaster builds the bracket. Everyone gets **one link** that shows who's playing whom, who has White, who's winning, how long games have run, and who's been eliminated — updating live the moment a result is recorded.

> Built because being *in* a long chess tournament is fun, but keeping track of it — who played which color last round, who's out, what the tiebreak rules are — is not.

---

## Highlights

- **Four formats, one base.** Round robin (the default), plus single elimination, double elimination, and Swiss — all selectable when you create a tournament.
- **A bracket / standings table everyone can watch live.** Real‑time updates across every device.
- **Match cards** show colors (♔/♚), live status, a ticking clock, move count, and a **Watch on Chess.com** link.
- **Chess.com integration.** Type a username and it pulls the player's avatar, title, rating, and country flag from the public API; brackets can be auto‑seeded by rating.
- **Rules that make sense.** Sensible defaults (time control, scoring, tiebreak) plus a free‑text *"describe your own rules"* box.
- **Organizer mode.** A lightweight code gates editing, so viewers get a clean read‑only live view while the organizer records results with one tap.
- **Zero‑config to start.** Runs immediately with a local store that syncs live across browser tabs. Add Supabase keys for real cross‑device realtime — no code changes.

---

## Quickstart

```bash
npm install
npm run dev
# open http://localhost:3000
```

That's it. With no configuration the app uses a **local store** (browser `localStorage` + `BroadcastChannel`) so data persists and updates live across all your open tabs. A demo tournament is seeded on first visit.

Run the tests for the tournament engine:

```bash
npm test
```

---

## Going live across devices (Supabase)

Local mode is per‑browser. For a link your friends can open on their own phones with live updates, connect a free [Supabase](https://supabase.com) project:

1. Create a project.
2. In the dashboard, open **SQL → New query**, paste [`supabase/schema.sql`](./supabase/schema.sql), and run it.
3. Copy `.env.example` to `.env.local` and fill in:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```

4. Restart `npm run dev`. The header badge will switch from **Local** to **Live sync**.

The whole tournament is stored as one JSONB row and the app subscribes to realtime row changes — so any result you record shows up on every connected screen.

---

## Deploying to GitHub Pages

The repo ships with a GitHub Actions workflow ([`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)) that builds the app as a static site and publishes it to Pages.

**One-time setup:** in your repo, go to **Settings → Pages → Build and deployment** and set **Source = "GitHub Actions"**.

After that, every push to `main` builds and deploys automatically (you can also run it manually from the **Actions** tab → *Deploy to GitHub Pages* → *Run workflow*). Your site goes live at:

```
https://<your-username>.github.io/<repo-name>/
```

The workflow figures out the base path from the repo name, so no hardcoding is needed. To enable **cross-device realtime** on the deployed site, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as repository **secrets** (Settings → Secrets and variables → Actions) — the workflow passes them through at build time. Without them the site runs in local (per-browser) mode.

> Avatars/ratings call `api.chess.com` directly from the browser, so the deployed site needs no server. (Also deployable to Vercel or any static/Next host.)

---

## How it works

### Formats & the engine

All tournament logic lives in [`src/lib/formats`](./src/lib/formats) as pure, framework‑agnostic functions with full test coverage ([`formats.test.ts`](./src/lib/formats/formats.test.ts)):

| Format | What it does |
| --- | --- |
| **Round robin** | Everyone plays everyone (circle method, balanced colors), ranked by points. |
| **Single elimination** | Seeded knockout bracket with automatic byes for non‑power‑of‑two fields. |
| **Double elimination** | Winners + losers brackets with proper minor/major routing and a grand final. |
| **Swiss** | Score‑group pairing each round, avoids rematches, balances White/Black, supports byes. |

Standings use **Sonneborn–Berger** as the tiebreak. Bracket advancement (winners flowing forward, losers dropping to the lower bracket, byes collapsing) is centralized in [`advance.ts`](./src/lib/formats/advance.ts) so single‑ and double‑elimination share one well‑tested code path.

### Data & realtime

The UI only ever talks to a single [`TournamentStore`](./src/lib/store/types.ts) interface. Two interchangeable implementations are selected automatically based on whether Supabase env vars are present:

- `LocalStore` — `localStorage` + `BroadcastChannel`
- `SupabaseStore` — Postgres + realtime

### Chess.com

The public Chess.com API is called directly from the browser (it allows cross-origin requests), with an in-session cache, so the app stays fully static and Pages-friendly. Profiles + ratings are normalized in [`src/lib/chesscom.ts`](./src/lib/chesscom.ts).

---

## Project structure

```
src/
  app/
    page.tsx                     Dashboard (list of tournaments)
    tournaments/new/page.tsx     Create flow (format, players, rules)
    t/page.tsx                   Live tournament view (the centerpiece, /t?id=…)
  components/                     UI: bracket, match card, standings, player chips…
  lib/
    formats/                     Pure tournament logic + tests
    store/                       Local + Supabase backends behind one interface
    chesscom.ts                  Chess.com client
    types.ts                     Domain model
supabase/schema.sql              One-time Supabase setup
```

---

## Tech

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Supabase · Vitest.

## Roadmap ideas

- Auto‑detect results by polling Chess.com game archives.
- Bracket‑reset (true double grand final).
- Drag‑to‑reorder seeding and manual pairing overrides.
- Per‑tournament chat / shoutbox.
