-- Raises invalid_proposal unless p_proposed only changes fields an owner may change,
-- with sensible types. Nested IFs (not AND chains) so a cast only runs after its
-- type check: SQL does not guarantee AND evaluation order.
create or replace function public.validate_change_proposal(p_proposed jsonb)
returns void language plpgsql immutable set search_path = public as $$
declare
  v_key text;
  v_value jsonb;
begin
  if p_proposed is null or jsonb_typeof(p_proposed) <> 'object' or p_proposed = '{}'::jsonb then
    raise exception 'invalid_proposal' using errcode = '22023';
  end if;

  for v_key, v_value in select key, value from jsonb_each(p_proposed) loop
    if v_key = 'title' then
      if jsonb_typeof(v_value) <> 'string' then
        raise exception 'invalid_proposal' using errcode = '22023';
      end if;
      if btrim(v_value #>> '{}', E' \t\r\n') = '' then
        raise exception 'invalid_proposal' using errcode = '22023';
      end if;
    elsif v_key in ('description', 'link', 'url', 'price_range') then
      if jsonb_typeof(v_value) not in ('string', 'null') then
        raise exception 'invalid_proposal' using errcode = '22023';
      end if;
    elsif v_key = 'priority' then
      if jsonb_typeof(v_value) = 'number' then
        if (v_value #>> '{}')::numeric <> trunc((v_value #>> '{}')::numeric) then
          raise exception 'invalid_proposal' using errcode = '22023';
        end if;
      elsif jsonb_typeof(v_value) <> 'null' then
        raise exception 'invalid_proposal' using errcode = '22023';
      end if;
    elsif v_key = 'is_giftcard' then
      if jsonb_typeof(v_value) <> 'boolean' then
        raise exception 'invalid_proposal' using errcode = '22023';
      end if;
    elsif v_key = 'claim_cap' then
      if jsonb_typeof(v_value) = 'number' then
        if (v_value #>> '{}')::numeric < 1
           or (v_value #>> '{}')::numeric <> trunc((v_value #>> '{}')::numeric) then
          raise exception 'invalid_proposal' using errcode = '22023';
        end if;
      elsif jsonb_typeof(v_value) <> 'null' then
        raise exception 'invalid_proposal' using errcode = '22023';
      end if;
    else
      -- Anything else (is_taken, taken_by_name, wishlist_id, …) is never changeable
      raise exception 'invalid_proposal' using errcode = '22023';
    end if;
  end loop;
end;
$$;

create or replace function public.request_item_change(
  p_item_id uuid, p_kind text, p_proposed jsonb default null)
returns uuid language plpgsql volatile security definer set search_path = public as $$
declare
  v_item wishlist_items%rowtype;
  v_id uuid;
begin
  select * into v_item from wishlist_items where id = p_item_id;
  if not found or not public.is_wishlist_owner(v_item.wishlist_id) then
    raise exception 'item_not_found' using errcode = 'P0002';
  end if;

  -- Requests exist only for an owner who isn't also the organizer, on a shared list
  if public.is_wishlist_admin(v_item.wishlist_id)
     or not exists (
       select 1 from share_links
       where wishlist_id = v_item.wishlist_id
         and is_active
         and (expires_at is null or expires_at > now())) then
    raise exception 'edit_directly' using errcode = 'P0001';
  end if;

  if p_kind is null or p_kind not in ('edit', 'remove') then
    raise exception 'invalid_kind' using errcode = '22023';
  end if;

  if p_kind = 'edit' then
    perform public.validate_change_proposal(p_proposed);
  else
    p_proposed := null;
  end if;

  begin
    insert into item_change_requests (wishlist_id, item_id, item_title, kind, proposed, created_by)
    values (v_item.wishlist_id, v_item.id, v_item.title, p_kind, p_proposed, auth.uid())
    returning id into v_id;
  exception when unique_violation then
    raise exception 'request_pending' using errcode = 'P0001';
  end;

  return v_id;
end;
$$;

create or replace function public.withdraw_change_request(p_request_id uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
begin
  update item_change_requests
  set status = 'withdrawn', resolved_by = auth.uid(), resolved_at = now()
  where id = p_request_id and created_by = auth.uid() and status = 'pending';

  if not found then
    raise exception 'request_not_found' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.validate_change_proposal(jsonb)            from public, anon, authenticated;
revoke execute on function public.request_item_change(uuid, text, jsonb)      from public, anon;
revoke execute on function public.withdraw_change_request(uuid)               from public, anon;
grant execute on function public.request_item_change(uuid, text, jsonb)       to authenticated, service_role;
grant execute on function public.withdraw_change_request(uuid)                to authenticated, service_role;
