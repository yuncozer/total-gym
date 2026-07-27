create table if not exists public.trainer_clients (
  id uuid default gen_random_uuid() primary key,
  trainer_id uuid references public.trainers(user_id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  display_name text not null,
  email text,
  phone text,
  status text not null default 'invited' check (status in ('invited', 'active', 'paused', 'archived')),
  goal text,
  level text,
  start_date date,
  notes text,
  invite_token uuid default gen_random_uuid(),
  invited_at timestamptz default now(),
  accepted_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create unique index if not exists idx_trainer_clients_trainer_user
  on public.trainer_clients(trainer_id, user_id)
  where user_id is not null;

create index if not exists idx_trainer_clients_trainer on public.trainer_clients(trainer_id);
create index if not exists idx_trainer_clients_user on public.trainer_clients(user_id);
create unique index if not exists idx_trainer_clients_invite_token on public.trainer_clients(invite_token);

alter table public.trainer_clients enable row level security;

create policy "Trainers can manage their own clients"
  on public.trainer_clients for all
  using (auth.uid() = trainer_id)
  with check (auth.uid() = trainer_id);

create policy "Clients can view their own linked row"
  on public.trainer_clients for select
  using (auth.uid() = user_id);
