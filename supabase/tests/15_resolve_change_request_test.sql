begin;
create extension if not exists pgtap with schema extensions;
select plan(18);
\ir _seed.psql

\set r_edit   'dddddddd-0000-0000-0000-000000000001'
\set r_card   'dddddddd-0000-0000-0000-000000000002'
\set r_remove 'dddddddd-0000-0000-0000-000000000003'
\set r_gone   'dddddddd-0000-0000-0000-000000000004'
\set r_w3     'dddddddd-0000-0000-0000-000000000005'
\set r_msg    'dddddddd-0000-0000-0000-000000000006'
\set r_move   'dddddddd-0000-0000-0000-000000000007'
\set i_move   'bbbbbbbb-0000-0000-0000-000000000009'

insert into item_change_requests (id, wishlist_id, item_id, item_title, kind, proposed, created_by) values
  (:'r_edit',   :'w1', :'i1', 'Bok',         'edit',   '{"title":"Bok 2","description":"Inbunden","priority":5}', :'u_owner'),
  (:'r_card',   :'w1', :'i2', 'Presentkort', 'edit',   '{"is_giftcard":false}',                                   :'u_owner'),
  (:'r_remove', :'w1', :'i3', 'Lampa',       'remove', null,                                                      :'u_owner'),
  (:'r_gone',   :'w1', null,  'Borta',       'edit',   '{"title":"x"}',                                           :'u_owner'),
  (:'r_w3',     :'w3', :'i4', 'Napp',        'edit',   '{"title":"x"}',                                           :'u_self'),
  (:'r_msg',    :'w1', null,  'Gammal',      'remove', null,                                                      :'u_owner');

-- The owner moves an item with a pending request to another of their lists
insert into wishlist_items (id, wishlist_id, title) values (:'i_move', :'w1', 'Flyttad');
insert into item_change_requests (id, wishlist_id, item_id, item_title, kind, proposed, created_by)
values (:'r_move', :'w1', :'i_move', 'Flyttad', 'remove', null, :'u_owner');
update wishlist_items set wishlist_id = :'w2' where id = :'i_move';

:as_owner
select throws_ok(
  format('select public.resolve_change_request(%L, true)', :'r_edit'),
  'P0002', 'request_not_found', 'the owner cannot approve their own request');
reset role;

:as_admin
select throws_ok(
  format('select public.resolve_change_request(%L, true)', :'r_w3'),
  'P0002', 'request_not_found', 'an organizer of another list cannot resolve it');
select lives_ok(
  format('select public.resolve_change_request(%L, true, %L)', :'r_edit', '  Fixat!  '),
  'the organizer approves an edit');
select throws_ok(
  format('select public.resolve_change_request(%L, false)', :'r_edit'),
  'P0001', 'not_pending', 'a resolved request cannot be resolved again');
select lives_ok(format('select public.resolve_change_request(%L, true)', :'r_card'), 'the organizer approves turning the gift card off');
select lives_ok(format('select public.resolve_change_request(%L, true)', :'r_remove'), 'the organizer approves a removal');
select throws_ok(
  format('select public.resolve_change_request(%L, true)', :'r_gone'),
  'P0002', 'item_not_found', 'an edit for a deleted item cannot be approved');
select lives_ok(format('select public.resolve_change_request(%L, false)', :'r_gone'), 'but it can be declined');
select throws_ok(
  format('select public.resolve_change_request(%L, false, %L)', :'r_msg', repeat('a', 501)),
  '22023', 'invalid_message', 'a message over 500 characters is refused');
select throws_ok(
  format('select public.resolve_change_request(%L, true)', :'r_move'),
  'P0002', 'item_not_found', 'an item moved to another list cannot be changed through this list''s request');
reset role;

select is(
  (select wishlist_id::text from wishlist_items where id = :'i_move'), :'w2',
  'the moved item is untouched on its new list');

select results_eq(
  $$ select title, description, priority from wishlist_items where id = 'bbbbbbbb-0000-0000-0000-000000000001' $$,
  $$ values ('Bok 2'::text, 'Inbunden'::text, 5) $$,
  'the approved edit is applied');
select results_eq(
  $$ select is_giftcard, claim_cap from wishlist_items where id = 'bbbbbbbb-0000-0000-0000-000000000002' $$,
  $$ values (false, null::int) $$,
  'turning a gift card off clears its claim cap');
select is(
  (select count(*)::int from wishlist_items where id = 'bbbbbbbb-0000-0000-0000-000000000003'), 0,
  'the approved removal deleted the item');
select results_eq(
  format('select status, message, resolved_by from item_change_requests where id = %L', :'r_edit'),
  $$ values ('approved'::text, 'Fixat!'::text, '11111111-0000-0000-0000-000000000002'::uuid) $$,
  'the outcome and the trimmed message are recorded');
select is(
  (select status from item_change_requests where id = :'r_remove'), 'approved',
  'the removal keeps its outcome after the item is gone');
select is(
  (select status from item_change_requests where id = :'r_gone'), 'declined',
  'a declined request is recorded');

:as_anon
select throws_ok(
  format('select public.resolve_change_request(%L, true)', :'r_msg'),
  '42501', null, 'anon cannot resolve requests');
reset role;

select * from finish();
rollback;
