-- Production policies may have drifted from the migration history (policies added
-- by hand with names the older migrations never dropped). Drop every policy on
-- these tables so only the ones created by this branch remain.
do $$
declare
  r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('wishlists','wishlist_items','item_claims','share_links',
                        'wishlist_admins','admin_invitations','profiles')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- wishlists: owner manages, admin and invitee read. Public access goes through
-- get_shared_wishlist() instead of table policies.
drop policy if exists "creators_can_manage_wishlists"        on public.wishlists;
drop policy if exists "admins_can_read_wishlists"            on public.wishlists;
drop policy if exists "public_can_read_via_share_links"      on public.wishlists;
drop policy if exists "allow_wishlist_read_for_invitations"  on public.wishlists;
drop policy if exists "wishlists_admin_read"                 on public.wishlists;
drop policy if exists "wishlists_creator_access"             on public.wishlists;

create policy "wishlists_owner_all" on public.wishlists
  for all to authenticated
  using (creator_id = auth.uid())
  with check (creator_id = auth.uid());

create policy "wishlists_admin_read" on public.wishlists
  for select to authenticated
  using (public.is_wishlist_admin(id));

create policy "wishlists_invitee_read" on public.wishlists
  for select to authenticated
  using (public.has_pending_invitation(id));

-- wishlist_items: owner and admin of the list. Claiming goes through claim_shared_item().
drop policy if exists "wishlist_items_policy" on public.wishlist_items;

create policy "items_owner_all" on public.wishlist_items
  for all to authenticated
  using (public.is_wishlist_owner(wishlist_id))
  with check (public.is_wishlist_owner(wishlist_id));

create policy "items_admin_all" on public.wishlist_items
  for all to authenticated
  using (public.is_wishlist_admin(wishlist_id))
  with check (public.is_wishlist_admin(wishlist_id));
