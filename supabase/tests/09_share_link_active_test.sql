begin;
create extension if not exists pgtap with schema extensions;
select plan(9);
\ir _seed.psql

-- Only the organizer can turn the link off
:as_owner
update share_links set is_active = false where wishlist_id = :'w1';
reset role;
select ok((select is_active from share_links where token = 'tok-w1'), 'the owner cannot turn the link off');

:as_admin
update share_links set is_active = false where wishlist_id = :'w1';
reset role;
select ok(not (select is_active from share_links where token = 'tok-w1'), 'the organizer can turn the link off');

:as_anon
select throws_ok($$ select public.get_shared_wishlist('tok-w1') $$, 'P0001', 'inactive_link', 'a turned-off link no longer opens the list');
select throws_ok(
  $$ select public.claim_shared_item('tok-w1', 'bbbbbbbb-0000-0000-0000-000000000001', 'Mia') $$,
  'P0002', 'invalid_link', 'a turned-off link cannot be used to claim (page still open)');
reset role;

:as_owner
select ok(not public.wishlist_has_share_link(:'w1'), 'a turned-off link does not count as shared');
reset role;

-- Turned back on, it works again
update share_links set is_active = true where token = 'tok-w1';
:as_anon
select lives_ok($$ select public.get_shared_wishlist('tok-w1') $$, 'a link turned back on works');
select throws_ok(
  $$ select public.claim_shared_item('tok-w1', 'bbbbbbbb-0000-0000-0000-000000000001', E'\n\t ') $$,
  '22023', 'invalid_name', 'a name of only tabs, newlines and spaces is refused');
select lives_ok(
  $$ select public.claim_shared_item('tok-w1', 'bbbbbbbb-0000-0000-0000-000000000001', E'\tMia\n') $$,
  'a name with surrounding whitespace is accepted');
reset role;
select is((select taken_by_name from wishlist_items where id = :'i1'), 'Mia', 'tabs and newlines are trimmed from the name');

select * from finish();
rollback;
