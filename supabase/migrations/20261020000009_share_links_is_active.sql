-- Organizers can turn a share link off (spec: "create, copy and turn off the link").
-- A turned-off link stops opening the list and stops claims; turning it on again
-- restores it with the same token.
alter table public.share_links
  add column is_active boolean not null default true;

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
        'creator_name', p.full_name)
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

create or replace function public.claim_shared_item(p_token text, p_item_id uuid, p_name text)
returns void language plpgsql volatile security definer set search_path = public as $$
declare
  v_link share_links%rowtype;
  v_item wishlist_items%rowtype;
  v_name text := btrim(coalesce(p_name, ''), E' \t\r\n');
begin
  if v_name = '' or length(v_name) > 100 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;

  select * into v_link from share_links where token = p_token;
  if not found
     or not v_link.is_active
     or (v_link.expires_at is not null and v_link.expires_at < now()) then
    raise exception 'invalid_link' using errcode = 'P0002';
  end if;

  -- Lock the item so two givers claiming at once are serialized.
  select * into v_item from wishlist_items
  where id = p_item_id and wishlist_id = v_link.wishlist_id
  for update;
  if not found then
    raise exception 'item_not_found' using errcode = 'P0002';
  end if;

  if coalesce(v_item.is_giftcard, false) then
    if v_item.claim_cap is not null
       and (select count(*) from item_claims where item_id = p_item_id) >= v_item.claim_cap then
      raise exception 'claim_cap_reached' using errcode = 'P0001';
    end if;
    -- A repeated name raises the unique violation (23505) the client already handles.
    insert into item_claims (item_id, claimer_name) values (p_item_id, v_name);
  else
    if v_item.is_taken then
      raise exception 'already_taken' using errcode = 'P0001';
    end if;
    update wishlist_items
    set is_taken = true, taken_by_name = v_name, taken_at = now()
    where id = p_item_id;
  end if;
end;
$$;

create or replace function public.wishlist_has_share_link(p_wishlist_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select (public.is_wishlist_owner(p_wishlist_id) or public.is_wishlist_admin(p_wishlist_id))
    and exists (
      select 1 from share_links
      where wishlist_id = p_wishlist_id
        and is_active
        and (expires_at is null or expires_at > now())
    );
$$;
