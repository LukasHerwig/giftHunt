begin;
create extension if not exists pgtap with schema extensions;
select plan(2);
\ir _seed.psql

-- W1's admin accepted an invitation sent to an older address
insert into admin_invitations (wishlist_id, email, invitation_token, invited_by, expires_at, accepted)
values (:'w1', 'old-address@test.se', 'inv-w1-old', :'u_owner', now() + interval '7 days', true);

:as_owner
select is(public.remove_wishlist_admin(:'w1') ->> 'admin_email', 'admin@test.se', 'the admin is removed');
reset role;

select is(
  (select count(*)::int from admin_invitations where wishlist_id = :'w1'), 0,
  'the list''s invitation is gone even though it was sent to another address');

select * from finish();
rollback;
