-- Add cardio-specific columns to workout_sets
alter table public.workout_sets
  add column if not exists is_cardio boolean default false,
  add column if not exists distance_km numeric,
  add column if not exists duration_minutes numeric;
