create table if not exists public.trainer_progress_shares (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.trainer_clients(id) on delete cascade not null,
  trainer_id uuid references public.trainers(user_id) on delete cascade not null,
  token uuid default gen_random_uuid() not null unique,
  created_at timestamptz default now() not null,
  expires_at timestamptz not null,
  view_count integer default 0 not null
);

create index if not exists idx_trainer_progress_shares_token on public.trainer_progress_shares(token);
create index if not exists idx_trainer_progress_shares_client on public.trainer_progress_shares(client_id);

alter table public.trainer_progress_shares enable row level security;

create policy "Trainers can manage their own progress shares"
  on public.trainer_progress_shares for all
  using (auth.uid() = trainer_id)
  with check (auth.uid() = trainer_id);
