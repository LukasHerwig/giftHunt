begin;
create extension if not exists pgtap with schema extensions;
select plan(16);
\ir _seed.psql

:as_anon
select is(public.get_shared_wishlist('tok-w1') -> 'wishlist' ->> 'title', 'Födelsedag', 'anon loads the list by token');
select is(public.get_shared_wishlist('tok-w1') -> 'wishlist' ->> 'creator_name', 'Olle Owner', 'creator name is included');
select is(json_array_length(public.get_shared_wishlist('tok-w1') -> 'items'), 3, 'all items are returned');
select is(public.get_shared_wishlist('tok-w1') -> 'items' -> 0 ->> 'title', 'Presentkort', 'highest priority first');
select is((public.get_shared_wishlist('tok-w1') -> 'items' -> 0 ->> 'claim_count')::int, 1, 'claim count is included');
select ok(not (public.get_shared_wishlist('tok-w1')::jsonb -> 'items' -> 0 ? 'taken_by_name'), 'who took what is never returned');
select throws_ok($$ select public.get_shared_wishlist('nope') $$, 'P0002', 'invalid_link', 'unknown token is refused');
select throws_ok($$ select public.get_shared_wishlist('tok-expired') $$, 'P0001', 'expired_link', 'expired token is refused');

-- Regular item
select lives_ok($$ select public.claim_shared_item('tok-w1', 'bbbbbbbb-0000-0000-0000-000000000001', '  Mia  ') $$, 'anon claims a regular item');
select throws_ok($$ select public.claim_shared_item('tok-w1', 'bbbbbbbb-0000-0000-0000-000000000001', 'Noa') $$, 'P0001', 'already_taken', 'a taken item cannot be claimed again');

-- Gift card with claim_cap 2 and one existing claim by Kim
select throws_ok($$ select public.claim_shared_item('tok-w1', 'bbbbbbbb-0000-0000-0000-000000000002', 'Kim') $$, '23505', null, 'the same name cannot claim a gift card twice');
select lives_ok($$ select public.claim_shared_item('tok-w1', 'bbbbbbbb-0000-0000-0000-000000000002', 'Noa') $$, 'second gift-card claim fits under the cap');
select throws_ok($$ select public.claim_shared_item('tok-w1', 'bbbbbbbb-0000-0000-0000-000000000002', 'Pia') $$, 'P0001', 'claim_cap_reached', 'the cap is enforced');

-- Wrong list, bad name, bad link
select throws_ok($$ select public.claim_shared_item('tok-w1', 'bbbbbbbb-0000-0000-0000-000000000004', 'Mia') $$, 'P0002', 'item_not_found', 'an item from another list cannot be claimed');
select throws_ok($$ select public.claim_shared_item('tok-w1', 'bbbbbbbb-0000-0000-0000-000000000004', '   ') $$, '22023', 'invalid_name', 'an empty name is refused');
reset role;

select results_eq(
  $$ select is_taken, taken_by_name from wishlist_items where id = 'bbbbbbbb-0000-0000-0000-000000000001' $$,
  $$ values (true, 'Mia') $$,
  'the claim is stored with the trimmed name');

select * from finish();
rollback;
