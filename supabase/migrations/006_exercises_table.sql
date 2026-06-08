create table if not exists public.exercises (
  id bigint primary key,
  uuid text,
  name text not null,
  description text,
  category text,
  category_id integer,
  muscles text[],
  muscle_ids integer[],
  secondary_muscles text[],
  secondary_muscle_ids integer[],
  equipment text,
  equipment_ids integer[],
  equipment_category text,
  image_url text,
  images text[],
  variation_group text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.exercises enable row level security;

create policy "Anyone can view exercises"
  on public.exercises for select
  using (true);
