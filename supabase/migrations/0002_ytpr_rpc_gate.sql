-- Close direct-table access and route everything through a shared-secret
-- gate. The Supabase anon key is public by design (RLS is the real
-- boundary, not key secrecy) — an open "using (true)" policy paired with it
-- means anyone holding the key can read/write these tables directly via
-- PostgREST, bypassing the app entirely.
--
-- Idempotent: safe to re-run. Does NOT set the secret itself — see
-- "Database setup" in README.md for that one-time step, which you run
-- with your own YTPR_ACCESS_KEY so a checked-in migration never contains
-- anyone's actual secret (or its hash) baked in.

create extension if not exists pgcrypto;

drop policy if exists ytpr_sources_anon_all on public.ytpr_sources;
drop policy if exists ytpr_packets_anon_all on public.ytpr_packets;
-- RLS stays enabled with zero policies: default-deny for anon/authenticated
-- on direct table access. Only the functions below can reach these rows.

create table if not exists public.ytpr_config (
  key   text primary key,
  value text not null
);
alter table public.ytpr_config enable row level security;
-- No policies here either — config is readable only from inside
-- SECURITY DEFINER functions, never directly by anon/authenticated.

create or replace function public.ytpr_check_secret(secret text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  expected text;
begin
  select value into expected from public.ytpr_config where key = 'access_key_sha256';
  if expected is null or secret is null or encode(digest(secret, 'sha256'), 'hex') <> expected then
    raise exception 'unauthorized';
  end if;
end;
$$;

revoke all on function public.ytpr_check_secret(text) from public, anon, authenticated;
-- Only the functions below call it; it is not itself exposed to PostgREST.

create or replace function public.ytpr_list_sources(secret text)
returns setof public.ytpr_sources
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.ytpr_check_secret(secret);
  return query select * from public.ytpr_sources order by created_at desc;
end;
$$;

create or replace function public.ytpr_get_source(secret text, p_id uuid)
returns setof public.ytpr_sources
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.ytpr_check_secret(secret);
  return query select * from public.ytpr_sources where id = p_id;
end;
$$;

create or replace function public.ytpr_add_source(
  secret text,
  p_id uuid,
  p_title text,
  p_channel text,
  p_duration text,
  p_status text,
  p_tags text[],
  p_added text,
  p_transcript text,
  p_url text,
  p_videos jsonb,
  p_clusters jsonb
)
returns setof public.ytpr_sources
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.ytpr_check_secret(secret);
  return query
    insert into public.ytpr_sources (id, title, channel, duration, status, tags, added, transcript, url, videos, clusters)
    values (p_id, p_title, p_channel, p_duration, p_status, p_tags, p_added, p_transcript, p_url, p_videos, p_clusters)
    returning *;
end;
$$;

create or replace function public.ytpr_list_packets(secret text)
returns setof public.ytpr_packets
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.ytpr_check_secret(secret);
  return query select * from public.ytpr_packets order by created_at desc;
end;
$$;

create or replace function public.ytpr_add_packet(
  secret text,
  p_id uuid,
  p_title text,
  p_question text,
  p_source_ids text[],
  p_brief text,
  p_created_at timestamptz
)
returns setof public.ytpr_packets
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.ytpr_check_secret(secret);
  return query
    insert into public.ytpr_packets (id, title, question, source_ids, brief, created_at)
    values (p_id, p_title, p_question, p_source_ids, p_brief, p_created_at)
    returning *;
end;
$$;

grant execute on function public.ytpr_list_sources(text) to anon, authenticated;
grant execute on function public.ytpr_get_source(text, uuid) to anon, authenticated;
grant execute on function public.ytpr_add_source(text, uuid, text, text, text, text, text[], text, text, text, jsonb, jsonb) to anon, authenticated;
grant execute on function public.ytpr_list_packets(text) to anon, authenticated;
grant execute on function public.ytpr_add_packet(text, uuid, text, text, text[], text, timestamptz) to anon, authenticated;
