-- Who took what is for the organizer only. RLS filters rows, not columns, so the
-- claim columns of wishlist_items are taken away from every signed-in user and the
-- organizer reads them through wishlist_items_admin instead. The view runs as its
-- owner (postgres) and filters rows itself with is_wishlist_admin().
-- claimed_by / claimed_at are unused legacy columns and go with them.
-- A column added to wishlist_items later has no grant until it is added to the list
-- below (test 19 fails until then).
revoke select on public.wishlist_items from authenticated;

grant select (id, wishlist_id, title, description, price_range, priority,
              created_at, updated_at, url, link, is_giftcard, claim_cap)
  on public.wishlist_items to authenticated;

create view public.wishlist_items_admin with (security_invoker = false) as
select id, wishlist_id, title, description, price_range, priority,
       created_at, updated_at, url, link, is_giftcard, claim_cap,
       is_taken, taken_by_name, taken_at
from public.wishlist_items
where public.is_wishlist_admin(wishlist_id);

revoke all on public.wishlist_items_admin from public, anon;
grant select on public.wishlist_items_admin to authenticated, service_role;
