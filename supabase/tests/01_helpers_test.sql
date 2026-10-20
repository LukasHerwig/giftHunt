begin;
create extension if not exists pgtap with schema extensions;
select plan(9);
\ir _seed.psql

:as_owner
select ok(public.is_wishlist_owner(:'w1'), 'owner owns W1');
select ok(not public.is_wishlist_admin(:'w1'), 'owner is not admin of W1');
select ok(public.can_see_profile(:'u_admin'), 'owner can see the admin of their list');
select ok(not public.can_see_profile(:'u_stranger'), 'owner cannot see a stranger');
reset role;

:as_admin
select ok(public.is_wishlist_admin(:'w1'), 'admin administers W1');
select is(public.item_wishlist_id(:'i1'), :'w1'::uuid, 'item_wishlist_id resolves the wishlist');
reset role;

:as_invitee
select ok(public.has_pending_invitation(:'w2'), 'invitee has a pending invitation to W2 (case-insensitive email)');
select ok(not public.has_pending_invitation(:'w4'), 'expired invitation does not count');
reset role;

:as_anon
select throws_ok(
  $$ select public.is_wishlist_owner('aaaaaaaa-0000-0000-0000-000000000001') $$,
  '42501', null, 'anon cannot call the helpers');
reset role;

select * from finish();
rollback;
