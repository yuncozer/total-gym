alter table public.workout_sets add column muscle_group text;

create index if not exists idx_workout_sets_muscle_group on public.workout_sets (workout_id, muscle_group);
