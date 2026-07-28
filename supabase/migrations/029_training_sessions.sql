create table if not exists public.training_sessions (
  id uuid default gen_random_uuid() primary key,
  trainer_id uuid references public.trainers(user_id) on delete cascade not null,
  client_id uuid references public.trainer_clients(id) on delete cascade not null,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'no_show', 'cancelled')),
  location text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_training_sessions_trainer on public.training_sessions(trainer_id, scheduled_at);
create index if not exists idx_training_sessions_client on public.training_sessions(client_id, scheduled_at);

alter table public.training_sessions enable row level security;

create policy "Trainers can manage their own sessions"
  on public.training_sessions for all
  using (auth.uid() = trainer_id)
  with check (auth.uid() = trainer_id);

create policy "Clients can view their own sessions"
  on public.training_sessions for select
  using (
    exists (
      select 1 from public.trainer_clients tc
      where tc.id = training_sessions.client_id and tc.user_id = auth.uid()
    )
  );
