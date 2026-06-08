alter table public.exercises
add column if not exists muscle_group_id text;

create index if not exists idx_exercises_muscle_group_id
on public.exercises (muscle_group_id)
where muscle_group_id is not null and is_active = true;
