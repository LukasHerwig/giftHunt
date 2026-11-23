begin;
create extension if not exists pgtap with schema extensions;
select plan(17);
\ir _seed.psql

\set u_help1 '11111111-0000-0000-0000-000000000006'
\set u_help2 '11111111-0000-0000-0000-000000000007'
\set as_help1 'set local request.jwt.claims = ''{"sub":"11111111-0000-0000-0000-000000000006","email":"help1@test.se","role":"authenticated"}''; set local role authenticated;'
\set as_help2 'set local request.jwt.claims = ''{"sub":"11111111-0000-0000-0000-000000000007","email":"help2@test.se","role":"authenticated"}''; set local role authenticated;'

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', :'u_help1', 'authenticated', 'authenticated', 'help1@test.se', '', '{}', '{"full_name":"Hanna Help"}', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'u_help2', 'authenticated', 'authenticated', 'help2@test.se', '', '{}', '{"full_name":"Hugo Help"}',  now(), now(), now());

-- Self-managed W3: several invitations are allowed
:as_self
select lives_ok(
  $$ insert into public.admin_invitations (wishlist_id, email, invitation_token, invited_by, expires_at) values
       ('aaaaaaaa-0000-0000-0000-000000000003', 'help1@test.se', 'inv-h1', '11111111-0000-0000-0000-000000000005', now() + interval '7 days'),
       ('aaaaaaaa-0000-0000-0000-000000000003', 'help2@test.se', 'inv-h2', '11111111-0000-0000-0000-000000000005', now() + interval '7 days') $$,
  'two invitations on a self-managed list');
select throws_ok(
  $$ insert into public.admin_invitations (wishlist_id, email, invitation_token, invited_by, expires_at)
     values ('aaaaaaaa-0000-0000-0000-000000000003', 'HELP1@test.se', 'inv-h1b', '11111111-0000-0000-0000-000000000005', now() + interval '7 days') $$,
  '23505', null, 'the same address twice (case-insensitive) is refused while pending');
select throws_ok(
  $$ insert into public.admin_invitations (wishlist_id, email, invitation_token, invited_by, expires_at)
     values ('aaaaaaaa-0000-0000-0000-000000000003', 'self@test.se', 'inv-me', '11111111-0000-0000-0000-000000000005', now() + interval '7 days') $$,
  'P0001', 'cannot_invite_self', 'the creator cannot invite themselves');
reset role;

-- Both helpers accept
:as_help1
select lives_ok(
  $$ select public.accept_invitation((select id from public.admin_invitations where invitation_token = 'inv-h1')) $$,
  'help1 accepts');
reset role;
:as_help2
select lives_ok(
  $$ select public.accept_invitation((select id from public.admin_invitations where invitation_token = 'inv-h2')) $$,
  'help2 accepts');
reset role;

select is((select count(*)::int from public.wishlist_admins where wishlist_id = :'w3'), 3,
  'W3 has the creator and two helpers');
select is((select accepted_by from public.admin_invitations where invitation_token = 'inv-h1'), :'u_help1'::uuid,
  'accepted_by is help1');
select is((select accepted_by from public.admin_invitations where invitation_token = 'inv-h2'), :'u_help2'::uuid,
  'accepted_by is help2');

:as_self
select throws_ok(
  $$ insert into public.admin_invitations (wishlist_id, email, invitation_token, invited_by, expires_at)
     values ('aaaaaaaa-0000-0000-0000-000000000003', 'help1@test.se', 'inv-h1c', '11111111-0000-0000-0000-000000000005', now() + interval '7 days') $$,
  'P0001', 'already_helper', 'an existing helper cannot be invited again');
reset role;

-- Only the owner reaches the invitation rules: nobody else can probe addresses
:as_stranger
select throws_ok(
  $$ insert into public.admin_invitations (wishlist_id, email, invitation_token, invited_by, expires_at)
     values ('aaaaaaaa-0000-0000-0000-000000000003', 'self@test.se', 'inv-s1', '11111111-0000-0000-0000-000000000003', now() + interval '7 days') $$,
  '42501', 'not_owner', 'a stranger cannot probe the creator''s address');
reset role;
:as_help1
select throws_ok(
  $$ insert into public.admin_invitations (wishlist_id, email, invitation_token, invited_by, expires_at)
     values ('aaaaaaaa-0000-0000-0000-000000000003', 'help2@test.se', 'inv-s2', '11111111-0000-0000-0000-000000000006', now() + interval '7 days') $$,
  '42501', 'not_owner', 'a helper cannot probe another helper''s address');
select throws_ok(
  $$ insert into public.admin_invitations (wishlist_id, email, invitation_token, invited_by, expires_at)
     values ('aaaaaaaa-0000-0000-0000-000000000003', 'self@test.se', 'inv-s3', '11111111-0000-0000-0000-000000000006', now() + interval '7 days') $$,
  '42501', 'not_owner', 'a helper cannot probe the creator''s address');
reset role;

-- Ordinary lists are unchanged
:as_owner
select throws_ok(
  $$ insert into public.admin_invitations (wishlist_id, email, invitation_token, invited_by, expires_at)
     values ('aaaaaaaa-0000-0000-0000-000000000002', 'other@test.se', 'inv-o', '11111111-0000-0000-0000-000000000001', now() + interval '7 days') $$,
  '23505', null, 'a second invitation on an ordinary list is refused');
reset role;

-- Any invitation row counts on an ordinary list, accepted or expired included
:as_owner
select throws_ok(
  $$ insert into public.admin_invitations (wishlist_id, email, invitation_token, invited_by, expires_at)
     values ('aaaaaaaa-0000-0000-0000-000000000004', 'other@test.se', 'inv-o4', '11111111-0000-0000-0000-000000000001', now() + interval '7 days') $$,
  '23505', null, 'an expired invitation still blocks a new one on an ordinary list');
reset role;

select throws_ok(
  $$ insert into public.wishlist_admins (wishlist_id, admin_id, invited_by)
     values ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001') $$,
  'P0001', 'admin_already_exists', 'a second organizer on an ordinary list is refused');
select lives_ok(
  $$ insert into public.wishlist_admins (wishlist_id, admin_id, invited_by)
     values ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001')
     on conflict (wishlist_id, admin_id) do nothing $$,
  'the same organizer again does nothing');
select is((select count(*)::int from public.wishlist_admins where wishlist_id = :'w1'), 1,
  'W1 still has one organizer');

select * from finish();
rollback;
