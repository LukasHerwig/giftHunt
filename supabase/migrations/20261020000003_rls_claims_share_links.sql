-- item_claims: only the list's admin reads or removes claims. Givers claim
-- through claim_shared_item().
drop policy if exists "anyone_can_insert_claims" on public.item_claims;
drop policy if exists "anyone_can_read_claims"   on public.item_claims;
drop policy if exists "admins_can_delete_claims" on public.item_claims;

create policy "claims_admin_read" on public.item_claims
  for select to authenticated
  using (public.is_wishlist_admin(public.item_wishlist_id(item_id)));

create policy "claims_admin_delete" on public.item_claims
  for delete to authenticated
  using (public.is_wishlist_admin(public.item_wishlist_id(item_id)));

-- share_links: admin only. The owner never sees the token; anon resolves a
-- token through get_shared_wishlist().
drop policy if exists "anyone_can_read_share_links"     on public.share_links;
drop policy if exists "creators_can_manage_share_links" on public.share_links;
drop policy if exists "share_links_create"              on public.share_links;
drop policy if exists "share_links_delete"              on public.share_links;
drop policy if exists "share_links_own_access"          on public.share_links;
drop policy if exists "share_links_update"              on public.share_links;

create policy "share_links_admin_read" on public.share_links
  for select to authenticated
  using (public.is_wishlist_admin(wishlist_id));

create policy "share_links_admin_insert" on public.share_links
  for insert to authenticated
  with check (public.is_wishlist_admin(wishlist_id) and created_by = auth.uid());

create policy "share_links_admin_update" on public.share_links
  for update to authenticated
  using (public.is_wishlist_admin(wishlist_id))
  with check (public.is_wishlist_admin(wishlist_id));

create policy "share_links_admin_delete" on public.share_links
  for delete to authenticated
  using (public.is_wishlist_admin(wishlist_id));
