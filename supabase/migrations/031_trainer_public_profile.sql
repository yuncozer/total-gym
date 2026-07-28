alter table public.trainers
  add column if not exists public_slug text unique;

create index if not exists idx_trainers_public_slug on public.trainers(public_slug);
