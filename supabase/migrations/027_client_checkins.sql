create table if not exists public.client_checkins (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.trainer_clients(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  weight_kg numeric,
  waist_cm numeric,
  chest_cm numeric,
  arm_cm numeric,
  thigh_cm numeric,
  notes text,
  created_at timestamptz default now() not null
);

create index if not exists idx_client_checkins_client on public.client_checkins(client_id, created_at);
create index if not exists idx_client_checkins_user on public.client_checkins(user_id, created_at);

alter table public.client_checkins enable row level security;

create policy "Clients can manage their own check-ins"
  on public.client_checkins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Trainers can view their clients' check-ins"
  on public.client_checkins for select
  using (
    exists (
      select 1 from public.trainer_clients tc
      where tc.id = client_checkins.client_id and tc.trainer_id = auth.uid()
    )
  );
