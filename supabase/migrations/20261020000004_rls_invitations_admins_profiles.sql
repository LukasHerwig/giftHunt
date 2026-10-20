-- admin_invitations: the owner manages invitations for their lists, the invitee
-- reads their own. Lookup by token and accepting go through RPCs.
drop policy if exists "admin_invitations_policy"       on public.admin_invitations;
drop policy if exists "allow_invitation_read_by_token" on public.admin_invitations;

create policy "invitations_owner_read" on public.admin_invitations
  for select to authenticated
  using (public.is_wishlist_owner(wishlist_id));

create policy "invitations_owner_insert" on public.admin_invitations
  for insert to authenticated
  with check (public.is_wishlist_owner(wishlist_id) and invited_by = auth.uid());

create policy "invitations_owner_delete" on public.admin_invitations
  for delete to authenticated
  using (public.is_wishlist_owner(wishlist_id));

create policy "invitations_invitee_read" on public.admin_invitations
  for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- wishlist_admins: admins see their own row, the owner sees and removes the
-- admin of their list. The owner may add only themselves, and only on a
-- self-managed list. Invited admins are added by accept_invitation().
drop policy if exists "wishlist_admins_insert_allowed" on public.wishlist_admins;
drop policy if exists "wishlist_admins_simple_access"  on public.wishlist_admins;

create policy "admins_read" on public.wishlist_admins
  for select to authenticated
  using (admin_id = auth.uid() or public.is_wishlist_owner(wishlist_id));

create policy "admins_owner_self_insert" on public.wishlist_admins
  for insert to authenticated
  with check (
    admin_id = auth.uid()
    and invited_by = auth.uid()
    and exists (
      select 1 from public.wishlists
      where id = wishlist_id and creator_id = auth.uid() and is_self_managed
    )
  );

create policy "admins_owner_delete" on public.wishlist_admins
  for delete to authenticated
  using (public.is_wishlist_owner(wishlist_id));

-- profiles: your own, plus the people you share a list or a pending invitation with.
drop policy if exists "allow_anon_profile_read"            on public.profiles;
drop policy if exists "allow_profile_read_for_invitations" on public.profiles;
drop policy if exists "profiles_authenticated_read"        on public.profiles;
drop policy if exists "profiles_own_modify"                on public.profiles;
drop policy if exists "users_can_access_own_profile"       on public.profiles;

create policy "profiles_own_all" on public.profiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_related_read" on public.profiles
  for select to authenticated
  using (public.can_see_profile(id));
