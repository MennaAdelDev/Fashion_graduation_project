alter table project_requests add constraint project_requests_id_project_key unique (id, project_id);
alter table project_requests add constraint project_requests_id_project_provider_key unique (id, project_id, provider_id);

create table quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  project_id uuid not null,
  round_number integer not null check (round_number between 1 and 10),
  proposed_by text not null check (proposed_by in ('customer', 'provider')),
  lead_time_days integer not null check (lead_time_days >= 0),
  deposit_percent numeric(5, 2) not null default 30 check (deposit_percent between 0 and 100),
  valid_until timestamptz,
  note text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'superseded', 'expired')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (request_id, round_number),
  unique (id, request_id),
  unique (id, project_id),
  foreign key (request_id, project_id) references project_requests (id, project_id) on delete cascade,
  check ((round_number % 2 = 1) = (proposed_by = 'provider'))
);

create unique index uq_quotes_one_pending on quotes (request_id) where status = 'pending';
create unique index uq_quotes_one_accepted on quotes (request_id) where status = 'accepted';

create table quote_items (
  quote_id uuid not null,
  project_id uuid not null,
  project_item_id uuid not null,
  quantity integer not null check (quantity >= 1),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  material_id uuid references materials (id) on delete restrict,
  notes text,
  primary key (quote_id, project_item_id),
  foreign key (quote_id, project_id) references quotes (id, project_id) on delete cascade,
  foreign key (project_item_id, project_id) references project_items (id, project_id) on delete restrict
);

create view quote_totals
with (security_invoker = true)
as
select
  q.id as quote_id,
  q.request_id,
  q.project_id,
  q.deposit_percent,
  coalesce(sum(i.quantity * i.unit_price), 0)::numeric(14, 2) as total_price,
  round(coalesce(sum(i.quantity * i.unit_price), 0) * q.deposit_percent / 100, 2) as deposit_amount
from quotes q
left join quote_items i on i.quote_id = q.id
group by q.id;

create table orders (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  project_id uuid not null unique,
  provider_id uuid not null,
  customer_id uuid not null,
  quote_id uuid not null unique,
  status text not null default 'awaiting_deposit' check (status in (
    'awaiting_deposit', 'in_production', 'pending_customer_approval', 'shipped', 'delivered', 'completed', 'disputed', 'cancelled'
  )),
  delivery_address text,
  delivery_city text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (request_id, project_id, provider_id) references project_requests (id, project_id, provider_id),
  foreign key (project_id, customer_id) references projects (id, customer_id),
  foreign key (quote_id, request_id) references quotes (id, request_id),
  check (status <> 'cancelled' or cancellation_reason is not null)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  kind text not null check (kind in ('deposit', 'balance', 'refund')),
  amount numeric(12, 2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  is_simulated boolean not null default true,
  gateway_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  check (status <> 'paid' or paid_at is not null)
);

create unique index uq_payments_one_paid_deposit on payments (order_id) where kind = 'deposit' and status = 'paid';

create view order_financials
with (security_invoker = true)
as
select
  o.id as order_id,
  t.total_price,
  t.deposit_percent,
  t.deposit_amount,
  x.paid_total,
  x.refunded_total,
  (t.total_price - x.paid_total + x.refunded_total) as remaining_amount
from orders o
join quote_totals t on t.quote_id = o.quote_id
cross join lateral (
  select
    coalesce(sum(p.amount) filter (where p.status = 'paid' and p.kind in ('deposit', 'balance')), 0) as paid_total,
    coalesce(sum(p.amount) filter (where p.status = 'paid' and p.kind = 'refund'), 0) as refunded_total
  from payments p
  where p.order_id = o.id
) x;

create table production_stages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  name text not null check (name in ('materials_sourcing', 'sample', 'production', 'finishing', 'quality_check', 'packing')),
  position smallint not null check (position >= 1),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'approved', 'changes_requested')),
  requires_customer_approval boolean not null default false,
  note text,
  started_at timestamptz,
  completed_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, position),
  unique (order_id, name),
  unique (id, order_id),
  check (requires_customer_approval or status not in ('approved', 'changes_requested'))
);

create table order_issues (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  raised_by uuid not null references users (id) on delete cascade,
  type text not null check (type in ('defect', 'not_as_agreed', 'late_delivery', 'damaged_in_delivery', 'other')),
  description text not null check (length(trim(description)) > 0),
  status text not null default 'open' check (status in ('open', 'in_review', 'rework_agreed', 'refund_agreed', 'rejected', 'closed')),
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, order_id),
  check (status in ('open', 'in_review') or resolved_at is not null)
);

create table order_media (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  stage_id uuid,
  issue_id uuid,
  image_url text not null,
  uploaded_by uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  foreign key (stage_id, order_id) references production_stages (id, order_id) on delete cascade,
  foreign key (issue_id, order_id) references order_issues (id, order_id) on delete cascade,
  check (stage_id is null or issue_id is null)
);

create function enforce_order_transition()
returns trigger
language plpgsql
as $$
declare
  v_deposit_percent numeric;
begin
  if new.status = old.status then
    return new;
  end if;

  if not (
    (old.status = 'awaiting_deposit' and new.status in ('in_production', 'cancelled')) or
    (old.status = 'in_production' and new.status in ('pending_customer_approval', 'disputed', 'cancelled')) or
    (old.status = 'pending_customer_approval' and new.status in ('shipped', 'in_production', 'disputed', 'cancelled')) or
    (old.status = 'shipped' and new.status in ('delivered', 'disputed')) or
    (old.status = 'delivered' and new.status in ('completed', 'disputed')) or
    (old.status = 'disputed' and new.status in ('in_production', 'completed', 'cancelled'))
  ) then
    raise exception 'invalid order status transition from % to %', old.status, new.status using errcode = '23514';
  end if;

  if new.status = 'shipped' and new.delivery_address is null then
    raise exception 'delivery_address is required before shipping' using errcode = '23514';
  end if;

  if old.status = 'awaiting_deposit' and new.status = 'in_production' then
    select deposit_percent into v_deposit_percent from quotes where id = new.quote_id;
    if v_deposit_percent > 0 and not exists (
      select 1 from payments where order_id = new.id and kind = 'deposit' and status = 'paid'
    ) then
      raise exception 'deposit must be paid before production starts' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_orders_transition
before update of status on orders
for each row execute function enforce_order_transition();

create function enforce_order_quote_accepted()
returns trigger
language plpgsql
as $$
begin
  if not exists (select 1 from quotes where id = new.quote_id and status = 'accepted') then
    raise exception 'an order can only be created from an accepted quote' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger trg_orders_quote_accepted
before insert on orders
for each row execute function enforce_order_quote_accepted();

create index idx_quotes_request on quotes (request_id, round_number);
create index idx_orders_provider on orders (provider_id, status);
create index idx_orders_customer on orders (customer_id, status);
create index idx_payments_order on payments (order_id);
create index idx_production_stages_order on production_stages (order_id, position);
create index idx_order_issues_order on order_issues (order_id);
create index idx_order_media_order on order_media (order_id);

create trigger trg_orders_updated_at before update on orders for each row execute function set_updated_at();
create trigger trg_production_stages_updated_at before update on production_stages for each row execute function set_updated_at();

alter table quotes enable row level security;
alter table quote_items enable row level security;
alter table orders enable row level security;
alter table payments enable row level security;
alter table production_stages enable row level security;
alter table order_issues enable row level security;
alter table order_media enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('order-media', 'order-media', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
