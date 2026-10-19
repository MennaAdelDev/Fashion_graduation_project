insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('portfolio', 'portfolio', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('project-references', 'project-references', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('project-designs', 'project-designs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
