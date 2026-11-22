-- SabiCare: saved birth plans for signed-in users.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

create table if not exists public.plans (
  id text primary key,              -- keyed hash of the user's login id (no emails stored)
  payload text not null,            -- AES-256-GCM ciphertext of the profile and birth plan
  updated_at timestamptz not null default now()
);

-- Row-level security on, with no policies: the public key can read or write nothing.
-- Only the app's server, using the secret key, can reach this table.
alter table public.plans enable row level security;
