-- Helper functions for RLS policies. SECURITY DEFINER so a policy on one table
-- can check another table without triggering that table's policies (no recursion).

create or replace function public.is_wishlist_owner(p_wishlist_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from wishlists where id = p_wishlist_id and creator_id = auth.uid()
  );
$$;

create or replace function public.is_wishlist_admin(p_wishlist_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from wishlist_admins where wishlist_id = p_wishlist_id and admin_id = auth.uid()
  );
$$;

create or replace function public.item_wishlist_id(p_item_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select wishlist_id from wishlist_items where id = p_item_id;
$$;

create or replace function public.has_pending_invitation(p_wishlist_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from admin_invitations
    where wishlist_id = p_wishlist_id
      and lower(email) = lower(auth.jwt() ->> 'email')
      and accepted = false
      and (expires_at is null or expires_at > now())
  );
$$;

-- True for your own profile, for the owner/admin you share a wishlist with,
-- and for the sender of a pending invitation to you.
create or replace function public.can_see_profile(p_profile_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_profile_id = auth.uid()
    or exists (
      select 1 from wishlists w
      join wishlist_admins wa on wa.wishlist_id = w.id
      where (w.creator_id = auth.uid() and wa.admin_id = p_profile_id)
         or (wa.admin_id = auth.uid() and w.creator_id = p_profile_id)
    )
    or exists (
      select 1 from admin_invitations ai
      where ai.invited_by = p_profile_id
        and lower(ai.email) = lower(auth.jwt() ->> 'email')
        and ai.accepted = false
        and (ai.expires_at is null or ai.expires_at > now())
    );
$$;

revoke execute on function public.is_wishlist_owner(uuid)      from public, anon;
revoke execute on function public.is_wishlist_admin(uuid)      from public, anon;
revoke execute on function public.item_wishlist_id(uuid)       from public, anon;
revoke execute on function public.has_pending_invitation(uuid) from public, anon;
revoke execute on function public.can_see_profile(uuid)        from public, anon;

grant execute on function public.is_wishlist_owner(uuid)      to authenticated, service_role;
grant execute on function public.is_wishlist_admin(uuid)      to authenticated, service_role;
grant execute on function public.item_wishlist_id(uuid)       to authenticated, service_role;
grant execute on function public.has_pending_invitation(uuid) to authenticated, service_role;
grant execute on function public.can_see_profile(uuid)        to authenticated, service_role;
