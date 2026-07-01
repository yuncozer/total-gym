create table if not exists public.shared_workouts (
  id uuid default gen_random_uuid() primary key,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  token uuid default gen_random_uuid() not null unique,
  created_at timestamptz default now() not null,
  expires_at timestamptz not null,
  view_count integer default 0 not null
);

create index if not exists idx_shared_workouts_token on public.shared_workouts(token);

alter table public.shared_workouts enable row level security;

create policy "Users can insert shared_workouts for own workouts"
  on public.shared_workouts for insert
  with check (
    exists (
      select 1 from public.workouts
      where id = workout_id and user_id = auth.uid()
    )
  );

create policy "Users can view own shared_workouts"
  on public.shared_workouts for select
  using (
    exists (
      select 1 from public.workouts
      where id = workout_id and user_id = auth.uid()
    )
  );

create policy "Users can delete own shared_workouts"
  on public.shared_workouts for delete
  using (
    exists (
      select 1 from public.workouts
      where id = workout_id and user_id = auth.uid()
    )
  );
