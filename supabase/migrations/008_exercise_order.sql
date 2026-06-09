alter table public.workout_sets add column exercise_order integer;

create index if not exists idx_workout_sets_order on public.workout_sets (workout_id, exercise_order, set_number);
