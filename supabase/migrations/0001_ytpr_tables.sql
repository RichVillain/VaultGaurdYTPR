-- VaultGuard YTPR: sources and research packets.
--
-- Idempotent: safe to re-run.

create table if not exists public.ytpr_sources (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  channel     text not null,
  duration    text not null,
  status      text not null,
  tags        text[] not null default '{}',
  added       text not null,
  transcript  text not null,
  url         text not null,
  videos      jsonb not null default '[]'::jsonb,
  clusters    jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists public.ytpr_packets (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  question    text not null,
  source_ids  text[] not null default '{}',
  brief       text not null,
  created_at  timestamptz not null default now()
);

alter table public.ytpr_sources enable row level security;
alter table public.ytpr_packets enable row level security;

comment on table public.ytpr_sources is 'VaultGuard YTPR collected sources.';
comment on table public.ytpr_packets is 'VaultGuard YTPR generated research packets.';
