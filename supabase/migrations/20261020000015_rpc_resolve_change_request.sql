-- The organizer answers a request: approve applies it to the item in the same
-- transaction, decline leaves the item as it is. The organizer sees whether the
-- item is claimed; the owner only sees the outcome and the optional message.
create or replace function public.resolve_change_request(
  p_request_id uuid, p_approve boolean, p_message text default null)
returns void language plpgsql volatile security definer set search_path = public as $$
declare
  v_req item_change_requests%rowtype;
  v_message text := nullif(btrim(coalesce(p_message, ''), E' \t\r\n'), '');
begin
  select * into v_req from item_change_requests where id = p_request_id for update;
  if not found or not public.is_wishlist_admin(v_req.wishlist_id) then
    raise exception 'request_not_found' using errcode = 'P0002';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'not_pending' using errcode = 'P0001';
  end if;
  if v_message is not null and length(v_message) > 500 then
    raise exception 'invalid_message' using errcode = '22023';
  end if;

  if p_approve then
    if v_req.item_id is null then
      raise exception 'item_not_found' using errcode = 'P0002';
    end if;

    if v_req.kind = 'remove' then
      delete from wishlist_items where id = v_req.item_id;
    else
      update wishlist_items set
        title       = case when v_req.proposed ? 'title'       then v_req.proposed ->> 'title'                  else title end,
        description = case when v_req.proposed ? 'description' then v_req.proposed ->> 'description'            else description end,
        link        = case when v_req.proposed ? 'link'        then v_req.proposed ->> 'link'                   else link end,
        url         = case when v_req.proposed ? 'url'         then v_req.proposed ->> 'url'                    else url end,
        price_range = case when v_req.proposed ? 'price_range' then v_req.proposed ->> 'price_range'            else price_range end,
        priority    = case when v_req.proposed ? 'priority'    then (v_req.proposed ->> 'priority')::numeric::int  else priority end,
        is_giftcard = case when v_req.proposed ? 'is_giftcard' then (v_req.proposed ->> 'is_giftcard')::boolean else is_giftcard end,
        claim_cap   = case when v_req.proposed ? 'claim_cap'   then (v_req.proposed ->> 'claim_cap')::numeric::int else claim_cap end
      where id = v_req.item_id;

      -- A normal item never has a claim cap
      update wishlist_items set claim_cap = null
      where id = v_req.item_id and not coalesce(is_giftcard, false) and claim_cap is not null;
    end if;
  end if;

  update item_change_requests
  set status = case when p_approve then 'approved' else 'declined' end,
      message = v_message,
      resolved_by = auth.uid(),
      resolved_at = now()
  where id = p_request_id;
end;
$$;

revoke execute on function public.resolve_change_request(uuid, boolean, text) from public, anon;
grant execute on function public.resolve_change_request(uuid, boolean, text)  to authenticated, service_role;
