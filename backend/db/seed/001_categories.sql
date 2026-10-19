insert into categories (name, slug) values
  ('Shirts', 'shirts'),
  ('Blouses', 'blouses'),
  ('Trousers', 'trousers'),
  ('Dresses', 'dresses'),
  ('Shoes', 'shoes'),
  ('Bags', 'bags')
on conflict (slug) do nothing;
