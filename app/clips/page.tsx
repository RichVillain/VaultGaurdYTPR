"use client";

import { useState } from "react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { SectionHeader, Pill } from "@/components/ui";

export default function ClipsPage() {
  const { sources, flash } = useWorkspace();
  const [sourceId, setSourceId] = useState("");
  const source = sources.find((s) => s.id === sourceId) ?? sources[0];

  return (
    <div className="space-y-7">
      <SectionHeader
        eyebrow="Clip studio"
        title="Pick the moment, keep the context."
        description="Clip rendering needs a connected media/transcript provider to cut real timestamps. This studio is wired up and ready for that connection."
      />
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="ytpr-panel overflow-hidden">
          <div className="ytpr-video-placeholder">
            <div className="ytpr-play">▶</div>
            <p className="mt-4 text-sm text-[#f4f0e8]">Preview placeholder</p>
            <p className="mt-1 text-xs text-[#8f97a5]">Connect a media/transcript provider to stream and cut real clips.</p>
          </div>
        </section>
        <section className="ytpr-panel p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#ef765e]">Source</p>
          <select value={source?.id ?? ""} onChange={(e) => setSourceId(e.target.value)} className="ytpr-input mt-3">
            {sources.length === 0 && <option value="">No sources yet</option>}
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          <div className="mt-5 space-y-2">
            {source?.videos.slice(0, 8).map((video) => (
              <div key={video.id} className="rounded-lg border border-[#303541] bg-[#20232b] p-3">
                <p className="truncate text-xs text-[#f4f0e8]">{video.title}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => flash("Clip rendering needs a connected media provider — none is configured yet.")}
            className="ytpr-secondary-button mt-5 w-full"
          >
            Queue clip
          </button>
          <div className="mt-5 border-t border-[#2b303b] pt-5">
            <p className="text-xs font-medium text-[#f4f0e8]">Output options</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill tone="accent">MP4 clip</Pill>
              <Pill>English SRT</Pill>
              <Pill>Social copy</Pill>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
