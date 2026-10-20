-- The receipt on the share page says who to contact to undo a claim, so the page
-- needs the organizer's name. It is the person who shared the list, and the
-- visitor already holds their link; the owner's name was already returned.
create or replace function public.get_shared_wishlist(p_token text)
returns json language plpgsql stable security definer set search_path = public as $$
declare
  v_link share_links%rowtype;
begin
  select * into v_link from share_links where token = p_token;
  if not found then
    raise exception 'invalid_link' using errcode = 'P0002';
  end if;
  if not v_link.is_active then
    raise exception 'inactive_link' using errcode = 'P0001';
  end if;
  if v_link.expires_at is not null and v_link.expires_at < now() then
    raise exception 'expired_link' using errcode = 'P0001';
  end if;

  return json_build_object(
    'wishlist', (
      select json_build_object(
        'title', w.title,
        'description', w.description,
        'enable_links', w.enable_links,
        'enable_price', w.enable_price,
        'enable_priority', w.enable_priority,
        'creator_name', p.full_name,
        'organizer_name', (
          select pa.full_name
          from wishlist_admins wa
          join profiles pa on pa.id = wa.admin_id
          where wa.wishlist_id = w.id))
      from wishlists w
      left join profiles p on p.id = w.creator_id
      where w.id = v_link.wishlist_id),
    'items', coalesce((
      select json_agg(json_build_object(
          'id', i.id,
          'title', i.title,
          'description', i.description,
          'link', i.link,
          'url', i.url,
          'price_range', i.price_range,
          'priority', i.priority,
          'is_taken', i.is_taken,
          'is_giftcard', i.is_giftcard,
          'claim_cap', i.claim_cap,
          'claim_count', (select count(*) from item_claims c where c.item_id = i.id))
        order by i.priority desc nulls first, i.created_at desc)
      from wishlist_items i
      where i.wishlist_id = v_link.wishlist_id), '[]'::json),
    'share_link', json_build_object(
      'wishlist_id', v_link.wishlist_id,
      'expires_at', v_link.expires_at)
  );
end;
$$;
