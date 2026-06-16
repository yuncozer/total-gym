-- Add gamification columns to profiles
alter table public.profiles
  add column if not exists xp integer not null default 0,
  add column if not exists level integer not null default 1;

-- Function to recalculate XP from completed sets
create or replace function public.calculate_user_xp(p_user_id uuid)
returns table (xp integer, level integer) as $$
declare
  v_sets integer;
  v_workouts integer;
  v_xp integer;
  v_level integer;
begin
  select count(*)::integer into v_sets
  from public.workout_sets ws
  join public.workouts w on w.id = ws.workout_id
  where w.user_id = p_user_id
    and ws.is_completed = true;

  select count(*)::integer into v_workouts
  from public.workouts
  where user_id = p_user_id
    and completed_at is not null;

  v_xp := v_sets * 10 + v_workouts * 25;
  v_level := floor(sqrt(v_xp::float / 100))::integer + 1;

  update public.profiles
  set xp = v_xp, level = v_level
  where id = p_user_id;

  return query select v_xp, v_level;
end;
$$ language plpgsql security definer;
