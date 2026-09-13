"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SectionHeader, Pill } from "@/components/ui";
import type { Source } from "@/lib/types";

export default function SourceDetailPage() {
  const params = useParams<{ id: string }>();
  const [source, setSource] = useState<Source | null | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/sources/${params.id}`)
      .then((res) => res.json())
      .then((data) => setSource(data.source ?? null));
  }, [params.id]);

  if (source === undefined) return <p className="text-sm text-[#8f97a5]">Loading…</p>;
  if (source === null) return <p className="text-sm text-[#8f97a5]">Source not found.</p>;

  return (
    <div className="space-y-7">
      <SectionHeader
        eyebrow="Source"
        title={source.title}
        description={`${source.videos.length} video${source.videos.length === 1 ? "" : "s"} · ${source.duration} total · ${source.clusters.length} topic clusters`}
        action={
          <a href={`/api/export/obsidian/${source.id}`} className="ytpr-primary-button" download>
            ⬇ Export Obsidian vault
          </a>
        }
      />
      <section className="ytpr-panel p-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#ef765e]">Topic clusters</p>
        <div className="mt-4 space-y-4">
          {source.clusters.map((cluster) => (
            <div key={cluster.name} className="rounded-lg border border-[#303541] bg-[#20232b] p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-[#f4f0e8]">{cluster.name}</h3>
                <Pill tone="accent">{cluster.videoIds.length} videos</Pill>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="ytpr-panel overflow-hidden">
        <div className="border-b border-[#2b303b] px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#ef765e]">All videos</p>
        </div>
        {source.videos.map((video) => (
          <div key={video.id} className="flex items-center justify-between gap-3 border-b border-[#2b303b] px-4 py-3 last:border-b-0">
            <div className="min-w-0">
              <p className="truncate text-sm text-[#f4f0e8]">{video.title}</p>
              <a href={video.url} target="_blank" rel="noreferrer" className="text-xs text-[#8de0ed]">
                {video.url}
              </a>
            </div>
            <span className="shrink-0 text-xs text-[#737b8a]">#{video.index}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
