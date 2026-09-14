import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Packet, Source } from "./types";

type Workspace = {
  sources: Source[];
  packets: Packet[];
};

const DATA_DIR = process.env.YTPR_DATA_DIR || join(process.cwd(), "data");
const DATA_FILE = join(DATA_DIR, "workspace.json");

function load(): Workspace {
  try {
    if (existsSync(DATA_FILE)) {
      return JSON.parse(readFileSync(DATA_FILE, "utf8"));
    }
  } catch {
    // Corrupt or unreadable state file: start clean rather than crash the server.
  }
  return { sources: [], packets: [] };
}

// Module-level singleton: this Next.js server runs as one persistent Node
// process (not serverless), so an in-memory store is valid for the process
// lifetime, backed by a JSON file so a restart doesn't lose everything.
const state: Workspace = load();

function persist() {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
  } catch {
    // Best-effort persistence. An ephemeral disk (e.g. a fresh container) is a
    // normal state for this app; in-memory data still serves the process.
  }
}

export function listSources(): Source[] {
  return state.sources;
}

export function getSource(id: string): Source | undefined {
  return state.sources.find((s) => s.id === id);
}

export function addSource(source: Source) {
  state.sources = [source, ...state.sources.filter((s) => s.id !== source.id)];
  persist();
  return source;
}

export function updateSource(id: string, patch: Partial<Source>) {
  const source = getSource(id);
  if (!source) return undefined;
  Object.assign(source, patch);
  persist();
  return source;
}

export function listPackets(): Packet[] {
  return state.packets;
}

export function addPacket(packet: Packet) {
  state.packets = [packet, ...state.packets];
  persist();
  return packet;
}

if (!existsSync(dirname(DATA_FILE))) {
  try {
    mkdirSync(dirname(DATA_FILE), { recursive: true });
  } catch {
    // ignore — persist() will retry and no-op safely if this keeps failing
  }
}
