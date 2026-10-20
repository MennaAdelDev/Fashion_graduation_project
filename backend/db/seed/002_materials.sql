insert into materials (name, slug) values
  ('Cotton', 'cotton'),
  ('Linen', 'linen'),
  ('Polyester', 'polyester'),
  ('Silk', 'silk'),
  ('Satin', 'satin'),
  ('Chiffon', 'chiffon'),
  ('Crepe', 'crepe'),
  ('Viscose', 'viscose'),
  ('Wool', 'wool'),
  ('Denim', 'denim'),
  ('Jersey', 'jersey'),
  ('Velvet', 'velvet'),
  ('Leather', 'leather'),
  ('Faux leather', 'faux-leather'),
  ('Canvas', 'canvas')
on conflict (slug) do nothing;
