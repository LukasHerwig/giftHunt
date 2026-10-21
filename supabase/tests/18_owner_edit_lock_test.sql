begin;
create extension if not exists pgtap with schema extensions;
select plan(10);
\ir _seed.psql

-- W1 has an active link (tok-w1): the owner may add but not edit or delete
:as_owner
update wishlist_items set title = 'Ändrad' where id = :'i1';
delete from wishlist_items where id = :'i3';
select lives_ok(
  $$ insert into wishlist_items (wishlist_id, title) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Ny') $$,
  'owner can still add items to a shared list');
select is((select count(*)::int from wishlist_items where wishlist_id = :'w1'), 4, 'owner still reads the items of a shared list');
reset role;
select is((select title from wishlist_items where id = :'i1'), 'Bok', 'owner cannot edit an item while the link is active');
select ok(exists (select 1 from wishlist_items where id = :'i3'), 'owner cannot delete an item while the link is active');

-- The organizer is not affected
:as_admin
update wishlist_items set title = 'Bok (arrangör)' where id = :'i1';
reset role;
select is((select title from wishlist_items where id = :'i1'), 'Bok (arrangör)', 'the organizer can edit while the link is active');

-- Link turned off: the owner edits directly; turned on again: locked again
update share_links set is_active = false where token = 'tok-w1';
:as_owner
update wishlist_items set title = 'Bok (ägare)' where id = :'i1';
reset role;
select is((select title from wishlist_items where id = :'i1'), 'Bok (ägare)', 'owner can edit once the link is turned off');

update share_links set is_active = true where token = 'tok-w1';
:as_owner
update wishlist_items set title = 'Igen' where id = :'i1';
reset role;
select is((select title from wishlist_items where id = :'i1'), 'Bok (ägare)', 'turning the link on again locks the owner out again');

-- An expired link does not lock; neither does a list without a link
insert into wishlist_items (id, wishlist_id, title) values
  ('bbbbbbbb-0000-0000-0000-000000000009', :'w4', 'Gammal sak'),
  ('bbbbbbbb-0000-0000-0000-00000000000a', :'w2', 'Julklapp');
:as_owner
update wishlist_items set title = 'a' where id = 'bbbbbbbb-0000-0000-0000-000000000009';
delete from wishlist_items where id = 'bbbbbbbb-0000-0000-0000-00000000000a';
reset role;
select is((select title from wishlist_items where id = 'bbbbbbbb-0000-0000-0000-000000000009'), 'a', 'owner can edit when the only link has expired');
select ok(not exists (select 1 from wishlist_items where id = 'bbbbbbbb-0000-0000-0000-00000000000a'), 'owner can delete on a list without a link');

-- A self-managed owner is the organizer and is never locked
insert into share_links (wishlist_id, token, created_by) values (:'w3', 'tok-w3', :'u_self');
:as_self
update wishlist_items set title = 'Napp 2' where id = :'i4';
reset role;
select is((select title from wishlist_items where id = :'i4'), 'Napp 2', 'a self-managed owner can edit while the link is active');

select * from finish();
rollback;
