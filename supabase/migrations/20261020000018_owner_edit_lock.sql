-- Once the organizer has an active share link, the owner can no longer edit or
-- delete existing items directly: those become change requests (request_item_change).
-- New items still go straight in. Turning the link off (or letting it expire)
-- lifts the lock. Previously only the frontend enforced this.
-- The organizer (and a self-managed owner, who is the organizer) keeps full access
-- through items_admin_all.
drop policy if exists "items_owner_all" on public.wishlist_items;

create policy "items_owner_select" on public.wishlist_items
  for select to authenticated
  using (public.is_wishlist_owner(wishlist_id));

create policy "items_owner_insert" on public.wishlist_items
  for insert to authenticated
  with check (public.is_wishlist_owner(wishlist_id));

create policy "items_owner_update" on public.wishlist_items
  for update to authenticated
  using (public.is_wishlist_owner(wishlist_id) and not public.wishlist_has_share_link(wishlist_id))
  with check (public.is_wishlist_owner(wishlist_id));

create policy "items_owner_delete" on public.wishlist_items
  for delete to authenticated
  using (public.is_wishlist_owner(wishlist_id) and not public.wishlist_has_share_link(wishlist_id));
