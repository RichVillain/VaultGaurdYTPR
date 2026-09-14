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
- Is a real deployed app (Next.js on Render) instead of a phone-only local
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

```
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash-lite   # optional, this is the default
YTPR_DATA_DIR=./data                 # optional, where workspace.json is stored
PORT=3000                            # optional
```

## Data model

Workspace state (`sources`, `packets`) lives in a module-level store backed
by a JSON file (`data/workspace.json` by default) — this app runs as one
persistent Node process (`next start`), not serverless functions, so this is
valid for the process lifetime and survives most restarts. It is not a
database; a fresh container (e.g. a new Render deploy) starts empty.

## VaultGuard RR3 relationship

`vaultgaurd-RR3-Protocol` is the companion protocol repository with its own
guardrailed ingest service and Postgres/pgvector persistence. This app does
not yet call into it — that integration (a server-side `ProjectStore`
adapter preserving source URLs, timestamps, and packet metadata) is a
follow-up, not part of this rebuild.

## Deploy

Runs as a single Node web service (e.g. Render): `npm install && npm run
build` to build, `npm start` to run (`next start -p $PORT`). `yt-dlp-exec`
fetches a standalone `yt-dlp` binary at install time — no Python dependency.
