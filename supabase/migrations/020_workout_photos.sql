-- Workout photos: store user-uploaded photos for completed workouts
create table if not exists public.workout_photos (
  id uuid default gen_random_uuid() primary key,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  storage_path text not null,
  created_at timestamp with time zone default now()
);

create index idx_workout_photos_workout on public.workout_photos(workout_id);

alter table public.workout_photos enable row level security;

-- Owner can read own photos
create policy "Users can view own workout photos"
  on public.workout_photos for select
  using (
    exists (
      select 1 from public.workouts
      where workouts.id = workout_photos.workout_id
        and workouts.user_id = auth.uid()
    )
  );

-- Owner can insert own photos
create policy "Users can insert own workout photos"
  on public.workout_photos for insert
  with check (
    exists (
      select 1 from public.workouts
      where workouts.id = workout_photos.workout_id
        and workouts.user_id = auth.uid()
    )
  );

-- Owner can delete own photos
create policy "Users can delete own workout photos"
  on public.workout_photos for delete
  using (
    exists (
      select 1 from public.workouts
      where workouts.id = workout_photos.workout_id
        and workouts.user_id = auth.uid()
    )
  );
