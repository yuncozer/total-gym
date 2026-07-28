create table if not exists trainers (
  user_id uuid references auth.users not null primary key,
  display_name text not null,
  bio text,
  specialty text,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

alter table trainers enable row level security;

create policy "Trainers can view own row"
  on trainers for select
  using (auth.uid() = user_id);

create policy "Trainers can update own row"
  on trainers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
