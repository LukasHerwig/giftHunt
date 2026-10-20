begin;
create extension if not exists pgtap with schema extensions;
select plan(2);
\ir _seed.psql

-- The owner invites their own address to a list without an admin
delete from admin_invitations where wishlist_id = :'w4';
insert into admin_invitations (id, wishlist_id, email, invitation_token, invited_by, expires_at)
values (:'inv_w4', :'w4', 'owner@test.se', 'inv-w4-self', :'u_owner', now() + interval '7 days');

:as_owner
select throws_ok(
  format('select public.accept_invitation(%L)', :'inv_w4'),
  'P0001', 'owner_cannot_be_admin', 'the owner cannot accept an invitation to their own list');
reset role;

select is(
  (select count(*)::int from wishlist_admins where wishlist_id = :'w4'), 0,
  'the owner did not become admin of their own list');

select * from finish();
rollback;
