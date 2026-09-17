-- 001_subscriptions.sql created a policy "Service role manages subscriptions"
-- as `for all using (true) with check (true)` without a role restriction, so it
-- applied to anon/authenticated too: any logged-in user could update any row in
-- `subscriptions` (e.g. set their own plan to 'premium', or read another user's
-- Stripe ids). The service_role key bypasses RLS entirely and needs no policy.

drop policy if exists "Service role manages subscriptions" on subscriptions;

drop policy if exists "Users can view own subscription" on subscriptions;

create policy "Users can view own subscription"
  on subscriptions for select
  to authenticated
  using (auth.uid() = user_id);
