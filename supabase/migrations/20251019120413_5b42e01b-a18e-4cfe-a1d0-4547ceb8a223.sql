-- Create storage policies for game-backgrounds with IF NOT EXISTS guards via DO blocks

-- INSERT backgrounds
do $$
begin
  if not exists (
    select 1 from pg_policies p
    where p.policyname = 'insert_own_backgrounds'
      and p.schemaname = 'storage'
      and p.tablename = 'objects'
  ) then
    create policy "insert_own_backgrounds"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'game-backgrounds'
        and (storage.foldername(name))[1] = 'backgrounds'
        and (storage.foldername(name))[2] = auth.uid()::text
      );
  end if;
end$$;

-- INSERT thumbnails
do $$
begin
  if not exists (
    select 1 from pg_policies p
    where p.policyname = 'insert_own_thumbnails'
      and p.schemaname = 'storage'
      and p.tablename = 'objects'
  ) then
    create policy "insert_own_thumbnails"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'game-backgrounds'
        and (storage.foldername(name))[1] = 'thumbnails'
        and (storage.foldername(name))[2] = auth.uid()::text
      );
  end if;
end$$;

-- DELETE backgrounds
do $$
begin
  if not exists (
    select 1 from pg_policies p
    where p.policyname = 'delete_own_backgrounds'
      and p.schemaname = 'storage'
      and p.tablename = 'objects'
  ) then
    create policy "delete_own_backgrounds"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'game-backgrounds'
        and (storage.foldername(name))[1] = 'backgrounds'
        and (storage.foldername(name))[2] = auth.uid()::text
      );
  end if;
end$$;

-- DELETE thumbnails
do $$
begin
  if not exists (
    select 1 from pg_policies p
    where p.policyname = 'delete_own_thumbnails'
      and p.schemaname = 'storage'
      and p.tablename = 'objects'
  ) then
    create policy "delete_own_thumbnails"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'game-backgrounds'
        and (storage.foldername(name))[1] = 'thumbnails'
        and (storage.foldername(name))[2] = auth.uid()::text
      );
  end if;
end$$;

-- UPDATE backgrounds
do $$
begin
  if not exists (
    select 1 from pg_policies p
    where p.policyname = 'update_own_backgrounds'
      and p.schemaname = 'storage'
      and p.tablename = 'objects'
  ) then
    create policy "update_own_backgrounds"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'game-backgrounds'
        and (storage.foldername(name))[1] = 'backgrounds'
        and (storage.foldername(name))[2] = auth.uid()::text
      )
      with check (
        bucket_id = 'game-backgrounds'
        and (storage.foldername(name))[1] = 'backgrounds'
        and (storage.foldername(name))[2] = auth.uid()::text
      );
  end if;
end$$;

-- UPDATE thumbnails
do $$
begin
  if not exists (
    select 1 from pg_policies p
    where p.policyname = 'update_own_thumbnails'
      and p.schemaname = 'storage'
      and p.tablename = 'objects'
  ) then
    create policy "update_own_thumbnails"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'game-backgrounds'
        and (storage.foldername(name))[1] = 'thumbnails'
        and (storage.foldername(name))[2] = auth.uid()::text
      )
      with check (
        bucket_id = 'game-backgrounds'
        and (storage.foldername(name))[1] = 'thumbnails'
        and (storage.foldername(name))[2] = auth.uid()::text
      );
  end if;
end$$;