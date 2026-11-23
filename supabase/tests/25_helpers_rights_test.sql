begin;
create extension if not exists pgtap with schema extensions;
select plan(25);
\ir _seed.psql

\set u_help1 '11111111-0000-0000-0000-000000000006'
\set as_help1 'set local request.jwt.claims = ''{"sub":"11111111-0000-0000-0000-000000000006","email":"help1@test.se","role":"authenticated"}''; set local role authenticated;'

create function public.t_rows(q text) returns int language plpgsql as $f$
declare n int;
begin execute 'with x as (' || q || ') select count(*) from x' into n; return n; end $f$;

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, email_confirmed_at, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', :'u_help1', 'authenticated', 'authenticated', 'help1@test.se', '', '{}', '{"full_name":"Hanna Help"}', now(), now(), now());

-- Set-up as postgres: help1 is a helper on W3
insert into public.wishlist_admins (wishlist_id, admin_id, invited_by) values (:'w3', :'u_help1', :'u_self');
insert into public.share_links (wishlist_id, token, created_by) values (:'w3', 'tok-w3', :'u_self');
insert into public.wishlist_items (id, wishlist_id, title, is_giftcard, claim_cap) values
  ('bbbbbbbb-0000-0000-0000-000000000005', :'w3', 'Presentkort', true, 3);
insert into public.item_claims (item_id, claimer_name) values ('bbbbbbbb-0000-0000-0000-000000000005', 'Kim');
update public.wishlist_items set is_taken = true, taken_by_name = 'Lo' where id = :'i4';
insert into public.admin_invitations (wishlist_id, email, invitation_token, invited_by, expires_at)
  values (:'w3', 'later@test.se', 'inv-w3', :'u_self', now() + interval '7 days');

:as_help1
select lives_ok(
  $$ insert into public.wishlist_items (wishlist_id, title) values ('aaaaaaaa-0000-0000-0000-000000000003', 'Ny sak') $$,
  'helper adds an item on W3');
select is((select count(*)::int from public.wishlist_items_admin where wishlist_id = :'w3' and id = :'i4' and is_taken), 1,
  'helper sees is_taken through wishlist_items_admin');
select is(public.t_rows($q$update public.wishlist_items set is_taken = false where id = 'bbbbbbbb-0000-0000-0000-000000000004' returning 1$q$), 1,
  'helper makes i4 free');
select is(public.t_rows($q$update public.wishlist_items set title = 'Napp 2' where id = 'bbbbbbbb-0000-0000-0000-000000000004' returning 1$q$), 1,
  'helper edits i4');
select is(public.t_rows($q$delete from public.item_claims where item_id = 'bbbbbbbb-0000-0000-0000-000000000005' returning 1$q$), 1,
  'helper removes a claim');
select is(public.t_rows($q$delete from public.wishlist_items where id = 'bbbbbbbb-0000-0000-0000-000000000004' returning 1$q$), 1,
  'helper deletes i4');

select is((select count(*)::int from public.share_links where wishlist_id = :'w3'), 1, 'helper reads the share link');
select throws_ok(
  $$ insert into public.share_links (wishlist_id, token, created_by) values ('aaaaaaaa-0000-0000-0000-000000000003', 'tok-h', '11111111-0000-0000-0000-000000000006') $$,
  '42501', null, 'helper cannot create a share link');
select is(public.t_rows($q$update public.share_links set is_active = false where wishlist_id = 'aaaaaaaa-0000-0000-0000-000000000003' returning 1$q$), 0,
  'helper cannot deactivate the share link');
select is(public.t_rows($q$delete from public.share_links where wishlist_id = 'aaaaaaaa-0000-0000-0000-000000000003' returning 1$q$), 0,
  'helper cannot delete the share link');

select is(public.t_rows($q$update public.wishlists set title = 'Hackad' where id = 'aaaaaaaa-0000-0000-0000-000000000003' returning 1$q$), 0,
  'helper cannot rename the list');
select throws_ok($$ select public.archive_wishlist('aaaaaaaa-0000-0000-0000-000000000003') $$,
  '42501', 'not_owner', 'helper cannot archive');
select throws_ok(
  $$ insert into public.admin_invitations (wishlist_id, email, invitation_token, invited_by, expires_at)
     values ('aaaaaaaa-0000-0000-0000-000000000003', 'new@test.se', 'inv-new', '11111111-0000-0000-0000-000000000006', now() + interval '7 days') $$,
  '42501', null, 'helper cannot invite');
select is(public.t_rows($q$delete from public.wishlists where id = 'aaaaaaaa-0000-0000-0000-000000000003' returning 1$q$), 0,
  'helper cannot delete the list');
reset role;
select is((select count(*)::int from public.share_links where wishlist_id = :'w3'), 1, 'the share link is still there');
select is((select count(*)::int from public.wishlists where id = :'w3'), 1, 'W3 still exists');

:as_anon
select lives_ok($$ select public.get_shared_wishlist('tok-w3') $$, 'anon opens the W3 guest page');
select is(public.get_shared_wishlist('tok-w3')->'wishlist'->>'organizer_name', 'Siri Self', 'organizer is the creator');
select is(public.get_shared_wishlist('tok-w1')->'wishlist'->>'organizer_name', 'Ada Admin', 'ordinary list unchanged');
select is(public.get_invitation_by_token('inv-w3')->>'is_self_managed', 'true', 'W3 invitation is self-managed');
select is(public.get_invitation_by_token('inv-w2')->>'is_self_managed', 'false', 'inv-w2 is not');
reset role;

:as_self
select is(public.t_rows($q$delete from public.share_links where wishlist_id = 'aaaaaaaa-0000-0000-0000-000000000003' returning 1$q$), 1,
  'creator deletes the share link on W3');
select lives_ok(
  $$ insert into public.share_links (wishlist_id, token, created_by) values ('aaaaaaaa-0000-0000-0000-000000000003', 'tok-s2', '11111111-0000-0000-0000-000000000005') $$,
  'creator creates a share link on W3');
select is(public.t_rows($q$update public.share_links set is_active = false where token = 'tok-s2' returning 1$q$), 1,
  'creator updates a share link on W3');
reset role;

:as_admin
select throws_ok(
  $$ insert into public.wishlist_items (wishlist_id, title) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Nej') $$,
  '42501', null, 'organizer of an ordinary list still cannot add items');
reset role;

select * from finish();
rollback;
