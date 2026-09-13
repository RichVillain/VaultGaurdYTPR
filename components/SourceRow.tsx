import Link from "next/link";
import type { Source } from "@/lib/types";
import { statusLabel, statusTone } from "./ui";

export function SourceRow({ source, selected, onSelect }: { source: Source; selected: boolean; onSelect: () => void }) {
  return (
    <div
      className={`group grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[#2b303b] px-4 py-4 transition-colors hover:bg-[#20232b] ${
        selected ? "bg-[#25252d]" : ""
      }`}
    >
      <button
        aria-label={`Select ${source.title}`}
        onClick={onSelect}
        className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
          selected ? "border-[#ef765e] bg-[#ef765e] text-[#191b20]" : "border-[#555c68] text-transparent"
        }`}
      >
        ✓
      </button>
      <Link href={`/library/${source.id}`} className="min-w-0 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium text-[#f4f0e8]">{source.title}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] ${statusTone(source.status)}`}>{statusLabel(source.status)}</span>
        </div>
        <p className="mt-1 truncate text-xs text-[#8f97a5]">
          {source.channel} · {source.duration} · added {source.added}
        </p>
        <div className="mt-2 flex gap-1.5">
          {source.tags.map((tag) => (
            <span key={tag} className="text-[10px] text-[#737b8a]">
              #{tag}
            </span>
          ))}
        </div>
      </Link>
      <Link href={`/library/${source.id}`} className="rounded-lg px-3 py-2 text-xs text-[#9ca3b0] opacity-80 transition hover:bg-[#30333d] hover:text-[#f4f0e8]">
        Open <span aria-hidden="true">↗</span>
      </Link>
    </div>
  );
}
