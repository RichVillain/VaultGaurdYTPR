"use client";

import Link from "next/link";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { SectionHeader } from "@/components/ui";
import { SourceRow } from "@/components/SourceRow";

export default function OverviewPage() {
  const { sources, packets, selected, toggleSelect, loading } = useWorkspace();

  const totalVideos = sources.reduce((sum, s) => sum + s.videos.length, 0);
  const totalClusters = sources.reduce((sum, s) => sum + s.clusters.length, 0);

  return (
    <div className="space-y-7">
      <SectionHeader
        eyebrow="Workspace"
        title="Turn a watchlist into a point of view."
        description="Collect source material, auto-cluster it by topic with Gemini, and shape the signal into research packets."
        action={
          <Link href="/collect" className="ytpr-primary-button">
            + Collect sources
          </Link>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [String(sources.length), "Sources collected"],
          [String(totalVideos), "Videos extracted"],
          [String(totalClusters), "Topic clusters"],
          [String(packets.length), "Research packets"],
        ].map(([value, label]) => (
          <div key={label} className="ytpr-stat">
            <p className="text-3xl font-semibold tracking-[-0.05em] text-[#f4f0e8]">{value}</p>
            <p className="mt-2 text-xs text-[#8f97a5]">{label}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="ytpr-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#2b303b] px-4 py-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#ef765e]">Active library</p>
              <h2 className="mt-1 text-lg font-medium text-[#f4f0e8]">Recently collected</h2>
            </div>
            <Link href="/library" className="text-xs text-[#8de0ed]">
              Open library →
            </Link>
          </div>
          {loading && <p className="p-6 text-sm text-[#8f97a5]">Loading…</p>}
          {!loading && sources.length === 0 && (
            <p className="p-6 text-sm text-[#8f97a5]">No sources yet. Start by collecting a playlist or video URL.</p>
          )}
          {sources.slice(0, 3).map((source) => (
            <SourceRow key={source.id} source={source} selected={selected.includes(source.id)} onSelect={() => toggleSelect(source.id)} />
          ))}
        </section>
        <section className="ytpr-panel p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#ef765e]">Next best action</p>
          <h2 className="mt-3 text-xl font-medium leading-tight text-[#f4f0e8]">Shape sources into a packet.</h2>
          <p className="mt-3 text-sm leading-6 text-[#9ca3b0]">
            Select two or more sources in the library, then generate a Gemini-synthesized research brief.
          </p>
          <Link href={selected.length >= 2 ? "/packets" : "/library"} className="ytpr-primary-button mt-6 w-full">
            {selected.length >= 2 ? `Build packet from ${selected.length} sources` : "Select sources in Library"} <span>↗</span>
          </Link>
        </section>
      </div>
    </div>
  );
}
