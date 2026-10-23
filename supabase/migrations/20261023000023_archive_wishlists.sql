-- Archive a wishlist: the owner keeps reading it, nobody else sees it, nothing can be
-- changed. archive_wishlist removes what the organizer and the givers rely on (the share
-- link, the invitation, the organizer, waiting change requests); items and claims stay.
-- unarchive_wishlist brings back a plain list: no organizer, no link.
alter table public.wishlists add column archived_at timestamptz;

create or replace function public.wishlist_is_archived(p_wishlist_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from wishlists where id = p_wishlist_id and archived_at is not null);
$$;

revoke execute on function public.wishlist_is_archived(uuid) from public, anon;
grant execute on function public.wishlist_is_archived(uuid) to authenticated, service_role;

-- archived_at changes only inside archive_wishlist / unarchive_wishlist, which set the
-- transaction-local flag below. A plain update from the app is refused.
create or replace function public.guard_archived_at()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.archived_at is distinct from old.archived_at
     and coalesce(current_setting('gifthunt.archiving', true), '') <> 'on' then
    raise exception 'archived_locked' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.guard_archived_at() from public, anon, authenticated;

create trigger wishlists_guard_archived_at
  before update of archived_at on public.wishlists
  for each row execute function public.guard_archived_at();

create or replace function public.archive_wishlist(p_wishlist_id uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
begin
  if not public.is_wishlist_owner(p_wishlist_id) then
    raise exception 'not_owner' using errcode = '42501';
  end if;
  if public.wishlist_is_archived(p_wishlist_id) then
    raise exception 'already_archived' using errcode = 'P0001';
  end if;

  perform set_config('gifthunt.archiving', 'on', true);

  delete from share_links where wishlist_id = p_wishlist_id;
  delete from admin_invitations where wishlist_id = p_wishlist_id;
  -- The creator of a self-managed list is their own organizer: that row stays.
  delete from wishlist_admins where wishlist_id = p_wishlist_id and admin_id <> auth.uid();
  update item_change_requests
  set status = 'withdrawn', resolved_by = auth.uid(), resolved_at = now()
  where wishlist_id = p_wishlist_id and status = 'pending';
  update wishlists set archived_at = now() where id = p_wishlist_id;

  perform set_config('gifthunt.archiving', 'off', true);
end;
$$;

create or replace function public.unarchive_wishlist(p_wishlist_id uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
begin
  if not public.is_wishlist_owner(p_wishlist_id) then
    raise exception 'not_owner' using errcode = '42501';
  end if;
  if not public.wishlist_is_archived(p_wishlist_id) then
    raise exception 'not_archived' using errcode = 'P0001';
  end if;

  perform set_config('gifthunt.archiving', 'on', true);
  update wishlists set archived_at = null where id = p_wishlist_id;
  perform set_config('gifthunt.archiving', 'off', true);
end;
$$;

revoke execute on function public.archive_wishlist(uuid)   from public, anon;
revoke execute on function public.unarchive_wishlist(uuid) from public, anon;
grant execute on function public.archive_wishlist(uuid)   to authenticated, service_role;
grant execute on function public.unarchive_wishlist(uuid) to authenticated, service_role;

-- The owner's blanket policy becomes four, so that update can refuse archived lists.
drop policy if exists "wishlists_owner_all" on public.wishlists;

create policy "wishlists_owner_select" on public.wishlists
  for select to authenticated
  using (creator_id = auth.uid());

create policy "wishlists_owner_insert" on public.wishlists
  for insert to authenticated
  with check (creator_id = auth.uid());

create policy "wishlists_owner_update" on public.wishlists
  for update to authenticated
  using (creator_id = auth.uid() and archived_at is null)
  with check (creator_id = auth.uid());

create policy "wishlists_owner_delete" on public.wishlists
  for delete to authenticated
  using (creator_id = auth.uid());

-- Items: reading stays, writing stops on an archived list.
drop policy if exists "items_owner_insert" on public.wishlist_items;
drop policy if exists "items_owner_update" on public.wishlist_items;
drop policy if exists "items_owner_delete" on public.wishlist_items;
drop policy if exists "items_admin_update" on public.wishlist_items;
drop policy if exists "items_admin_delete" on public.wishlist_items;

create policy "items_owner_insert" on public.wishlist_items
  for insert to authenticated
  with check (public.is_wishlist_owner(wishlist_id) and not public.wishlist_is_archived(wishlist_id));

create policy "items_owner_update" on public.wishlist_items
  for update to authenticated
  using (public.is_wishlist_owner(wishlist_id) and not public.wishlist_has_share_link(wishlist_id)
         and not public.wishlist_is_archived(wishlist_id))
  with check (public.is_wishlist_owner(wishlist_id) and not public.wishlist_is_archived(wishlist_id));

create policy "items_owner_delete" on public.wishlist_items
  for delete to authenticated
  using (public.is_wishlist_owner(wishlist_id) and not public.wishlist_has_share_link(wishlist_id)
         and not public.wishlist_is_archived(wishlist_id));

create policy "items_admin_update" on public.wishlist_items
  for update to authenticated
  using (public.is_wishlist_admin(wishlist_id) and not public.wishlist_is_archived(wishlist_id))
  with check (public.is_wishlist_admin(wishlist_id) and not public.wishlist_is_archived(wishlist_id));

create policy "items_admin_delete" on public.wishlist_items
  for delete to authenticated
  using (public.is_wishlist_admin(wishlist_id) and not public.wishlist_is_archived(wishlist_id));

-- Share links, invitations and claim removal: nothing new can be made or changed.
drop policy if exists "share_links_admin_insert" on public.share_links;
drop policy if exists "share_links_admin_update" on public.share_links;
drop policy if exists "invitations_owner_insert" on public.admin_invitations;
drop policy if exists "claims_admin_delete"      on public.item_claims;

create policy "share_links_admin_insert" on public.share_links
  for insert to authenticated
  with check (public.is_wishlist_admin(wishlist_id) and created_by = auth.uid()
              and not public.wishlist_is_archived(wishlist_id));

create policy "share_links_admin_update" on public.share_links
  for update to authenticated
  using (public.is_wishlist_admin(wishlist_id) and not public.wishlist_is_archived(wishlist_id))
  with check (public.is_wishlist_admin(wishlist_id) and not public.wishlist_is_archived(wishlist_id));

create policy "invitations_owner_insert" on public.admin_invitations
  for insert to authenticated
  with check (public.is_wishlist_owner(wishlist_id) and invited_by = auth.uid()
              and not public.wishlist_is_archived(wishlist_id));

create policy "claims_admin_delete" on public.item_claims
  for delete to authenticated
  using (public.is_wishlist_admin(public.item_wishlist_id(item_id))
         and not public.wishlist_is_archived(public.item_wishlist_id(item_id)));
