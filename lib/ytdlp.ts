import youtubedl from "youtube-dl-exec";
import type { Video } from "./types";

type FlatEntry = {
  id?: string;
  title?: string;
  duration?: number | null;
};

type FlatResult = {
  title?: string;
  id?: string;
  entries?: (FlatEntry | null)[];
};

/** yt-dlp-exec resolves to parsed JSON when it can, or a raw stdout string otherwise. */
function asJson(result: unknown): FlatResult {
  if (typeof result === "string") return JSON.parse(result);
  return result as FlatResult;
}

/**
 * Flat-extracts a playlist (or a single video treated as a one-item playlist)
 * without downloading media or requiring ffmpeg — just the listing.
 */
export async function extractSource(url: string): Promise<{ title: string; id: string; videos: Video[] }> {
  const raw = await youtubedl(url, {
    dumpSingleJson: true,
    noWarnings: true,
    flatPlaylist: true,
    noCallHome: true,
    noCheckCertificate: true,
  } as Record<string, unknown>);

  const data = asJson(raw);
  const title = data.title ?? data.id ?? "Untitled";
  const id = data.id ?? url;
  const entries = data.entries?.length ? data.entries : [{ id: data.id, title: data.title }];

  const videos: Video[] = [];
  entries.forEach((entry, index) => {
    if (!entry?.id) return;
    videos.push({
      index: index + 1,
      id: entry.id,
      title: entry.title || `Video ${entry.id}`,
      url: `https://www.youtube.com/watch?v=${entry.id}`,
      duration: entry.duration ?? null,
      playlist: title,
    });
  });

  return { title, id, videos };
}

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export { formatDuration };
