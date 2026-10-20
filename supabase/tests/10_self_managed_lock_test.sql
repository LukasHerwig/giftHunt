begin;
create extension if not exists pgtap with schema extensions;
select plan(3);
\ir _seed.psql

:as_owner
select throws_ok(
  $$ update wishlists set is_self_managed = true where id = 'aaaaaaaa-0000-0000-0000-000000000002' $$,
  'P0001', 'is_self_managed_locked', 'an owner cannot turn a list self-managed afterwards');
select lives_ok(
  $$ update wishlists set title = 'Jul 2026' where id = 'aaaaaaaa-0000-0000-0000-000000000002' $$,
  'other settings can still change');
reset role;

:as_self
select throws_ok(
  $$ update wishlists set is_self_managed = false where id = 'aaaaaaaa-0000-0000-0000-000000000003' $$,
  'P0001', 'is_self_managed_locked', 'a self-managed list cannot be turned back');
reset role;

select * from finish();
rollback;
