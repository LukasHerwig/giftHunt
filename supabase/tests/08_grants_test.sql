begin;
create extension if not exists pgtap with schema extensions;
select plan(7);
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

-- No stray policy (e.g. drift in production) may survive next to the new set.
select set_eq(
  $$ select policyname::text from pg_policies
     where schemaname = 'public'
       and tablename in ('wishlists','wishlist_items','item_claims','share_links','wishlist_admins','admin_invitations','profiles') $$,
  $$ values
    ('invitations_owner_read'),
    ('invitations_owner_insert'),
    ('invitations_owner_delete'),
    ('invitations_invitee_read'),
    ('admins_read'),
    ('admins_owner_self_insert'),
    ('admins_owner_delete'),
    ('profiles_own_all'),
    ('profiles_related_read'),
    ('wishlists_owner_all'),
    ('wishlists_admin_read'),
    ('wishlists_invitee_read'),
    ('items_owner_all'),
    ('items_admin_all'),
    ('claims_admin_read'),
    ('claims_admin_delete'),
    ('share_links_admin_read'),
    ('share_links_admin_insert'),
    ('share_links_admin_update'),
    ('share_links_admin_delete') $$,
  'the seven tables carry exactly the expected policies');

select * from finish();
rollback;
