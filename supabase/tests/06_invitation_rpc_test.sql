begin;
create extension if not exists pgtap with schema extensions;
select plan(14);
\ir _seed.psql

-- W1 already has an admin (u_admin); the invitee is invited to it anyway.
insert into admin_invitations (id, wishlist_id, email, invitation_token, invited_by, expires_at) values
  ('cccccccc-0000-0000-0000-000000000001', :'w1', 'invitee@test.se', 'inv-w1', :'u_owner', now() + interval '7 days');

:as_anon
select is(public.get_invitation_by_token('inv-w2') ->> 'wishlist_title', 'Jul', 'anon reads the invitation by token');
select is(public.get_invitation_by_token('inv-w2') ->> 'inviter_full_name', 'Olle Owner', 'the inviter''s name is included');
select ok(public.get_invitation_by_token('nope') is null, 'unknown token returns null');
select throws_ok(
  $$ select public.accept_invitation('cccccccc-0000-0000-0000-000000000002') $$,
  '42501', null, 'anon cannot accept');
reset role;

:as_stranger
select throws_ok(
  $$ select public.accept_invitation('cccccccc-0000-0000-0000-000000000002') $$,
  'P0002', 'invitation_not_found', 'someone else cannot accept the invitation');
reset role;

-- Signed in without an email claim (e.g. anonymous or phone auth)
set local request.jwt.claims = '{"sub":"11111111-0000-0000-0000-000000000003","role":"authenticated"}'; set local role authenticated;
select throws_ok(
  $$ select public.accept_invitation('cccccccc-0000-0000-0000-000000000002') $$,
  'P0002', 'invitation_not_found', 'a caller without an email claim cannot accept');
reset role;

-- An unconfirmed email proves nothing about the address
update auth.users set email_confirmed_at = null where id = :'u_invitee';
:as_invitee
select throws_ok(
  $$ select public.accept_invitation('cccccccc-0000-0000-0000-000000000002') $$,
  'P0001', 'email_not_confirmed', 'an unconfirmed email cannot accept');
reset role;
update auth.users set email_confirmed_at = now() where id = :'u_invitee';

:as_invitee
select throws_ok(
  $$ select public.accept_invitation('cccccccc-0000-0000-0000-000000000004') $$,
  'P0001', 'invitation_expired', 'an expired invitation cannot be accepted');
select lives_ok(
  $$ select public.accept_invitation('cccccccc-0000-0000-0000-000000000002') $$,
  'the invitee accepts (Invitee@test.se matches invitee@test.se)');
select throws_ok(
  $$ select public.accept_invitation('cccccccc-0000-0000-0000-000000000002') $$,
  'P0001', 'already_accepted', 'it cannot be accepted twice');
select throws_ok(
  $$ select public.accept_invitation('cccccccc-0000-0000-0000-000000000001') $$,
  'P0001', 'admin_already_exists', 'an invitation to a list that already has an admin is refused');
reset role;

select ok((select accepted from admin_invitations where id = 'cccccccc-0000-0000-0000-000000000001') = false,
  'the refused invitation stays unaccepted');
select ok((select accepted from admin_invitations where id = :'inv_w2'), 'the invitation is marked accepted');
select is(
  (select admin_id from wishlist_admins where wishlist_id = :'w2'), :'u_invitee'::uuid,
  'the invitee is now admin of W2');

select * from finish();
rollback;
