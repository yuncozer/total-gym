-- Backfill missing emails in profiles and add RPC for API fallback
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and (p.email is null or p.email = '');

create or replace function public.get_user_email(p_user_id uuid)
returns text
language sql
security definer
as $$
  select email from auth.users where id = p_user_id;
$$;

create or replace function public.get_users_emails(user_ids uuid[])
returns table (id uuid, email text)
language sql
security definer
as $$
  select id, email from auth.users where id = any(user_ids);
$$;

-- Ensure new users always have email synced
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, notify_enabled)
  values (new.id, new.email, false)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to keep email in sync on auth user update
create or replace function public.sync_user_email()
returns trigger as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute procedure public.sync_user_email();
