begin;
create extension if not exists pgtap with schema extensions;
select plan(15);
\ir _seed.psql

-- The owner of a shared list cannot read any claim column
:as_owner
select throws_ok($$ select is_taken from wishlist_items $$, '42501', null, 'owner cannot read is_taken');
select throws_ok($$ select taken_by_name from wishlist_items $$, '42501', null, 'owner cannot read taken_by_name');
select throws_ok($$ select claimed_by from wishlist_items $$, '42501', null, 'owner cannot read the legacy claimed_by');
select throws_ok($$ select * from wishlist_items $$, '42501', null, 'select * on the table is refused');
select lives_ok(
  $$ select id, wishlist_id, title, description, price_range, priority, created_at, updated_at, url, link, is_giftcard, claim_cap from wishlist_items $$,
  'owner can read every non-claim column');
reset role;

-- Even the organizer reads claims through the view, not the table
:as_admin
select throws_ok($$ select * from wishlist_items $$, '42501', null, 'organizer cannot select * from the table either');
select is((select count(*)::int from wishlist_items_admin where wishlist_id = :'w1'), 3, 'organizer reads the list through the view');
select is((select taken_by_name from wishlist_items_admin where id = :'i3'), 'Lo', 'the view shows who took an item');
reset role;

-- Owner (not organizer), stranger and anon get nothing from the view
:as_owner
select is((select count(*)::int from wishlist_items_admin), 0, 'owner sees no rows in the admin view');
reset role;
:as_stranger
select is((select count(*)::int from wishlist_items_admin), 0, 'stranger sees no rows in the admin view');
reset role;
:as_anon
select throws_ok($$ select * from wishlist_items_admin $$, '42501', null, 'anon cannot read the admin view');
reset role;

-- A self-managed owner is the organizer and sees claims on their own list
:as_self
select is((select count(*)::int from wishlist_items_admin), 1, 'self-managed owner reads their list through the view');
reset role;

-- Untake is still a plain table update for the organizer
:as_admin
update wishlist_items set is_taken = false, taken_by_name = null, taken_at = null where id = :'i3';
reset role;
select ok(not (select is_taken from wishlist_items where id = :'i3'), 'organizer can still untake with a table update');

-- The unreadable set is exactly the claim columns: a column added later without a
-- grant fails here instead of silently breaking the owner's screen.
select is(
  (select array_agg(column_name::text order by column_name)
   from information_schema.columns
   where table_schema = 'public' and table_name = 'wishlist_items'
     and not has_column_privilege('authenticated', 'public.wishlist_items', column_name, 'select')),
  array['claimed_at', 'claimed_by', 'is_taken', 'taken_at', 'taken_by_name'],
  'exactly the claim columns are unreadable for authenticated');

select ok(has_table_privilege('service_role', 'public.wishlist_items', 'select'), 'service_role can still read the table');

select * from finish();
rollback;
