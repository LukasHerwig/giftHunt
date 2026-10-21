begin;
create extension if not exists pgtap with schema extensions;
select plan(7);
\ir _seed.psql

-- The organizer shares and keeps track; the owner decides what is on the list
:as_admin
select throws_ok(
  $$ insert into wishlist_items (wishlist_id, title) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Smygdryck') $$,
  '42501', null, 'an organizer cannot add items to the owner''s list');
update wishlist_items set title = 'Bok (arrangör)' where id = 'bbbbbbbb-0000-0000-0000-000000000001';
update wishlist_items set is_taken = false, taken_by_name = null, taken_at = null where id = 'bbbbbbbb-0000-0000-0000-000000000003';
delete from wishlist_items where id = 'bbbbbbbb-0000-0000-0000-000000000002';
reset role;
select is((select title from wishlist_items where id = :'i1'), 'Bok (arrangör)', 'the organizer can still edit an item');
select ok(not (select is_taken from wishlist_items where id = :'i3'), 'the organizer can still make an item free');
select ok(not exists (select 1 from wishlist_items where id = :'i2'), 'the organizer can still delete an item');

-- The owner, including the creator of a self-managed list, still adds
:as_owner
select lives_ok(
  $$ insert into wishlist_items (wishlist_id, title) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Ägarens önskning') $$,
  'the owner can add items');
reset role;
:as_self
select lives_ok(
  $$ insert into wishlist_items (wishlist_id, title) values ('aaaaaaaa-0000-0000-0000-000000000003', 'Egen önskning') $$,
  'the creator of a self-managed list can add items');
reset role;

:as_stranger
select throws_ok(
  $$ insert into wishlist_items (wishlist_id, title) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Spam') $$,
  '42501', null, 'a stranger cannot add items');
reset role;

select * from finish();
rollback;
