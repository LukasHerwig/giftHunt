begin;
create extension if not exists pgtap with schema extensions;
select plan(14);
\ir _seed.psql

-- Stranger: sees and changes nothing
:as_stranger
select is((select count(*)::int from wishlists), 0, 'stranger sees no wishlists');
select is((select count(*)::int from wishlist_items), 0, 'stranger sees no items');
update wishlist_items set title = 'Hacked' where id = :'i1';
delete from wishlist_items where id = :'i1';
select throws_ok(
  $$ insert into wishlist_items (wishlist_id, title) values ('aaaaaaaa-0000-0000-0000-000000000001', 'X') $$,
  '42501', null, 'stranger cannot add items');
reset role;
select is((select title from wishlist_items where id = :'i1'), 'Bok', 'stranger update and delete had no effect');

-- (anon is covered by 08_grants_test.sql: after Task 8 anon has no table privileges at all)

-- Owner: full access to own lists
:as_owner
select is((select count(*)::int from wishlists), 3, 'owner sees their three lists');
select is((select count(*)::int from wishlist_items where wishlist_id = :'w1'), 3, 'owner sees W1 items');
select lives_ok(
  $$ insert into wishlist_items (wishlist_id, title) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Ny') $$,
  'owner can add items');
update wishlist_items set title = 'Bok 2' where id = :'i1';
select is((select count(*)::int from wishlist_items where wishlist_id = :'w3'), 0, 'owner cannot see someone else''s list items');
reset role;
select is((select title from wishlist_items where id = :'i1'), 'Bok', 'owner update is refused on a shared list (see 18)');

-- Admin: reads the list, full access to its items
:as_admin
select is((select count(*)::int from wishlists), 1, 'admin sees the list they organize');
update wishlist_items set is_taken = false, taken_by_name = null where id = :'i3';
update wishlists set title = 'X' where id = :'w1';
reset role;
select ok(not (select is_taken from wishlist_items where id = :'i3'), 'admin can untake an item');
select is((select title from wishlists where id = :'w1'), 'Födelsedag', 'admin cannot change the list itself');

-- Invitee: can read the list they are invited to, nothing else
:as_invitee
select is((select title from wishlists where id = :'w2'), 'Jul', 'invitee sees the invited list');
select is((select count(*)::int from wishlists where id <> :'w2'), 0, 'invitee sees no other list');
reset role;

select * from finish();
rollback;
