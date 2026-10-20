begin;
create extension if not exists pgtap with schema extensions;
select plan(20);
\ir _seed.psql

-- An item on W4, which has only an expired link
insert into wishlist_items (id, wishlist_id, title) values ('bbbbbbbb-0000-0000-0000-000000000005', :'w4', 'Sjal');

:as_owner
select lives_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000001', 'edit', '{"title":"Bok 2","price_range":"200 kr"}') $$,
  'the owner requests an edit on a shared list');
select is((select count(*)::int from item_change_requests where status = 'pending'), 1, 'the request is pending and visible to the owner');
select throws_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000001', 'remove') $$,
  'P0001', 'request_pending', 'only one pending request per item');
select throws_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000003', 'edit', '{"is_taken":false}') $$,
  '22023', 'invalid_proposal', 'taken status cannot be changed through a request');
select throws_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000003', 'edit', '{"wishlist_id":"aaaaaaaa-0000-0000-0000-000000000003"}') $$,
  '22023', 'invalid_proposal', 'an item cannot be moved to another list');
select throws_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000003', 'edit', '{"title":"   "}') $$,
  '22023', 'invalid_proposal', 'the title cannot be blank');
select throws_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000003', 'edit', '{"claim_cap":0}') $$,
  '22023', 'invalid_proposal', 'the claim cap must be a whole number of at least 1');
select throws_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000003', 'edit', '{"priority":"high"}') $$,
  '22023', 'invalid_proposal', 'priority must be a number');
select throws_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000003', 'edit', '{}') $$,
  '22023', 'invalid_proposal', 'an empty edit is refused');
select throws_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000003', 'rename') $$,
  '22023', 'invalid_kind', 'an unknown kind is refused');
select lives_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000003', 'remove') $$,
  'the owner requests a removal');
select throws_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000005', 'edit', '{"title":"Halsduk"}') $$,
  'P0001', 'edit_directly', 'a list without an active link is edited directly');
reset role;

:as_self
select throws_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000004', 'edit', '{"title":"Napp 2"}') $$,
  'P0001', 'edit_directly', 'a self-managed list is edited directly');
reset role;

:as_stranger
select throws_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000001', 'edit', '{"title":"x"}') $$,
  'P0002', 'item_not_found', 'a stranger cannot request changes');
reset role;

select id as req_i1 from item_change_requests where item_id = :'i1' and status = 'pending' \gset

:as_admin
select throws_ok(
  format('select public.withdraw_change_request(%L)', :'req_i1'),
  'P0002', 'request_not_found', 'only the person who asked can withdraw');
reset role;

:as_owner
select lives_ok(format('select public.withdraw_change_request(%L)', :'req_i1'), 'the owner withdraws the request');
select throws_ok(
  format('select public.withdraw_change_request(%L)', :'req_i1'),
  'P0002', 'request_not_found', 'a withdrawn request cannot be withdrawn again');
select lives_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000001', 'edit', '{"title":"Bok 3"}') $$,
  'after withdrawing, a new request can be made');
reset role;

:as_anon
select throws_ok(
  $$ select public.request_item_change('bbbbbbbb-0000-0000-0000-000000000001', 'remove') $$,
  '42501', null, 'anon cannot request changes');
reset role;

select results_eq(
  $$ select item_title, kind, created_by from item_change_requests
     where item_id = 'bbbbbbbb-0000-0000-0000-000000000003' $$,
  $$ values ('Lampa'::text, 'remove'::text, '11111111-0000-0000-0000-000000000001'::uuid) $$,
  'the request keeps a title snapshot and who asked');

select * from finish();
rollback;
