begin;
create extension if not exists pgtap with schema extensions;
select plan(11);
\ir _seed.psql

-- Owner: no claims, no share-link tokens (surprise protection)
:as_owner
select is((select count(*)::int from item_claims), 0, 'owner cannot read claims');
select is((select count(*)::int from share_links), 0, 'owner cannot read share links');
delete from share_links where wishlist_id = :'w1';
reset role;
select is((select count(*)::int from share_links where wishlist_id = :'w1'), 1, 'owner cannot delete share links directly');

-- Stranger and anon: nothing
:as_stranger
select is((select count(*)::int from share_links), 0, 'stranger cannot list share links');
select is((select count(*)::int from item_claims), 0, 'stranger cannot read claims');
select throws_ok(
  $$ insert into share_links (wishlist_id, token, created_by) values ('aaaaaaaa-0000-0000-0000-000000000001', 'evil', '11111111-0000-0000-0000-000000000003') $$,
  '42501', null, 'stranger cannot create a share link');
reset role;

:as_anon
select throws_ok(
  $$ insert into item_claims (item_id, claimer_name) values ('bbbbbbbb-0000-0000-0000-000000000001', 'Evil') $$,
  '42501', null, 'anon cannot insert claims directly');
reset role;

-- Admin: reads claims and links, can remove a claim and create a link
:as_admin
select is((select count(*)::int from item_claims), 1, 'admin reads claims of their list');
select is((select token from share_links where wishlist_id = :'w1'), 'tok-w1', 'admin reads the share link');
delete from item_claims where item_id = :'i2';
reset role;
select is((select count(*)::int from item_claims where item_id = :'i2'), 0, 'admin can remove a claim');

-- Self-managed creator acts as admin of their own list
:as_self
select lives_ok(
  $$ insert into share_links (wishlist_id, token, created_by) values ('aaaaaaaa-0000-0000-0000-000000000003', 'tok-w3', '11111111-0000-0000-0000-000000000005') $$,
  'self-managed creator can create a share link');
reset role;

select * from finish();
rollback;
