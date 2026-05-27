create table if not exists admin_users (
  user_id uuid references auth.users not null primary key,
  created_at timestamptz default now()
);

alter table admin_users enable row level security;

create policy "Admins can manage admin_users"
  on admin_users for all
  using (auth.uid() in (select user_id from admin_users))
  with check (auth.uid() in (select user_id from admin_users));
