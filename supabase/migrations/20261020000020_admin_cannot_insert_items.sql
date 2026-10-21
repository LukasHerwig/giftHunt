-- The owner decides what is on a list. An organizer shares it, keeps track of who
-- took what, and fixes mistakes (edit, delete, make free), but cannot add items.
-- items_admin_all covered insert too; replace it with the three rights an organizer
-- keeps. The owner (including the creator of a self-managed list) inserts through
-- items_owner_insert.
drop policy if exists "items_admin_all" on public.wishlist_items;

create policy "items_admin_select" on public.wishlist_items
  for select to authenticated
  using (public.is_wishlist_admin(wishlist_id));

create policy "items_admin_update" on public.wishlist_items
  for update to authenticated
  using (public.is_wishlist_admin(wishlist_id))
  with check (public.is_wishlist_admin(wishlist_id));

create policy "items_admin_delete" on public.wishlist_items
  for delete to authenticated
  using (public.is_wishlist_admin(wishlist_id));
