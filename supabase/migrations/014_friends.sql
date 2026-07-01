create table if not exists public.friend_requests (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (sender_id, receiver_id)
);

create index if not exists idx_friend_requests_receiver on public.friend_requests(receiver_id, status);
create index if not exists idx_friend_requests_sender on public.friend_requests(sender_id, status);

create table if not exists public.friends (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  friend_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique (user_id, friend_id)
);

create index if not exists idx_friends_user on public.friends(user_id);
create index if not exists idx_friends_friend on public.friends(friend_id);

alter table public.friend_requests enable row level security;
alter table public.friends enable row level security;

-- Friend requests: sender can insert, both parties can read, sender can cancel
create policy "Users can send friend requests"
  on public.friend_requests for insert
  with check (auth.uid() = sender_id);

create policy "Users can view their own friend requests"
  on public.friend_requests for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can update requests they're involved in"
  on public.friend_requests for update
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Friends: each user sees their own rows
create policy "Users can view their friends"
  on public.friends for select
  using (auth.uid() = user_id);

create policy "Users can remove their friends"
  on public.friends for delete
  using (auth.uid() = user_id);
