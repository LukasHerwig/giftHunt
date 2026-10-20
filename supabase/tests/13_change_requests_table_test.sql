begin;
create extension if not exists pgtap with schema extensions;
select plan(10);
\ir _seed.psql

insert into public.item_change_requests (id, wishlist_id, item_id, item_title, kind, proposed, created_by)
values ('dddddddd-0000-0000-0000-000000000001', :'w1', :'i1', 'Bok', 'edit', '{"title":"Bok 2"}', :'u_owner');

:as_owner
select is((select count(*)::int from item_change_requests), 1, 'the owner sees requests on their list');
select throws_ok(
  $$ insert into item_change_requests (wishlist_id, item_id, item_title, kind, created_by)
     values ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002', 'Presentkort', 'remove', '11111111-0000-0000-0000-000000000001') $$,
  '42501', null, 'the owner cannot insert directly (only through the RPC)');
select throws_ok(
  $$ update item_change_requests set status = 'approved' $$,
  '42501', null, 'the owner cannot approve their own request by updating it');
reset role;

:as_admin
select is((select count(*)::int from item_change_requests), 1, 'the organizer sees requests on their list');
reset role;

:as_stranger
select is((select count(*)::int from item_change_requests), 0, 'a stranger sees nothing');
reset role;

:as_invitee
select is((select count(*)::int from item_change_requests), 0, 'an invitee sees nothing');
reset role;

:as_anon
select throws_ok($$ select count(*) from public.item_change_requests $$, '42501', null, 'anon cannot read requests');
reset role;

select is(
  (select count(*)::int from unnest(array['SELECT','INSERT','UPDATE','DELETE']) p
   where has_table_privilege('anon', 'public.item_change_requests', p)),
  0, 'anon has no privileges on the table');

select throws_ok(
  $$ insert into item_change_requests (wishlist_id, item_id, item_title, kind, created_by)
     values ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'Bok', 'remove', '11111111-0000-0000-0000-000000000001') $$,
  '23505', null, 'only one pending request per item');

select throws_ok(
  $$ insert into item_change_requests (wishlist_id, item_id, item_title, kind, created_by)
     values ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000003', 'Lampa', 'edit', '11111111-0000-0000-0000-000000000001') $$,
  '23514', null, 'an edit request must carry the proposed fields');

select * from finish();
rollback;
