begin;
create extension if not exists pgtap with schema extensions;
select plan(10);
\ir _seed.psql

:as_owner
select ok(public.wishlist_has_share_link(:'w1'), 'owner learns W1 is shared');
select ok(not public.wishlist_has_share_link(:'w2'), 'W2 is not shared');
select ok(not public.wishlist_has_share_link(:'w4'), 'an expired link does not count');
reset role;

:as_stranger
select ok(not public.wishlist_has_share_link(:'w1'), 'a stranger learns nothing');
select throws_ok(
  $$ select public.remove_wishlist_admin('aaaaaaaa-0000-0000-0000-000000000001') $$,
  '42501', 'not_owner', 'only the owner can remove the admin');
reset role;

:as_owner
select is(
  public.remove_wishlist_admin(:'w1')::jsonb,
  '{"admin_email": "admin@test.se", "had_share_links": true}'::jsonb,
  'owner removes the admin and learns links were deleted');
reset role;

select is((select count(*)::int from share_links where wishlist_id = :'w1'), 0, 'share links are deleted');
select is((select count(*)::int from wishlist_admins where wishlist_id = :'w1'), 0, 'the admin row is deleted');
select ok(not (select is_taken from wishlist_items where id = :'i3'), 'taken items are untaken');

:as_owner
select is(
  public.remove_wishlist_admin(:'w2')::jsonb,
  '{"admin_email": null, "had_share_links": false}'::jsonb,
  'removing when there is no admin is harmless');
reset role;

select * from finish();
rollback;
