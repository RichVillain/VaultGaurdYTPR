import { createClient } from "@supabase/supabase-js";
import type { Packet, Source } from "./types";

// Vercel serverless functions are stateless between invocations — no
// persistent process, no shared filesystem — so this reads/writes Postgres
// via Supabase's REST API rather than an in-memory/file store.
//
// It does NOT use plain table access with the anon key. The anon key is
// public by Supabase's own design (RLS is the real boundary, not key
// secrecy), and an earlier version of this file paired it with an open
// "using (true)" RLS policy — meaning anyone holding that key could read or
// write these tables directly via PostgREST, bypassing this app (and its
// Vercel auth) entirely. The tables now have zero policies (RLS enabled,
// default-deny), and all access goes through SECURITY DEFINER RPC functions
// gated by YTPR_ACCESS_KEY — a secret that lives only in this server's
// environment and is never sent to the client.
function client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set for storage to work.");
  }
  return createClient(url, key);
}

function secret() {
  const value = process.env.YTPR_ACCESS_KEY;
  if (!value) throw new Error("YTPR_ACCESS_KEY must be set for storage to work.");
  return value;
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
  const { data, error } = await client().rpc("ytpr_list_sources", { secret: secret() });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function getSource(id: string): Promise<Source | undefined> {
  const { data, error } = await client().rpc("ytpr_get_source", { secret: secret(), p_id: id });
  if (error) throw new Error(error.message);
  return data?.[0] ? fromRow(data[0]) : undefined;
}

export async function addSource(source: Source): Promise<Source> {
  const { data, error } = await client().rpc("ytpr_add_source", {
    secret: secret(),
    p_id: source.id,
    p_title: source.title,
    p_channel: source.channel,
    p_duration: source.duration,
    p_status: source.status,
    p_tags: source.tags,
    p_added: source.added,
    p_transcript: source.transcript,
    p_url: source.url,
    p_videos: source.videos,
    p_clusters: source.clusters,
  });
  if (error) throw new Error(error.message);
  return fromRow(data[0]);
}

export async function listPackets(): Promise<Packet[]> {
  const { data, error } = await client().rpc("ytpr_list_packets", { secret: secret() });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: { id: string; title: string; question: string; source_ids: string[]; brief: string; created_at: string }) => ({
    id: row.id,
    title: row.title,
    question: row.question,
    sourceIds: row.source_ids,
    brief: row.brief,
    createdAt: row.created_at,
  }));
}

export async function addPacket(packet: Packet): Promise<Packet> {
  const { data, error } = await client().rpc("ytpr_add_packet", {
    secret: secret(),
    p_id: packet.id,
    p_title: packet.title,
    p_question: packet.question,
    p_source_ids: packet.sourceIds,
    p_brief: packet.brief,
    p_created_at: packet.createdAt,
  });
  if (error) throw new Error(error.message);
  const row = data[0];
  return {
    id: row.id,
    title: row.title,
    question: row.question,
    sourceIds: row.source_ids,
    brief: row.brief,
    createdAt: row.created_at,
  };
}
