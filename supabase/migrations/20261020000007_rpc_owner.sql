-- The owner may know whether their list is shared (it limits editing), but never
-- the token itself.
create or replace function public.wishlist_has_share_link(p_wishlist_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select (public.is_wishlist_owner(p_wishlist_id) or public.is_wishlist_admin(p_wishlist_id))
    and exists (
      select 1 from share_links
      where wishlist_id = p_wishlist_id
        and (expires_at is null or expires_at > now())
    );
$$;

-- Removing the admin also removes what only the admin could manage, in one
-- transaction: share links, taken status, and the admin's invitation.
create or replace function public.remove_wishlist_admin(p_wishlist_id uuid)
returns json language plpgsql volatile security definer set search_path = public as $$
declare
  v_email text;
  v_had_links boolean;
begin
  if not public.is_wishlist_owner(p_wishlist_id) then
    raise exception 'not_owner' using errcode = '42501';
  end if;

  select p.email into v_email
  from wishlist_admins wa
  join profiles p on p.id = wa.admin_id
  where wa.wishlist_id = p_wishlist_id;

  with deleted as (
    delete from share_links where wishlist_id = p_wishlist_id returning 1
  )
  select count(*) > 0 into v_had_links from deleted;

  update wishlist_items
  set is_taken = false, taken_by_name = null, taken_at = null
  where wishlist_id = p_wishlist_id and is_taken;

  delete from wishlist_admins where wishlist_id = p_wishlist_id;

  if v_email is not null then
    delete from admin_invitations
    where wishlist_id = p_wishlist_id and lower(email) = lower(v_email);
  end if;

  return json_build_object('admin_email', v_email, 'had_share_links', v_had_links);
end;
$$;

revoke execute on function public.wishlist_has_share_link(uuid) from public, anon;
revoke execute on function public.remove_wishlist_admin(uuid)   from public, anon;
grant execute on function public.wishlist_has_share_link(uuid)  to authenticated, service_role;
grant execute on function public.remove_wishlist_admin(uuid)    to authenticated, service_role;
