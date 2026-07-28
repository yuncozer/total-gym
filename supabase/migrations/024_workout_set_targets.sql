alter table public.workout_sets
  add column if not exists target_reps integer,
  add column if not exists target_weight_kg numeric,
  add column if not exists target_rpe numeric,
  add column if not exists rest_seconds integer,
  add column if not exists tempo text,
  add column if not exists trainer_note text;
