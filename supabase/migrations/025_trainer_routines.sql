create table if not exists public.trainer_routines (
  id uuid default gen_random_uuid() primary key,
  trainer_id uuid references public.trainers(user_id) on delete cascade not null,
  name text not null,
  description text,
  goal text,
  exercises jsonb not null default '[]'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_trainer_routines_trainer on public.trainer_routines(trainer_id);

alter table public.trainer_routines enable row level security;

create policy "Trainers can manage their own routines"
  on public.trainer_routines for all
  using (auth.uid() = trainer_id)
  with check (auth.uid() = trainer_id);

create table if not exists public.routine_assignments (
  id uuid default gen_random_uuid() primary key,
  routine_id uuid references public.trainer_routines(id) on delete cascade not null,
  client_id uuid references public.trainer_clients(id) on delete cascade not null,
  trainer_id uuid references public.trainers(user_id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_routine_assignments_trainer on public.routine_assignments(trainer_id);
create index if not exists idx_routine_assignments_user on public.routine_assignments(user_id);
create unique index if not exists idx_routine_assignments_active_client
  on public.routine_assignments(client_id)
  where status = 'active';

alter table public.routine_assignments enable row level security;

create policy "Trainers can manage their own assignments"
  on public.routine_assignments for all
  using (auth.uid() = trainer_id)
  with check (auth.uid() = trainer_id);

create policy "Clients can view their own assignment"
  on public.routine_assignments for select
  using (auth.uid() = user_id);

alter table public.workouts
  add column if not exists assignment_id uuid references public.routine_assignments(id) on delete set null;

create index if not exists idx_workouts_assignment on public.workouts(assignment_id) where assignment_id is not null;
