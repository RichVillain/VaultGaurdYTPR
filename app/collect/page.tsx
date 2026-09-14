"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { SectionHeader, Pill } from "@/components/ui";

export default function CollectPage() {
  const [urls, setUrls] = useState("");
  const [busy, setBusy] = useState(false);
  const { flash, refreshSources } = useWorkspace();
  const router = useRouter();

  async function extract() {
    if (!urls.trim()) {
      flash("Paste at least one YouTube URL to add it to the intake queue.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      const data = await res.json();
      if (!res.ok) {
        flash(data.error || "Extraction failed.");
        return;
      }
      await refreshSources();
      flash(`${data.sources.length} source${data.sources.length === 1 ? "" : "s"} extracted and clustered.`);
      setUrls("");
      router.push("/library");
    } catch {
      flash("Extraction failed. Check the URLs and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-7">
      <SectionHeader
        eyebrow="Collect / intake queue"
        title="Bring the watchlist in."
        description="Paste videos, Shorts, or playlists. Extraction runs server-side via yt-dlp; Gemini clusters the results by topic as soon as they land."
      />
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="ytpr-panel p-5">
          <label htmlFor="urls" className="text-xs font-medium text-[#f4f0e8]">
            YouTube URLs
          </label>
          <textarea
            id="urls"
            value={urls}
            onChange={(event) => setUrls(event.target.value)}
            placeholder={"https://youtube.com/watch?v=...\nhttps://youtube.com/playlist?list=..."}
            className="ytpr-textarea mt-3"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={extract} disabled={busy} className="ytpr-primary-button disabled:opacity-60">
              {busy ? "Extracting…" : "Extract + cluster"} <span>↗</span>
            </button>
            <button onClick={() => setUrls("")} className="ytpr-secondary-button">
              Clear
            </button>
          </div>
          <p className="mt-4 text-xs leading-5 text-[#737b8a]">
            Extraction and clustering run on the server. The browser never touches extractor credentials.
          </p>
        </section>
        <section className="ytpr-panel p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#ef765e]">Intake rules</p>
          <div className="mt-5 space-y-4">
            {[
              ["Real extraction", "yt-dlp resolves playlist and video metadata server-side, no mocked data."],
              ["Gemini clustering", "Titles are grouped into named topic branches by the Gemini API, not TF-IDF."],
              ["Explicit costs", "Extraction and synthesis remain deliberate, user-triggered actions."],
              ["Provenance first", "Every source keeps its original URL and video IDs."],
            ].map(([title, body]) => (
              <div key={title} className="flex gap-3">
                <span className="mt-1 text-[#ef765e]">◈</span>
                <div>
                  <p className="text-sm text-[#f4f0e8]">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-[#8f97a5]">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="ytpr-panel p-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#ef765e]">Supported inputs</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Pill tone="accent">Video URL</Pill>
          <Pill tone="accent">Shorts URL</Pill>
          <Pill tone="accent">Playlist URL</Pill>
          <Pill>Multiline paste</Pill>
        </div>
      </div>
    </div>
  );
}
