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

Also requires `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `YTPR_ACCESS_KEY` —
workspace storage runs through Supabase (see Data model below), not a local
file, so these are required, not optional; without them, collecting a
source or generating a packet will fail.

```
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash-lite   # optional, this is the default
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
YTPR_ACCESS_KEY=...                  # shared secret gating the Supabase RPC functions below
PORT=3000                            # optional, mainly for local/Render use
```

## Data model

Workspace state (`ytpr_sources`, `ytpr_packets`) lives in Postgres via
Supabase. This app deploys as Vercel serverless functions — no persistent
process and no shared filesystem between invocations — so state can't live
in memory or a local JSON file the way a single long-running server could
hold it.

The tables have RLS enabled with **no policies** (default-deny for
`anon`/`authenticated`): direct table access via PostgREST is blocked
entirely. All reads and writes go through `SECURITY DEFINER` RPC functions
(`ytpr_list_sources`, `ytpr_add_source`, etc. — see the `ytpr_rpc_gate`
migration) that check `YTPR_ACCESS_KEY` as a SHA-256 hash before touching
any row. This matters because the Supabase anon key is public by design
(RLS is the real boundary, not key secrecy) — an earlier version of this
app paired the anon key with an open `using (true)` policy, which meant
anyone holding that key could read or write these tables directly,
bypassing the app (and its Vercel deployment protection) entirely.

This is still a single-operator tool with one shared secret, not per-user
auth — there's no concept of "whose" source or packet a row is. That would
need real multi-user auth (Supabase Auth, most likely) before this became a
multi-tenant product.

### Database setup

Run the migrations in `supabase/migrations/` against your Supabase project
(in order — via the SQL editor, the Supabase CLI, or `apply_migration`).
They create the tables and the RPC gate, but deliberately do **not** set
your secret — a checked-in migration should never contain anyone's actual
key or its hash. After running them, set it once:

```sql
insert into public.ytpr_config (key, value)
values ('access_key_sha256', encode(digest('YOUR_YTPR_ACCESS_KEY', 'sha256'), 'hex'))
on conflict (key) do update set value = excluded.value;
```

Use the exact same value for `YTPR_ACCESS_KEY` in your Vercel/Render
environment variables — the app hashes it the same way to compare.

## VaultGuard RR3 relationship

`vaultgaurd-RR3-Protocol` is the companion protocol repository with its own
guardrailed ingest service and Postgres/pgvector persistence. This app does
not yet call into it — that integration (a server-side `ProjectStore`
adapter preserving source URLs, timestamps, and packet metadata) is a
follow-up, not part of this rebuild.

## Deploy

Deploys to Vercel (git-linked; auto-builds on push to `main`) as Node
serverless functions. `youtube-dl-exec` fetches a standalone `yt-dlp` binary
at install time — no Python dependency — but Next.js's output file tracing
doesn't follow `child_process`-invoked binaries, so `next.config.js`
explicitly includes it (`outputFileTracingIncludes`) for the `/api/collect`
function; without that it can be missing from the deployed bundle.

Collect/packet/repurpose routes set `maxDuration = 60`, this app's own
configured cap (not a hard platform ceiling — Vercel's actual limits vary
by plan and compute mode) since yt-dlp extraction and Gemini calls can run
long; a large playlist could still exceed it, which a persistent server
(e.g. Render) would not hit. Can also run as a single Node web service
(`npm install && npm run build`, `npm start`) if that matters more than
serverless for your use case — the Supabase-backed store works the same
either way.

This project's Vercel deployment protection (Vercel Authentication) is
already enabled for all non-custom-domain URLs, which is the actual
mitigation for "any internet caller can trigger Gemini/yt-dlp work" — worth
knowing before attaching a custom domain, which bypasses it unless
reconfigured.
