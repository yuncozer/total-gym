create table if not exists workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  exercises jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table workout_templates enable row level security;

create policy "Users can manage own templates"
  on workout_templates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists custom_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  muscle_group text not null,
  equipment text not null default 'peso_corporal',
  image_url text,
  created_at timestamptz default now()
);

alter table custom_exercises enable row level security;

create policy "Users can manage own custom exercises"
  on custom_exercises for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
