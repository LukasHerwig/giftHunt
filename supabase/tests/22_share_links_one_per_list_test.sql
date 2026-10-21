begin;
create extension if not exists pgtap with schema extensions;
select plan(3);
\ir _seed.psql

select throws_ok(
  $$ insert into public.share_links (wishlist_id, token, created_by)
     values ('aaaaaaaa-0000-0000-0000-000000000001', 'tok-second', '11111111-0000-0000-0000-000000000001') $$,
  '23505', null, 'a list cannot get a second share link');

select lives_ok(
  $$ insert into public.share_links (wishlist_id, token, created_by)
     values ('aaaaaaaa-0000-0000-0000-000000000002', 'tok-w2', '11111111-0000-0000-0000-000000000001') $$,
  'a list without a link can get one');

select is((select count(*)::int from public.share_links where wishlist_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  1, 'the list that had a link still has exactly one');

select * from finish();
rollback;
