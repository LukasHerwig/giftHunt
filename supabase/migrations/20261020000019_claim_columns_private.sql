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

-- security_barrier: a filter on a claim column must not run before the admin check
create view public.wishlist_items_admin with (security_invoker = false, security_barrier = true) as
select id, wishlist_id, title, description, price_range, priority,
       created_at, updated_at, url, link, is_giftcard, claim_cap,
       is_taken, taken_by_name, taken_at
from public.wishlist_items
where public.is_wishlist_admin(wishlist_id);

-- Supabase's default privileges grant a new view full DML to authenticated and
-- service_role, and a write through this view would run as its owner and skip RLS.
revoke all on public.wishlist_items_admin from public, anon, authenticated, service_role;
grant select on public.wishlist_items_admin to authenticated, service_role;

-- REVOKE only removes grants made by the role running it. If production has grants
-- from elsewhere (another grantor, PUBLIC), stop the push instead of shipping a leak.
do $$
declare
  c text;
begin
  foreach c in array array['is_taken', 'taken_by_name', 'taken_at', 'claimed_by', 'claimed_at'] loop
    if has_column_privilege('authenticated', 'public.wishlist_items', c, 'select')
       or has_column_privilege('anon', 'public.wishlist_items', c, 'select') then
      raise exception 'claim column % is still readable by authenticated or anon', c;
    end if;
  end loop;
  if has_table_privilege('anon', 'public.wishlist_items_admin', 'select')
     or has_table_privilege('authenticated', 'public.wishlist_items_admin', 'insert')
     or has_table_privilege('authenticated', 'public.wishlist_items_admin', 'update')
     or has_table_privilege('authenticated', 'public.wishlist_items_admin', 'delete') then
    raise exception 'wishlist_items_admin has unexpected privileges';
  end if;
end $$;
