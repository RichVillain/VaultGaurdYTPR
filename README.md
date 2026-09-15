# VaultGaurdYTPR — VaultGuard YouTube Research Workspace

A Next.js research workspace for collecting YouTube playlists and videos,
clustering them by topic, and synthesizing source-attributed research briefs —
all powered by the Gemini API as the reasoning engine.

## What changed in the v2 rebuild

The original v1 was a single-file Flask script: TF-IDF + KMeans clustering,
no AI synthesis, designed for local-network use on a phone. This rebuild:

- Replaces TF-IDF/KMeans with **Gemini-based topic clustering** — the model
  reads the titles and names clusters the way a researcher would.
- Adds **Gemini-synthesized research packets**: pick 2+ sources, ask a
  question, get a source-attributed brief.
- Adds **Gemini-drafted repurposing**: Shorts hooks, LinkedIn posts, X
  threads, and newsletter excerpts drafted from a source's video titles.
- Is a real deployed app (Next.js on Vercel) instead of a phone-only local
  script — reachable from anywhere, not just the same Wi-Fi network.

Extraction still runs entirely server-side via `yt-dlp` (flat-playlist
listing only — no downloads, no ffmpeg dependency) so the browser never
touches extractor credentials or does the heavy lifting.

## Sections

- **Workspace** — real counts (sources, videos, clusters, packets) and a
  next-best-action prompt.
- **Collect** — paste video/Shorts/playlist URLs; extraction + clustering run
  server-side.
- **Library** — search, select, and open sources; each source page shows its
  Gemini-named clusters and lets you export an Obsidian vault (zip).
- **Research packets** — select 2+ sources, ask a question, get a Gemini
  brief with citations back to source titles.
- **Clip studio** — UI-complete; actual clip rendering needs a connected
  media/transcript provider (not wired up in this pass).
- **Repurpose** — Gemini drafts per surface (Shorts/LinkedIn/X/newsletter),
  clearly labeled as title-based rather than full-transcript-based.
- **Insights** — real per-source counts, no vanity metrics.

## Run locally

```bash
npm install
npm run dev
```

Requires `GEMINI_API_KEY` (from [Google AI Studio](https://aistudio.google.com/apikey))
in the environment for clustering, packet synthesis, and repurposing to do
real work. Without it, those features fall back to a clearly-labeled
placeholder rather than crashing — the app is still browsable and
extraction still works.

Also requires `SUPABASE_URL` and `SUPABASE_ANON_KEY` — workspace storage runs
through Supabase's REST API (see Data model below), not a local file, so
these are required, not optional; without them, collecting a source or
generating a packet will fail.

```
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash-lite   # optional, this is the default
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
PORT=3000                            # optional, mainly for local/Render use
```

## Data model

Workspace state (`ytpr_sources`, `ytpr_packets`) lives in Postgres via
Supabase's REST API (the public anon key, safe here because it's only ever
used server-side inside route handlers). This app deploys as Vercel
serverless functions — no persistent process and no shared filesystem
between invocations — so state can't live in memory or a local JSON file
the way a single long-running server could hold it. The tables have RLS
enabled but with an open policy: this app has no user-auth layer (a
single-operator tool, matching the original design), so there's no per-user
data to scope access to. That would need to change before this became a
multi-tenant product.

## VaultGuard RR3 relationship

`vaultgaurd-RR3-Protocol` is the companion protocol repository with its own
guardrailed ingest service and Postgres/pgvector persistence. This app does
not yet call into it — that integration (a server-side `ProjectStore`
adapter preserving source URLs, timestamps, and packet metadata) is a
follow-up, not part of this rebuild.

## Deploy

Deploys to Vercel (git-linked; auto-builds on push to `main`) as Node
serverless functions. `youtube-dl-exec` fetches a standalone `yt-dlp` binary
at install time — no Python dependency — and needs to be traced into the
function bundle correctly, which Vercel's Next.js build handles
automatically for `child_process`-invoked binaries resolved from
`node_modules`.

Collect/packet/repurpose routes set `maxDuration = 60` (the ceiling on
Vercel's Hobby plan) since yt-dlp extraction and Gemini calls can run long;
a very large playlist could still exceed it, which a persistent server
(e.g. Render) would not hit. Can also run as a single Node web service
(`npm install && npm run build`, `npm start`) if that matters more than
serverless for your use case — the Supabase-backed store works the same
either way.
