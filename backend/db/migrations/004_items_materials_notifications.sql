create table materials (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table provider_materials (
  provider_id uuid not null references providers (id) on delete cascade,
  material_id uuid not null references materials (id) on delete restrict,
  primary key (provider_id, material_id)
);

alter table projects add constraint projects_id_customer_id_key unique (id, customer_id);

create table project_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  category_id uuid not null references categories (id) on delete restrict,
  quantity integer not null check (quantity >= 1),
  item_name text,
  material_id uuid references materials (id) on delete restrict,
  material_confirmed boolean not null default false,
  material_notes text,
  color text,
  style text,
  size_details text,
  customization text,
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, project_id),
  check (not material_confirmed or material_id is not null)
);

do $$
declare
  skipped integer;
begin
  select count(*) into skipped
  from projects p
  left join project_requirements r on r.project_id = p.id
  where (p.category_id is null or p.quantity is null)
    and (r.project_id is not null);
  if skipped > 0 then
    raise notice '% draft project(s) had requirements but no category or quantity; their requirements are not migrated', skipped;
  end if;
end $$;

insert into project_items (project_id, category_id, quantity, item_name, material_notes, color, style, size_details, customization, extra)
select p.id, p.category_id, p.quantity, r.item, r.fabric, r.color, r.style, r.size, r.customization, coalesce(r.extra, '{}'::jsonb)
from projects p
left join project_requirements r on r.project_id = p.id
where p.category_id is not null and p.quantity is not null;

drop table project_requirements;

alter table projects drop column category_id;
alter table projects drop column quantity;

create function enforce_project_has_items()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('open', 'in_progress', 'completed')
     and not exists (select 1 from project_items where project_id = new.id) then
    raise exception 'project needs at least one item before status %', new.status using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger trg_projects_require_items
before insert or update of status on projects
for each row execute function enforce_project_has_items();

alter table project_requests drop constraint project_requests_status_check;
alter table project_requests
  add constraint project_requests_status_check
  check (status in ('pending', 'negotiating', 'accepted', 'rejected', 'withdrawn', 'expired'));

create unique index uq_project_requests_one_accepted on project_requests (project_id) where status = 'accepted';

alter table conversations
  add constraint conversations_project_customer_fkey
  foreign key (project_id, customer_id) references projects (id, customer_id);

create function enforce_message_sender()
returns trigger
language plpgsql
as $$
declare
  v_customer uuid;
  v_provider_user uuid;
begin
  select c.customer_id, p.user_id
  into v_customer, v_provider_user
  from conversations c
  join providers p on p.id = c.provider_id
  where c.id = new.conversation_id;

  if new.sender_id is distinct from v_customer and new.sender_id is distinct from v_provider_user then
    raise exception 'sender is not a participant of the conversation' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger trg_messages_sender
before insert on messages
for each row execute function enforce_message_sender();

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_provider_materials_material on provider_materials (material_id);
create index idx_project_items_project on project_items (project_id);
create index idx_project_items_category on project_items (category_id);
create index idx_notifications_user on notifications (user_id, created_at desc);
create index idx_notifications_unread on notifications (user_id) where read_at is null;

create trigger trg_project_items_updated_at before update on project_items for each row execute function set_updated_at();

alter table materials enable row level security;
alter table provider_materials enable row level security;
alter table project_items enable row level security;
alter table notifications enable row level security;
