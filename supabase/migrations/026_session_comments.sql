create table if not exists public.session_comments (
  id uuid default gen_random_uuid() primary key,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  author_id uuid references auth.users(id) not null,
  body text not null,
  created_at timestamptz default now() not null,
  read_at timestamptz
);

create index if not exists idx_session_comments_workout on public.session_comments(workout_id, created_at);

alter table public.session_comments enable row level security;

create policy "Workout owner or their trainer can view comments"
  on public.session_comments for select
  using (
    exists (select 1 from public.workouts w where w.id = session_comments.workout_id and w.user_id = auth.uid())
    or exists (
      select 1 from public.workouts w
      join public.trainer_clients tc on tc.user_id = w.user_id and tc.status = 'active'
      where w.id = session_comments.workout_id and tc.trainer_id = auth.uid()
    )
  );

create policy "Workout owner or their trainer can insert comments"
  on public.session_comments for insert
  with check (
    author_id = auth.uid()
    and (
      exists (select 1 from public.workouts w where w.id = session_comments.workout_id and w.user_id = auth.uid())
      or exists (
        select 1 from public.workouts w
        join public.trainer_clients tc on tc.user_id = w.user_id and tc.status = 'active'
        where w.id = session_comments.workout_id and tc.trainer_id = auth.uid()
      )
    )
  );

create policy "Workout owner can mark comments read"
  on public.session_comments for update
  using (exists (select 1 from public.workouts w where w.id = session_comments.workout_id and w.user_id = auth.uid()))
  with check (exists (select 1 from public.workouts w where w.id = session_comments.workout_id and w.user_id = auth.uid()));
