-- =====================================================
-- TOTAL GYM - Supabase Schema
-- =====================================================

-- -----------------------------------------------------
-- 1. PROFILES TABLE (user data)
-- -----------------------------------------------------
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text not null,
  sexo text check (sexo in ('M', 'F')),
  altura_cm numeric,
  peso_kg numeric,
  nivel text check (nivel in ('principiante', 'intermedio', 'avanzado')),
  objetivo text check (objetivo in ('ganar_musculo', 'perder_grasa', 'mantener')),
  created_at timestamp with time zone default now()
);

-- -----------------------------------------------------
-- 2. WORKOUTS TABLE (training sessions)
-- -----------------------------------------------------
create table public.workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  started_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  notes text,
  
  constraint fk_workout_user foreign key (user_id) references auth.users(id) on delete cascade
);

create index idx_workouts_user_id on public.workouts(user_id);
create index idx_workouts_started_at on public.workouts(started_at);

-- -----------------------------------------------------
-- 3. WORKOUT_SETS TABLE (individual sets per exercise)
-- -----------------------------------------------------
create table public.workout_sets (
  id uuid default gen_random_uuid() primary key,
  workout_id uuid references public.workouts(id) on delete cascade,
  exercise_id text not null,
  set_number integer not null,
  reps integer,
  weight_kg numeric,
  is_completed boolean default false,
  completed_at timestamp with time zone,
  
  constraint fk_workout_set foreign key (workout_id) references public.workouts(id) on delete cascade
);

create index idx_workout_sets_workout_id on public.workout_sets(workout_id);
create index idx_workout_sets_exercise_id on public.workout_sets(exercise_id);

-- -----------------------------------------------------
-- 4. TRIGGERS (automatic profile creation)
-- -----------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -----------------------------------------------------
-- 5. ROW LEVEL SECURITY POLICIES
-- -----------------------------------------------------
-- Enable RLS on profiles
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_sets enable row level security;

-- Profiles: users can only see their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Workouts: users can only see their own workouts
create policy "Users can view own workouts" on public.workouts
  for select using (auth.uid() = user_id);

create policy "Users can insert own workouts" on public.workouts
  for insert with check (auth.uid() = user_id);

create policy "Users can update own workouts" on public.workouts
  for update using (auth.uid() = user_id);

create policy "Users can delete own workouts" on public.workouts
  for delete using (auth.uid() = user_id);

-- Workout sets: users can only see their own sets
create policy "Users can view own workout sets" on public.workout_sets
  for select using (
    auth.uid() in (
      select user_id from public.workouts where id = workout_sets.workout_id
    )
  );

create policy "Users can insert own workout sets" on public.workout_sets
  for insert with check (
    auth.uid() in (
      select user_id from public.workouts where id = workout_sets.workout_id
    )
  );

create policy "Users can update own workout sets" on public.workout_sets
  for update using (
    auth.uid() in (
      select user_id from public.workouts where id = workout_sets.workout_id
    )
  );

create policy "Users can delete own workout sets" on public.workout_sets
  for delete using (
    auth.uid() in (
      select user_id from public.workouts where id = workout_sets.workout_id
    )
  );

-- -----------------------------------------------------
-- 6. FUNCTION: Get or create today's workout
-- -----------------------------------------------------
create or replace function public.get_or_create_today_workout()
returns uuid as $$
declare
  v_user_id uuid := auth.uid();
  v_workout_id uuid;
  v_today date := current_date;
begin
  -- Check if there's an incomplete workout for today
  select id into v_workout_id
  from public.workouts
  where user_id = v_user_id
    and started_at::date = v_today
    and completed_at is null
  order by started_at desc
  limit 1;

  -- If not, create one
  if v_workout_id is null then
    insert into public.workouts (user_id)
    values (v_user_id)
    returning id into v_workout_id;
  end if;

  return v_workout_id;
end;
$$ language plpgsql security definer;

-- -----------------------------------------------------
-- 7. FUNCTION: Add exercise set to workout
-- -----------------------------------------------------
create or replace function public.add_workout_set(
  p_workout_id uuid,
  p_exercise_id text,
  p_set_number integer,
  p_reps integer,
  p_weight_kg numeric
)
returns void as $$
begin
  insert into public.workout_sets (workout_id, exercise_id, set_number, reps, weight_kg)
  values (p_workout_id, p_exercise_id, p_set_number, p_reps, p_weight_kg);
end;
$$ language plpgsql;

-- -----------------------------------------------------
-- 8. FUNCTION: Complete a set
-- -----------------------------------------------------
create or replace function public.complete_set(p_set_id uuid)
returns void as $$
begin
  update public.workout_sets
  set is_completed = true, completed_at = now()
  where id = p_set_id;
end;
$$ language plpgsql;

-- -----------------------------------------------------
-- 9. FUNCTION: Complete a workout
-- -----------------------------------------------------
create or replace function public.complete_workout(p_workout_id uuid)
returns void as $$
begin
  update public.workouts
  set completed_at = now()
  where id = p_workout_id;
end;
$$ language plpgsql;

-- =====================================================
-- END OF SCHEMA
-- =====================================================