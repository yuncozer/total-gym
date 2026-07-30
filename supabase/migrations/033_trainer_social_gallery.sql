alter table public.trainers
  add column if not exists instagram_handle text,
  add column if not exists tiktok_handle text,
  add column if not exists x_handle text,
  add column if not exists whatsapp_phone text;

create table if not exists public.trainer_gallery_items (
  id uuid default gen_random_uuid() primary key,
  trainer_id uuid references public.trainers(user_id) on delete cascade not null,
  media_type text not null check (media_type in ('image', 'video')),
  storage_path text not null,
  display_order integer not null default 0,
  created_at timestamptz default now() not null
);

create index if not exists idx_trainer_gallery_trainer on public.trainer_gallery_items(trainer_id);

alter table public.trainer_gallery_items enable row level security;

create policy "Trainers can manage their own gallery"
  on public.trainer_gallery_items for all
  using (auth.uid() = trainer_id)
  with check (auth.uid() = trainer_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trainer-gallery',
  'trainer-gallery',
  true,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 20971520,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'];

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public read of trainer gallery'
  ) then
    create policy "Public read of trainer gallery"
      on storage.objects for select
      using (bucket_id = 'trainer-gallery');
  end if;
end $$;
