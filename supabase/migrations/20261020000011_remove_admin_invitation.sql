-- A list has at most one invitation, so delete it by list instead of by the admin's
-- current email (which may differ from the address the invitation was sent to).
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

  delete from admin_invitations where wishlist_id = p_wishlist_id;

  return json_build_object('admin_email', v_email, 'had_share_links', v_had_links);
end;
$$;
