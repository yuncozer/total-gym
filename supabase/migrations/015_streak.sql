-- Add streak columns to profiles
alter table public.profiles
  add column if not exists current_streak integer not null default 0,
  add column if not exists longest_streak integer not null default 0;

-- Function to calculate streak for a user
create or replace function public.calculate_streak(p_user_id uuid)
returns integer as $$
declare
  v_streak integer := 0;
  v_last_date date;
  v_current_date date := current_date;
  r record;
begin
  for r in
    select distinct (w.completed_at at time zone 'utc')::date as workout_date
    from public.workouts w
    where w.user_id = p_user_id
      and w.completed_at is not null
    order by workout_date desc
  loop
    if v_streak = 0 then
      if r.workout_date = v_current_date or r.workout_date = v_current_date - 1 then
        v_streak := 1;
        v_last_date := r.workout_date;
      else
        exit;
      end if;
    else
      if v_last_date - 1 = r.workout_date then
        v_streak := v_streak + 1;
        v_last_date := r.workout_date;
      else
        exit;
      end if;
    end if;
  end loop;

  return v_streak;
end;
$$ language plpgsql security definer;

-- Function to calculate longest streak for a user
create or replace function public.calculate_longest_streak(p_user_id uuid)
returns integer as $$
declare
  v_longest integer := 0;
  v_current integer := 0;
  v_prev_date date;
  r record;
begin
  for r in
    select distinct (w.completed_at at time zone 'utc')::date as workout_date
    from public.workouts w
    where w.user_id = p_user_id
      and w.completed_at is not null
    order by workout_date asc
  loop
    if v_prev_date is null then
      v_current := 1;
    elsif r.workout_date = v_prev_date + 1 then
      v_current := v_current + 1;
    elsif r.workout_date > v_prev_date + 1 then
      if v_current > v_longest then
        v_longest := v_current;
      end if;
      v_current := 1;
    end if;
    v_prev_date := r.workout_date;
  end loop;

  if v_current > v_longest then
    v_longest := v_current;
  end if;

  return v_longest;
end;
$$ language plpgsql security definer;

-- Updated function to sync all gamification data (xp + level + streak)
create or replace function public.sync_gamification(p_user_id uuid)
returns table (xp integer, level integer, current_streak integer, longest_streak integer) as $$
declare
  v_sets integer;
  v_workouts integer;
  v_xp integer;
  v_level integer;
  v_streak integer;
  v_longest integer;
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

  select public.calculate_streak(p_user_id) into v_streak;
  select public.calculate_longest_streak(p_user_id) into v_longest;

  update public.profiles
  set xp = v_xp,
      level = v_level,
      current_streak = v_streak,
      longest_streak = v_longest
  where id = p_user_id;

  return query select v_xp, v_level, v_streak, v_longest;
end;
$$ language plpgsql security definer;
