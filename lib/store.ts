import { createClient } from "@supabase/supabase-js";
import type { Packet, Source } from "./types";

// Vercel serverless functions are stateless between invocations — no
// persistent process, no shared filesystem. The v2 (Render) build used an
// in-memory store backed by a JSON file, which is valid only for a single
// long-lived Node process. Deployed on Vercel, that state would vanish (or
// diverge) between requests, so this reads/writes Postgres via Supabase's
// REST API instead — no DATABASE_URL needed, just the public anon key,
// which is safe to use because these calls only ever run server-side inside
// route handlers, never in a client bundle.
function client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set for storage to work.");
  }
  return createClient(url, key);
}

type SourceRow = {
  id: string;
  title: string;
  channel: string;
  duration: string;
  status: Source["status"];
  tags: string[];
  added: string;
  transcript: string;
  url: string;
  videos: Source["videos"];
  clusters: Source["clusters"];
};

function fromRow(row: SourceRow): Source {
  const { id, title, channel, duration, status, tags, added, transcript, url, videos, clusters } = row;
  return { id, title, channel, duration, status, tags, added, transcript, url, videos, clusters };
}

export async function listSources(): Promise<Source[]> {
  const { data, error } = await client().from("ytpr_sources").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function getSource(id: string): Promise<Source | undefined> {
  const { data, error } = await client().from("ytpr_sources").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data) : undefined;
}

export async function addSource(source: Source): Promise<Source> {
  const { id, ...rest } = source;
  const { data, error } = await client().from("ytpr_sources").insert({ id, ...rest }).select().single();
  if (error) throw new Error(error.message);
  return fromRow(data);
}

export async function listPackets(): Promise<Packet[]> {
  const { data, error } = await client().from("ytpr_packets").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    question: row.question,
    sourceIds: row.source_ids,
    brief: row.brief,
    createdAt: row.created_at,
  }));
}

export async function addPacket(packet: Packet): Promise<Packet> {
  const { data, error } = await client()
    .from("ytpr_packets")
    .insert({
      id: packet.id,
      title: packet.title,
      question: packet.question,
      source_ids: packet.sourceIds,
      brief: packet.brief,
      created_at: packet.createdAt,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.id,
    title: data.title,
    question: data.question,
    sourceIds: data.source_ids,
    brief: data.brief,
    createdAt: data.created_at,
  };
}
