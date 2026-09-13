"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkspace } from "./WorkspaceProvider";

const NAV = [
  { href: "/", label: "Workspace", short: "◎" },
  { href: "/collect", label: "Collect", short: "+" },
  { href: "/library", label: "Library", short: "▤" },
  { href: "/packets", label: "Research packets", short: "✦" },
  { href: "/clips", label: "Clip studio", short: "◫" },
  { href: "/repurpose", label: "Repurpose", short: "↗" },
  { href: "/insights", label: "Insights", short: "⌁" },
];

export function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { notice, flash, sources, installEvent, install } = useWorkspace();

  return (
    <div className="ytpr-shell">
      <div className="ytpr-topbar">
        <div className="flex items-center gap-3">
          <div className="ytpr-mark">V</div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-[#f4f0e8]">
              VaultGuard <span className="text-[#ef765e]">YTPR</span>
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#737b8a]">YouTube research workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-[#2c4b42] bg-[#183029] px-2.5 py-1 text-[10px] text-[#8bd4b0] sm:inline-flex">
            Gemini-powered
          </span>
          <button onClick={install} className="ytpr-quiet-button">
            {installEvent ? "Install app" : "Add to home screen"}
          </button>
        </div>
      </div>
      <div className="ytpr-layout">
        <aside className="ytpr-sidebar" aria-label="YTPR navigation">
          <div className="mb-5 px-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#727987]">Workspace</p>
            <p className="mt-1 text-xs text-[#b8bec9]">Research desk</p>
          </div>
          <nav className="space-y-1">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className={`ytpr-nav-item ${pathname === item.href ? "active" : ""}`}>
                <span className="ytpr-nav-glyph">{item.short}</span>
                <span>{item.label}</span>
                {item.href === "/library" && <span className="ml-auto text-[10px] text-[#6f7785]">{sources.length}</span>}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="ytpr-main">
          {notice && (
            <div role="status" className="ytpr-toast">
              {notice}
              <button onClick={() => flash("")} aria-label="Dismiss notification">
                ×
              </button>
            </div>
          )}
          {children}
          <div className="mt-10 border-t border-[#2b303b] pt-4 text-xs text-[#6e7684]">
            VaultGuard YTPR is source-aware by default. Extraction and research synthesis keep their provenance.
          </div>
        </main>
      </div>
    </div>
  );
}
