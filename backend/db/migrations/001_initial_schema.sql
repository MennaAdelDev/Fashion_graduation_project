create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table users (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null default 'customer' check (role in ('customer', 'provider', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users (id) on delete cascade,
  provider_type text not null check (provider_type in ('designer', 'factory')),
  business_name text not null,
  description text,
  city text,
  address text,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  requirements text,
  verified boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table provider_categories (
  provider_id uuid not null references providers (id) on delete cascade,
  category_id uuid not null references categories (id) on delete restrict,
  primary key (provider_id, category_id)
);

create table provider_pricing (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null,
  category_id uuid not null,
  min_quantity integer not null check (min_quantity >= 1),
  max_quantity integer not null,
  min_price numeric(12, 2) not null check (min_price >= 0),
  max_price numeric(12, 2) not null,
  price_unit text not null default 'per_piece' check (price_unit in ('per_piece', 'per_order')),
  lead_time_days integer check (lead_time_days >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_id, category_id),
  foreign key (provider_id, category_id) references provider_categories (provider_id, category_id) on delete cascade,
  check (max_quantity >= min_quantity),
  check (max_price >= min_price)
);

create table provider_working_hours (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  unique (provider_id, day_of_week),
  check (is_closed or (opens_at is not null and closes_at is not null and closes_at > opens_at))
);

create table availability (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers (id) on delete cascade,
  date date not null,
  status text not null default 'available' check (status in ('available', 'limited', 'unavailable')),
  capacity integer check (capacity >= 0),
  unique (provider_id, date)
);

create table portfolio (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers (id) on delete cascade,
  category_id uuid references categories (id) on delete set null,
  image_url text not null,
  description text,
  created_at timestamptz not null default now()
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers (id) on delete cascade,
  customer_id uuid not null references users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  unique (provider_id, customer_id)
);

create view provider_rating_stats
with (security_invoker = true)
as
select
  p.id as provider_id,
  round(avg(r.rating)::numeric, 2) as rating_avg,
  count(r.id)::integer as rating_count
from providers p
left join reviews r on r.provider_id = p.id and r.is_hidden = false
group by p.id;

create table projects (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references users (id) on delete cascade,
  title text not null,
  description text,
  category_id uuid references categories (id) on delete restrict,
  quantity integer check (quantity >= 1),
  budget_min numeric(12, 2) check (budget_min >= 0),
  budget_max numeric(12, 2),
  deadline date,
  location_city text,
  status text not null default 'draft' check (status in ('draft', 'open', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (budget_max is null or budget_min is null or budget_max >= budget_min),
  check (status = 'draft' or (category_id is not null and quantity is not null))
);

create table project_requirements (
  project_id uuid primary key references projects (id) on delete cascade,
  item text,
  fabric text,
  color text,
  style text,
  size text,
  customization text,
  extra jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table project_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  provider_id uuid not null references providers (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'withdrawn')),
  message text,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (project_id, provider_id)
);

create table project_designs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  created_by uuid not null references users (id) on delete cascade,
  source text not null check (source in ('upload', 'generated', 'demo')),
  image_url text not null,
  prompt text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  provider_id uuid not null references providers (id) on delete cascade,
  score numeric(5, 2) not null check (score between 0 and 100),
  reason text,
  created_at timestamptz not null default now(),
  unique (project_id, provider_id)
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  customer_id uuid not null references users (id) on delete cascade,
  provider_id uuid not null references providers (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, provider_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_id uuid not null references users (id) on delete cascade,
  message text not null check (length(trim(message)) > 0),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index idx_providers_type on providers (provider_type) where is_active;
create index idx_provider_categories_category on provider_categories (category_id);
create index idx_provider_pricing_match on provider_pricing (category_id, min_quantity, max_quantity);
create index idx_portfolio_provider on portfolio (provider_id);
create index idx_reviews_provider on reviews (provider_id);
create index idx_availability_provider_date on availability (provider_id, date);
create index idx_projects_customer on projects (customer_id);
create index idx_projects_status on projects (status);
create index idx_project_requests_provider on project_requests (provider_id, status);
create index idx_project_designs_project on project_designs (project_id);
create index idx_matches_project on matches (project_id);
create index idx_conversations_customer on conversations (customer_id);
create index idx_conversations_provider on conversations (provider_id);
create index idx_messages_conversation on messages (conversation_id, created_at);

create trigger trg_users_updated_at before update on users for each row execute function set_updated_at();
create trigger trg_providers_updated_at before update on providers for each row execute function set_updated_at();
create trigger trg_provider_pricing_updated_at before update on provider_pricing for each row execute function set_updated_at();
create trigger trg_projects_updated_at before update on projects for each row execute function set_updated_at();
create trigger trg_project_requirements_updated_at before update on project_requirements for each row execute function set_updated_at();

alter table users enable row level security;
alter table categories enable row level security;
alter table providers enable row level security;
alter table provider_categories enable row level security;
alter table provider_pricing enable row level security;
alter table provider_working_hours enable row level security;
alter table availability enable row level security;
alter table portfolio enable row level security;
alter table reviews enable row level security;
alter table projects enable row level security;
alter table project_requirements enable row level security;
alter table project_requests enable row level security;
alter table project_designs enable row level security;
alter table matches enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
