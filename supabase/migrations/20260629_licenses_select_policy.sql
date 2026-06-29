-- Allow users to read their own license (writes still go through service-role API routes)
create policy "Users can read own license" on public.licenses
  for select using (auth.uid() = user_id);
