"use client";

import { useWorkspace } from "@/components/WorkspaceProvider";
import { SectionHeader, Pill } from "@/components/ui";

export default function InsightsPage() {
  const { sources, packets } = useWorkspace();
  const totalVideos = sources.reduce((sum, s) => sum + s.videos.length, 0);
  const totalClusters = sources.reduce((sum, s) => sum + s.clusters.length, 0);

  return (
    <div className="space-y-7">
      <SectionHeader
        eyebrow="Insights / operations"
        title="See where the signal is moving."
        description="Real counts from this workspace's own data — no vanity metrics."
        action={<Pill>All time</Pill>}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [String(sources.length), "Sources"],
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
      <section className="ytpr-panel overflow-hidden">
        <div className="border-b border-[#2b303b] px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#ef765e]">Sources by size</p>
        </div>
        {sources.length === 0 && <p className="p-6 text-sm text-[#8f97a5]">No sources yet.</p>}
        {sources.map((source) => (
          <div key={source.id} className="flex items-center justify-between border-b border-[#2b303b] px-4 py-3 last:border-b-0">
            <p className="truncate text-sm text-[#f4f0e8]">{source.title}</p>
            <div className="flex shrink-0 items-center gap-4 text-xs text-[#8f97a5]">
              <span>{source.videos.length} videos</span>
              <span>{source.clusters.length} clusters</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
