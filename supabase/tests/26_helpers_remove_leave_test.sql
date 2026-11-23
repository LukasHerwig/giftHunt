begin;
create extension if not exists pgtap with schema extensions;
select plan(27);
\ir _seed.psql

\set u_help1 '11111111-0000-0000-0000-000000000006'
\set u_help2 '11111111-0000-0000-0000-000000000007'
\set as_help1 'set local request.jwt.claims = ''{"sub":"11111111-0000-0000-0000-000000000006","email":"help1@test.se","role":"authenticated"}''; set local role authenticated;'
\set as_help2 'set local request.jwt.claims = ''{"sub":"11111111-0000-0000-0000-000000000007","email":"help2@test.se","role":"authenticated"}''; set local role authenticated;'

create function public.t_rows(q text) returns int language plpgsql as $f$
declare n int;
begin execute 'with x as (' || q || ') select count(*) from x' into n; return n; end $f$;

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', :'u_help1', 'authenticated', 'authenticated', 'help1@test.se', '', '{}', '{"full_name":"Hanna Help"}', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'u_help2', 'authenticated', 'authenticated', 'help2@test.se', '', '{}', '{"full_name":"Hugo Help"}',  now(), now(), now());

-- Set-up as postgres: two helpers through accepted invitations, a share link, a taken item, a claim
insert into public.admin_invitations (wishlist_id, email, invitation_token, invited_by, expires_at, accepted, accepted_by) values
  (:'w3', 'help1@test.se', 'inv-h1', :'u_self', now() + interval '7 days', true, :'u_help1'),
  (:'w3', 'help2@test.se', 'inv-h2', :'u_self', now() + interval '7 days', true, :'u_help2');
insert into public.wishlist_admins (wishlist_id, admin_id, invited_by) values
  (:'w3', :'u_help1', :'u_self'), (:'w3', :'u_help2', :'u_self');
insert into public.share_links (wishlist_id, token, created_by) values (:'w3', 'tok-w3', :'u_self');
update public.wishlist_items set is_taken = true, taken_by_name = 'Lo' where id = :'i4';
insert into public.wishlist_items (id, wishlist_id, title, is_giftcard, claim_cap) values
  ('bbbbbbbb-0000-0000-0000-000000000005', :'w3', 'Presentkort', true, 3);
insert into public.item_claims (item_id, claimer_name) values ('bbbbbbbb-0000-0000-0000-000000000005', 'Kim');

-- Who may remove
:as_stranger
select throws_ok($$ select public.remove_wishlist_helper('aaaaaaaa-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000006') $$,
  '42501', 'not_owner', 'a stranger cannot remove a helper');
reset role;
:as_help2
select throws_ok($$ select public.remove_wishlist_helper('aaaaaaaa-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000006') $$,
  '42501', 'not_owner', 'a helper cannot remove another helper');
reset role;

:as_self
select throws_ok($$ select public.remove_wishlist_helper('aaaaaaaa-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000005') $$,
  'P0001', 'cannot_remove_creator', 'the creator cannot be removed');
select throws_ok($$ select public.remove_wishlist_helper('aaaaaaaa-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003') $$,
  'P0002', 'not_helper', 'a non-helper cannot be removed');
reset role;
:as_owner
select throws_ok($$ select public.remove_wishlist_helper('aaaaaaaa-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002') $$,
  'P0001', 'not_self_managed', 'not on an ordinary list');
reset role;

-- Removal
:as_self
select lives_ok($$ select public.remove_wishlist_helper('aaaaaaaa-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000006') $$,
  'the creator removes help1');
reset role;
select is((select count(*)::int from public.wishlist_admins where wishlist_id = :'w3' and admin_id = :'u_help1'), 0, 'help1 admin row is gone');
select is((select count(*)::int from public.admin_invitations where invitation_token = 'inv-h1'), 0, 'help1 invitation is gone');
select is((select count(*)::int from public.wishlist_admins where wishlist_id = :'w3' and admin_id = :'u_help2'), 1, 'help2 is untouched');
select is((select count(*)::int from public.admin_invitations where invitation_token = 'inv-h2'), 1, 'help2 invitation is untouched');
select is((select count(*)::int from public.share_links where wishlist_id = :'w3'), 1, 'the share link is untouched');
select is((select is_taken from public.wishlist_items where id = :'i4'), true, 'i4 is still taken');
select is((select count(*)::int from public.item_claims where item_id = 'bbbbbbbb-0000-0000-0000-000000000005'), 1, 'claims are untouched');

:as_help1
select is(public.t_rows($q$select 1 from public.wishlists where id = 'aaaaaaaa-0000-0000-0000-000000000003'$q$), 0, 'help1 no longer sees the list');
select is(public.t_rows($q$select 1 from public.wishlist_items where wishlist_id = 'aaaaaaaa-0000-0000-0000-000000000003'$q$), 0, 'help1 no longer sees items');
select is(public.t_rows($q$select 1 from public.wishlist_items_admin where wishlist_id = 'aaaaaaaa-0000-0000-0000-000000000003'$q$), 0, 'help1 no longer sees the admin view');
select is(public.t_rows($q$select 1 from public.item_claims where item_id = 'bbbbbbbb-0000-0000-0000-000000000005'$q$), 0, 'help1 no longer sees claims');
reset role;

:as_self
select lives_ok(
  $$ insert into public.admin_invitations (wishlist_id, email, invitation_token, invited_by, expires_at)
     values ('aaaaaaaa-0000-0000-0000-000000000003', 'help1@test.se', 'inv-h1b', '11111111-0000-0000-0000-000000000005', now() + interval '7 days') $$,
  'help1 can be invited again');
reset role;

-- Leaving
:as_help2
select lives_ok($$ select public.leave_wishlist('aaaaaaaa-0000-0000-0000-000000000003') $$, 'help2 leaves');
reset role;
select is((select count(*)::int from public.wishlist_admins where wishlist_id = :'w3' and admin_id = :'u_help2')
        + (select count(*)::int from public.admin_invitations where invitation_token = 'inv-h2'), 0,
  'help2 row and invitation are gone');
:as_self
select throws_ok($$ select public.leave_wishlist('aaaaaaaa-0000-0000-0000-000000000003') $$,
  'P0002', 'not_helper', 'the creator cannot leave');
select throws_ok($$ select public.remove_wishlist_admin('aaaaaaaa-0000-0000-0000-000000000003') $$,
  'P0001', 'self_managed', 'remove_wishlist_admin refuses self-managed lists');
reset role;
select is((select count(*)::int from public.wishlist_admins where wishlist_id = :'w3' and admin_id = :'u_self'), 1,
  'the creator row is still there');

-- Archive with a pending helper invitation
:as_self
select lives_ok(
  $$ insert into public.admin_invitations (id, wishlist_id, email, invitation_token, invited_by, expires_at)
     values ('cccccccc-0000-0000-0000-0000000000a2', 'aaaaaaaa-0000-0000-0000-000000000003', 'help2@test.se', 'inv-h2b', '11111111-0000-0000-0000-000000000005', now() + interval '7 days') $$,
  'help2 is invited again');
select lives_ok($$ select public.archive_wishlist('aaaaaaaa-0000-0000-0000-000000000003') $$, 'the list is archived');
reset role;
:as_help2
select throws_ok($$ select public.accept_invitation('cccccccc-0000-0000-0000-0000000000a2') $$,
  'P0002', 'invitation_not_found', 'a pending invitation cannot be accepted after archive');
reset role;
select is((select count(*)::int from public.wishlist_admins where wishlist_id = :'w3'), 1, 'only the creator row is left');

select * from finish();
rollback;
