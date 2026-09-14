"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { SectionHeader } from "@/components/ui";
import { SourceRow } from "@/components/SourceRow";

export default function LibraryPage() {
  const { sources, selected, toggleSelect, loading } = useWorkspace();
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () =>
      sources.filter((source) =>
        `${source.title} ${source.channel} ${source.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())
      ),
    [sources, query]
  );

  return (
    <div className="space-y-7">
      <SectionHeader
        eyebrow="Library / source control"
        title="Every source, one working set."
        description="Search by title, creator, or tag. Select sources to build a research packet, or open one to browse its clusters and export it."
        action={
          <Link href="/collect" className="ytpr-primary-button">
            + Add sources
          </Link>
        }
      />
      <section className="ytpr-panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#2b303b] p-4 sm:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search sources, creators, tags…"
            className="ytpr-input flex-1"
          />
          <button onClick={() => setQuery("")} className="ytpr-secondary-button">
            Reset
          </button>
          <span className="self-center text-xs text-[#737b8a]">{selected.length} selected</span>
        </div>
        {loading && <div className="p-10 text-center text-sm text-[#8f97a5]">Loading…</div>}
        {!loading && visible.map((source) => (
          <SourceRow key={source.id} source={source} selected={selected.includes(source.id)} onSelect={() => toggleSelect(source.id)} />
        ))}
        {!loading && visible.length === 0 && <div className="p-10 text-center text-sm text-[#8f97a5]">No sources match that search.</div>}
      </section>
    </div>
  );
}
