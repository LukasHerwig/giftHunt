begin;
create extension if not exists pgtap with schema extensions;
select plan(7);
\ir _seed.psql

-- The invitee turns a pending invitation down
:as_invitee
select lives_ok($$ select public.decline_invitation('cccccccc-0000-0000-0000-000000000002') $$,
  'the invitee can decline a pending invitation');
reset role;
select ok(not exists (select 1 from admin_invitations where id = :'inv_w2'), 'the invitation is gone');

-- The owner can invite again (one invitation per list)
:as_owner
select lives_ok(
  $$ insert into admin_invitations (id, wishlist_id, email, invitation_token, invited_by, expires_at)
     values ('cccccccc-0000-0000-0000-0000000000f1', 'aaaaaaaa-0000-0000-0000-000000000002', 'invitee@test.se', 'tok-f1',
             '11111111-0000-0000-0000-000000000001', now() + interval '7 days') $$,
  'the owner can invite again after a decline');
reset role;

-- An expired invitation can be cleared too
:as_invitee
select lives_ok($$ select public.decline_invitation('cccccccc-0000-0000-0000-000000000004') $$,
  'the invitee can decline an expired invitation');
reset role;

-- Nobody else can
:as_stranger
select throws_ok($$ select public.decline_invitation('cccccccc-0000-0000-0000-0000000000f1') $$,
  'P0002', 'invitation_not_found', 'a stranger cannot decline someone else''s invitation');
reset role;
:as_anon
select throws_ok($$ select public.decline_invitation('cccccccc-0000-0000-0000-0000000000f1') $$,
  '42501', null, 'anon cannot call decline_invitation');
reset role;

-- An accepted invitation stays
update admin_invitations set accepted = true where id = 'cccccccc-0000-0000-0000-0000000000f1';
:as_invitee
select throws_ok($$ select public.decline_invitation('cccccccc-0000-0000-0000-0000000000f1') $$,
  'P0001', 'already_accepted', 'an accepted invitation cannot be declined');
reset role;

select * from finish();
rollback;
