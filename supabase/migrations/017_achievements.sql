-- Achievements system
create table if not exists public.achievements (
  id text primary key,
  name_es text not null,
  name_en text not null,
  desc_es text not null,
  desc_en text not null,
  icon text not null default 'trophy'
);

insert into public.achievements (id, name_es, name_en, desc_es, desc_en, icon) values
  ('first_workout', 'Primer Paso', 'First Step', 'Completá tu primer entrenamiento', 'Complete your first workout', 'dumbbell'),
  ('workouts_10', 'Dedicado', 'Dedicated', 'Completá 10 entrenamientos', 'Complete 10 workouts', 'zap'),
  ('workouts_50', 'Imparable', 'Unstoppable', 'Completá 50 entrenamientos', 'Complete 50 workouts', 'flame'),
  ('streak_3', 'Constante', 'Consistent', 'Alcanzá una racha de 3 días', 'Reach a 3-day streak', 'flame'),
  ('streak_7', 'Disciplina', 'Discipline', 'Alcanzá una racha de 7 días', 'Reach a 7-day streak', 'flame'),
  ('streak_30', 'LEYENDA', 'LEGEND', 'Alcanzá una racha de 30 días', 'Reach a 30-day streak', 'trophy'),
  ('level_5', 'Forjado', 'Forged', 'Alcanzá el nivel 5', 'Reach level 5', 'zap'),
  ('level_10', 'Élite', 'Elite', 'Alcanzá el nivel 10', 'Reach level 10', 'crown'),
  ('sets_100', 'Volumen', 'Volume', 'Completá 100 series', 'Complete 100 sets', 'dumbbell'),
  ('share_first', 'Generoso', 'Generous', 'Compartí tu primer entrenamiento', 'Share your first workout', 'share'),
  ('friend_first', 'Social', 'Social', 'Agregá tu primer amigo', 'Add your first friend', 'users');

create table if not exists public.user_achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  achievement_id text references public.achievements(id) on delete cascade not null,
  earned_at timestamptz default now() not null,
  unique (user_id, achievement_id)
);

create index if not exists idx_user_achievements_user on public.user_achievements(user_id);

alter table public.user_achievements enable row level security;

create policy "Users can view their own achievements"
  on public.user_achievements for select
  using (auth.uid() = user_id);

-- Function to check and award achievements
create or replace function public.check_achievements(p_user_id uuid)
returns void as $$
declare
  v_workout_count integer;
  v_set_count integer;
  v_current_streak integer;
  v_level integer;
  v_friend_count integer;
  v_share_count integer;
begin
  select count(*)::integer into v_workout_count
  from public.workouts
  where user_id = p_user_id and completed_at is not null;

  select count(*)::integer into v_set_count
  from public.workout_sets ws
  join public.workouts w on w.id = ws.workout_id
  where w.user_id = p_user_id and ws.is_completed = true;

  select current_streak, level into v_current_streak, v_level
  from public.profiles
  where id = p_user_id;

  select count(*)::integer into v_friend_count
  from public.friends
  where user_id = p_user_id;

  select count(*)::integer into v_share_count
  from public.friend_shares
  where sender_id = p_user_id;

  -- Insert achievements that haven't been earned yet
  if v_workout_count >= 1 then
    insert into public.user_achievements (user_id, achievement_id)
    values (p_user_id, 'first_workout') on conflict do nothing;
  end if;

  if v_workout_count >= 10 then
    insert into public.user_achievements (user_id, achievement_id)
    values (p_user_id, 'workouts_10') on conflict do nothing;
  end if;

  if v_workout_count >= 50 then
    insert into public.user_achievements (user_id, achievement_id)
    values (p_user_id, 'workouts_50') on conflict do nothing;
  end if;

  if v_current_streak >= 3 then
    insert into public.user_achievements (user_id, achievement_id)
    values (p_user_id, 'streak_3') on conflict do nothing;
  end if;

  if v_current_streak >= 7 then
    insert into public.user_achievements (user_id, achievement_id)
    values (p_user_id, 'streak_7') on conflict do nothing;
  end if;

  if v_current_streak >= 30 then
    insert into public.user_achievements (user_id, achievement_id)
    values (p_user_id, 'streak_30') on conflict do nothing;
  end if;

  if v_level >= 5 then
    insert into public.user_achievements (user_id, achievement_id)
    values (p_user_id, 'level_5') on conflict do nothing;
  end if;

  if v_level >= 10 then
    insert into public.user_achievements (user_id, achievement_id)
    values (p_user_id, 'level_10') on conflict do nothing;
  end if;

  if v_set_count >= 100 then
    insert into public.user_achievements (user_id, achievement_id)
    values (p_user_id, 'sets_100') on conflict do nothing;
  end if;

  if v_share_count >= 1 then
    insert into public.user_achievements (user_id, achievement_id)
    values (p_user_id, 'share_first') on conflict do nothing;
  end if;

  if v_friend_count >= 1 then
    insert into public.user_achievements (user_id, achievement_id)
    values (p_user_id, 'friend_first') on conflict do nothing;
  end if;
end;
$$ language plpgsql security definer;

-- Update sync_gamification to also check achievements
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

  perform public.check_achievements(p_user_id);

  return query select v_xp, v_level, v_streak, v_longest;
end;
$$ language plpgsql security definer;
