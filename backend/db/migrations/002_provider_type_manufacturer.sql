alter table providers drop constraint if exists providers_provider_type_check;

alter table providers
  add constraint providers_provider_type_check
  check (provider_type in ('designer', 'manufacturer'));
