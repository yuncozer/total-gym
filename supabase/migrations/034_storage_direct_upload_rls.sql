do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can upload their own avatar'
  ) then
    create policy "Users can upload their own avatar"
      on storage.objects for insert
      with check (
        bucket_id = 'profile-avatars'
        and (storage.foldername(name))[2] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can replace their own avatar'
  ) then
    create policy "Users can replace their own avatar"
      on storage.objects for update
      using (
        bucket_id = 'profile-avatars'
        and (storage.foldername(name))[2] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can delete their own avatar'
  ) then
    create policy "Users can delete their own avatar"
      on storage.objects for delete
      using (
        bucket_id = 'profile-avatars'
        and (storage.foldername(name))[2] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Trainers can manage their own gallery files'
  ) then
    create policy "Trainers can manage their own gallery files"
      on storage.objects for all
      using (
        bucket_id = 'trainer-gallery'
        and (storage.foldername(name))[1] = auth.uid()::text
      )
      with check (
        bucket_id = 'trainer-gallery'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;
