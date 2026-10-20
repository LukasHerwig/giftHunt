begin;
create extension if not exists pgtap with schema extensions;
select plan(3);
\ir _seed.psql

-- W3 is self-managed by Siri, W2 has no organizer
insert into share_links (wishlist_id, token, created_by) values
  (:'w3', 'tok-w3', :'u_self'),
  (:'w2', 'tok-w2', :'u_owner');

:as_anon
select is(
  public.get_shared_wishlist('tok-w1') -> 'wishlist' ->> 'organizer_name',
  'Ada Admin', 'the organizer''s name is returned');
select is(
  public.get_shared_wishlist('tok-w3') -> 'wishlist' ->> 'organizer_name',
  'Siri Self', 'on a self-managed list the creator is the organizer');
select is(
  public.get_shared_wishlist('tok-w2') -> 'wishlist' ->> 'organizer_name',
  null::text, 'a list without an organizer returns null');
reset role;

select * from finish();
rollback;
