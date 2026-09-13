"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Packet, Source } from "@/lib/types";

type WorkspaceState = {
  sources: Source[];
  selected: string[];
  notice: string;
  loading: boolean;
  installEvent: Event | null;
  packets: Packet[];
  toggleSelect: (id: string) => void;
  flash: (message: string) => void;
  refreshSources: () => Promise<void>;
  refreshPackets: () => Promise<void>;
  install: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceState | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [sources, setSources] = useState<Source[]>([]);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [installEvent, setInstallEvent] = useState<Event | null>(null);

  const refreshSources = useCallback(async () => {
    const res = await fetch("/api/sources");
    const data = await res.json();
    setSources(data.sources ?? []);
  }, []);

  const refreshPackets = useCallback(async () => {
    const res = await fetch("/api/packets");
    const data = await res.json();
    setPackets(data.packets ?? []);
  }, []);

  useEffect(() => {
    Promise.all([refreshSources(), refreshPackets()]).finally(() => setLoading(false));
  }, [refreshSources, refreshPackets]);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    window.addEventListener("beforeinstallprompt", handler);
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  }

  function toggleSelect(id: string) {
    setSelected((items) => (items.includes(id) ? items.filter((item) => item !== id) : [...items, id]));
  }

  async function install() {
    const prompt = installEvent as (Event & { prompt?: () => Promise<void> }) | null;
    if (prompt?.prompt) {
      await prompt.prompt();
      setInstallEvent(null);
    } else {
      flash("On iPhone: open Share, then choose Add to Home Screen.");
    }
  }

  return (
    <WorkspaceContext.Provider
      value={{
        sources,
        selected,
        notice,
        loading,
        installEvent,
        packets,
        toggleSelect,
        flash,
        refreshSources,
        refreshPackets,
        install,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
