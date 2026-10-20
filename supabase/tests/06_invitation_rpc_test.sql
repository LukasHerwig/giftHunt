begin;
create extension if not exists pgtap with schema extensions;
select plan(10);
\ir _seed.psql

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
reset role;

select ok((select accepted from admin_invitations where id = :'inv_w2'), 'the invitation is marked accepted');
select is(
  (select admin_id from wishlist_admins where wishlist_id = :'w2'), :'u_invitee'::uuid,
  'the invitee is now admin of W2');

select * from finish();
rollback;
