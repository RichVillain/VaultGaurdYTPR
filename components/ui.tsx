import type { ReactNode } from "react";
import type { SourceStatus } from "@/lib/types";

export function statusTone(status: SourceStatus) {
  if (status === "complete") return "text-[#85d9ad] bg-[#173a2a]";
  if (status === "transcript-ready") return "text-[#77d9ee] bg-[#143746]";
  if (status === "needs-attention") return "text-[#ffb27a] bg-[#432817]";
  return "text-[#b9b1ff] bg-[#29254b]";
}

export function statusLabel(status: SourceStatus) {
  return { complete: "Complete", "transcript-ready": "Transcript ready", "needs-attention": "Needs attention", queued: "Queued" }[status];
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-[#2b303b] pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ef765e]">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#f4f0e8] md:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9ca3b0]">{description}</p>
      </div>
      {action}
    </header>
  );
}

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "accent" | "warm" }) {
  const styles =
    tone === "accent"
      ? "border-[#2b6571] bg-[#13323b] text-[#8de0ed]"
      : tone === "warm"
      ? "border-[#744535] bg-[#3d251d] text-[#ffb27a]"
      : "border-[#343946] bg-[#20242d] text-[#aeb5c2]";
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] ${styles}`}>{children}</span>;
}
