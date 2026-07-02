alter table public.friend_shares add column if not exists viewed_at timestamptz;

create index if not exists idx_friend_shares_viewed on public.friend_shares(receiver_id, viewed_at nulls first);
