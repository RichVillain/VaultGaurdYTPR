import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { normalizeUrls } from "@/lib/youtube";
import { extractSource, formatDuration } from "@/lib/ytdlp";
import { clusterTopics } from "@/lib/gemini";
import { addSource } from "@/lib/store";
import type { Source } from "@/lib/types";

// Vercel Hobby's ceiling for a Node serverless function; large playlists
// (many videos, sequential yt-dlp calls per URL) could still exceed this,
// where Render's persistent process would not have.
export const maxDuration = 60;

/** Extracts and persists each submitted YouTube source, returning successes alongside per-URL failures. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const raw = typeof body?.urls === "string" ? body.urls : "";
  const urls = normalizeUrls(raw);

  if (!urls.length) {
    return NextResponse.json({ error: "Paste at least one YouTube URL or playlist URL." }, { status: 400 });
  }

  const created: Source[] = [];
  const errors: string[] = [];

  for (const url of urls) {
    try {
      const { title, videos } = await extractSource(url);
      if (!videos.length) {
        errors.push(`${url}: no videos found`);
        continue;
      }
      const clusters = await clusterTopics(videos);
      const totalSeconds = videos.reduce((sum, v) => sum + (v.duration ?? 0), 0);

      const source: Source = {
        id: randomUUID(),
        title,
        channel: videos[0]?.playlist === title ? "YouTube" : title,
        duration: formatDuration(totalSeconds),
        status: "transcript-ready",
        tags: clusters.slice(0, 3).map((c) => c.name.toLowerCase()),
        added: "Just now",
        transcript: `${videos.length} video${videos.length === 1 ? "" : "s"} extracted`,
        url,
        videos,
        clusters,
      };
      await addSource(source);
      created.push(source);
    } catch (err) {
      errors.push(`${url}: ${err instanceof Error ? err.message.slice(0, 200) : "extraction failed"}`);
    }
  }

  if (!created.length) {
    return NextResponse.json({ error: "No sources could be extracted.", details: errors }, { status: 400 });
  }

  return NextResponse.json({ sources: created, errors });
}
