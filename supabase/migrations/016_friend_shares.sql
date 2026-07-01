create table if not exists public.friend_shares (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique (sender_id, receiver_id, workout_id)
);

create index if not exists idx_friend_shares_receiver on public.friend_shares(receiver_id, created_at desc);
create index if not exists idx_friend_shares_sender on public.friend_shares(sender_id, created_at desc);

alter table public.friend_shares enable row level security;

create policy "Users can view shares they're involved in"
  on public.friend_shares for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can share workouts"
  on public.friend_shares for insert
  with check (auth.uid() = sender_id);

create policy "Users can delete their own shares"
  on public.friend_shares for delete
  using (auth.uid() = sender_id);
