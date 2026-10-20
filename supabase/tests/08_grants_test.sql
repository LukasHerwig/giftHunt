begin;
create extension if not exists pgtap with schema extensions;
select plan(6);
\ir _seed.psql

:as_anon
select throws_ok($$ select count(*) from public.share_links $$, '42501', null, 'anon cannot list share tokens');
select throws_ok($$ select count(*) from public.profiles $$, '42501', null, 'anon cannot read profiles or emails');
select lives_ok($$ select public.get_shared_wishlist('tok-w1') $$, 'anon can still load the share page');
reset role;

select is(
  (select count(*)::int
   from unnest(array['wishlists','wishlist_items','item_claims','share_links','wishlist_admins','admin_invitations','profiles']) t,
        unnest(array['SELECT','INSERT','UPDATE','DELETE']) p
   where has_table_privilege('anon', 'public.' || t, p)),
  0, 'anon has no table privileges');

select is(
  (select count(*)::int
   from unnest(array['wishlists','wishlist_items','item_claims','share_links','wishlist_admins','admin_invitations','profiles']) t,
        unnest(array['SELECT','INSERT','UPDATE','DELETE']) p
   where has_table_privilege('authenticated', 'public.' || t, p)),
  28, 'authenticated has full DML (RLS decides the rows)');

select is(
  (select count(*)::int
   from unnest(array['wishlists','wishlist_items','item_claims','share_links','wishlist_admins','admin_invitations','profiles']) t,
        unnest(array['SELECT','INSERT','UPDATE','DELETE']) p
   where has_table_privilege('service_role', 'public.' || t, p)),
  28, 'service_role has full DML');

select * from finish();
rollback;
