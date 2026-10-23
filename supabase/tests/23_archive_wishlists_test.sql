begin;
create extension if not exists pgtap with schema extensions;
select plan(34);
\ir _seed.psql

-- A waiting change request on W1, to see it dropped by archiving
insert into public.item_change_requests (wishlist_id, item_id, item_title, kind, created_by)
values (:'w1', :'i1', 'Bok', 'remove', :'u_owner');

-- Only the owner can archive
:as_stranger
select throws_ok(
  $$ select public.archive_wishlist('aaaaaaaa-0000-0000-0000-000000000001') $$,
  '42501', 'not_owner', 'a stranger cannot archive');
reset role;

:as_admin
select throws_ok(
  $$ select public.archive_wishlist('aaaaaaaa-0000-0000-0000-000000000001') $$,
  '42501', 'not_owner', 'the organizer cannot archive');
reset role;

:as_owner
select lives_ok(
  $$ select public.archive_wishlist('aaaaaaaa-0000-0000-0000-000000000001') $$,
  'the owner archives W1');
select throws_ok(
  $$ select public.archive_wishlist('aaaaaaaa-0000-0000-0000-000000000001') $$,
  'P0001', 'already_archived', 'an archived list cannot be archived again');
reset role;

-- What archiving did
select ok((select archived_at is not null from public.wishlists where id = :'w1'), 'W1 is marked archived');
select is((select count(*)::int from public.share_links where wishlist_id = :'w1'), 0, 'the share link is deleted');
select is((select count(*)::int from public.wishlist_admins where wishlist_id = :'w1'), 0, 'the organizer is removed');
select is((select status from public.item_change_requests where wishlist_id = :'w1'), 'withdrawn', 'waiting change requests are dropped');
select is((select count(*)::int from public.wishlist_items where wishlist_id = :'w1'), 3, 'the items are kept');
select ok((select is_taken from public.wishlist_items where id = :'i3'), 'taken status is kept');
select is((select count(*)::int from public.item_claims where item_id = :'i2'), 1, 'claims are kept');

-- The organizer sees nothing any more
:as_admin
select is((select count(*)::int from public.wishlists where id = 'aaaaaaaa-0000-0000-0000-000000000001'), 0, 'the old organizer no longer sees the list');
select is((select count(*)::int from public.wishlist_items where wishlist_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 0, 'the old organizer no longer sees its items');
reset role;

-- The owner still reads it, but cannot change it
:as_owner
select is((select count(*)::int from public.wishlist_items where wishlist_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 3, 'the owner still reads the items');
update public.wishlists set title = 'Ändrad' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
update public.wishlist_items set title = 'Ändrad' where id = 'bbbbbbbb-0000-0000-0000-000000000001';
delete from public.wishlist_items where id = 'bbbbbbbb-0000-0000-0000-000000000001';
reset role;
select is((select title from public.wishlists where id = :'w1'), 'Födelsedag', 'the title of an archived list cannot be changed');
select is((select title from public.wishlist_items where id = :'i1'), 'Bok', 'an item of an archived list cannot be changed or deleted');
:as_owner
select throws_ok(
  $$ insert into public.wishlist_items (wishlist_id, title) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Ny') $$,
  '42501', null, 'an item cannot be added to an archived list');
reset role;

-- archived_at only changes through the functions
:as_owner
select throws_ok(
  $$ update public.wishlists set archived_at = now() where id = 'aaaaaaaa-0000-0000-0000-000000000004' $$,
  'P0001', 'archived_locked', 'the owner cannot archive with a plain update');
reset role;

-- Restore
:as_stranger
select throws_ok(
  $$ select public.unarchive_wishlist('aaaaaaaa-0000-0000-0000-000000000001') $$,
  '42501', 'not_owner', 'a stranger cannot restore');
reset role;

:as_owner
select throws_ok(
  $$ select public.unarchive_wishlist('aaaaaaaa-0000-0000-0000-000000000004') $$,
  'P0001', 'not_archived', 'a list that is not archived cannot be restored');
select lives_ok(
  $$ select public.unarchive_wishlist('aaaaaaaa-0000-0000-0000-000000000001') $$,
  'the owner restores W1');
reset role;

select ok((select archived_at is null from public.wishlists where id = :'w1'), 'W1 is no longer archived');

:as_anon
select throws_ok($$ select public.get_shared_wishlist('tok-w1') $$, 'P0002', 'invalid_link', 'the old share link stays dead after a restore');
reset role;

:as_owner
select lives_ok(
  $$ insert into public.wishlist_items (wishlist_id, title) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Ny') $$,
  'a restored list takes new items again');
reset role;

-- A pending invitation is removed, and none can be sent while archived
:as_owner
select lives_ok(
  $$ select public.archive_wishlist('aaaaaaaa-0000-0000-0000-000000000002') $$,
  'the owner archives W2');
reset role;
select is((select count(*)::int from public.admin_invitations where wishlist_id = :'w2'), 0, 'the pending invitation is removed');
:as_owner
select throws_ok(
  $$ insert into public.admin_invitations (wishlist_id, email, invitation_token, invited_by, expires_at)
     values ('aaaaaaaa-0000-0000-0000-000000000002', 'ny@test.se', 'inv-new', '11111111-0000-0000-0000-000000000001', now() + interval '7 days') $$,
  '42501', null, 'no invitation can be sent for an archived list');
reset role;

-- A self-managed list: the creator is the organizer and keeps that row, but is locked out of writing
:as_self
select lives_ok(
  $$ select public.archive_wishlist('aaaaaaaa-0000-0000-0000-000000000003') $$,
  'the creator archives a self-managed list');
reset role;
select is((select count(*)::int from public.wishlist_admins where wishlist_id = :'w3'), 1, 'the creator keeps their own organizer row');

:as_self
select throws_ok(
  $$ insert into public.wishlist_items (wishlist_id, title) values ('aaaaaaaa-0000-0000-0000-000000000003', 'Ny') $$,
  '42501', null, 'no item can be added to an archived self-managed list');
select throws_ok(
  $$ insert into public.share_links (wishlist_id, token, created_by)
     values ('aaaaaaaa-0000-0000-0000-000000000003', 'tok-w3', '11111111-0000-0000-0000-000000000005') $$,
  '42501', null, 'no share link can be made for an archived self-managed list');
update public.wishlist_items set title = 'Ändrad' where id = 'bbbbbbbb-0000-0000-0000-000000000004';
reset role;
select is((select title from public.wishlist_items where id = :'i4'), 'Napp', 'an item of an archived self-managed list cannot be changed');

:as_self
select lives_ok(
  $$ select public.unarchive_wishlist('aaaaaaaa-0000-0000-0000-000000000003') $$,
  'the creator restores the self-managed list');
select lives_ok(
  $$ insert into public.share_links (wishlist_id, token, created_by)
     values ('aaaaaaaa-0000-0000-0000-000000000003', 'tok-w3', '11111111-0000-0000-0000-000000000005') $$,
  'a restored self-managed list can be shared again');
reset role;

select * from finish();
rollback;
