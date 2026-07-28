create table if not exists public.client_payments (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.trainer_clients(id) on delete cascade not null,
  trainer_id uuid references public.trainers(user_id) on delete cascade not null,
  amount numeric not null,
  currency text not null default 'USD',
  period_start date,
  period_end date,
  paid_at timestamptz default now() not null,
  method text,
  sessions_included integer,
  notes text,
  created_at timestamptz default now() not null
);

create index if not exists idx_client_payments_client on public.client_payments(client_id, period_end);
create index if not exists idx_client_payments_trainer on public.client_payments(trainer_id);

alter table public.client_payments enable row level security;

create policy "Trainers can manage their own client payments"
  on public.client_payments for all
  using (auth.uid() = trainer_id)
  with check (auth.uid() = trainer_id);
