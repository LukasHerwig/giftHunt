import { supabase } from '@/integrations/supabase/client';
import { getBaseUrl } from '@/lib/urlUtils';
import { REQUEST_COLUMNS, WishlistService } from './WishlistService';
import type {
  ChangeRequestRow,
  ClaimRow,
  OrganizerData,
  OrganizerItem,
  ShareLinkRow,
} from '../types';

export const shareUrl = (token: string): string => `${getBaseUrl()}/shared/${token}`;

/** Everything an organizer (or the creator of a self-managed list) reads and does. */
export class OrganizerService {
  static async loadOrganizerData(wishlistId: string): Promise<OrganizerData> {
    const wishlist = await WishlistService.loadWishlist(wishlistId);
    if (!wishlist) throw new Error('wishlist_not_found');
    const [items, requests, shareLink, ownerName] = await Promise.all([
      OrganizerService.loadItems(wishlistId),
      OrganizerService.loadRequests(wishlistId),
      OrganizerService.loadShareLink(wishlistId),
      OrganizerService.loadOwnerName(wishlist.creator_id),
    ]);
    const claims = await OrganizerService.loadClaims(items.map((item) => item.id));
    return { wishlist, ownerName, items, claims, requests, shareLink };
  }

  /** Through the view: claim columns are not readable from the table. */
  private static async loadItems(wishlistId: string): Promise<OrganizerItem[]> {
    const { data, error } = await supabase
      .from('wishlist_items_admin')
      .select('*')
      .eq('wishlist_id', wishlistId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as OrganizerItem[];
  }

  private static async loadClaims(itemIds: string[]): Promise<ClaimRow[]> {
    if (itemIds.length === 0) return [];
    const { data, error } = await supabase
      .from('item_claims')
      .select('id, item_id, claimer_name, claimed_at')
      .in('item_id', itemIds)
      .order('claimed_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as ClaimRow[];
  }

  private static async loadRequests(wishlistId: string): Promise<ChangeRequestRow[]> {
    const { data, error } = await supabase
      .from('item_change_requests')
      .select(REQUEST_COLUMNS)
      .eq('wishlist_id', wishlistId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as ChangeRequestRow[];
  }

  private static async loadShareLink(wishlistId: string): Promise<ShareLinkRow | null> {
    // Oldest first, so a stray duplicate never breaks the page.
    const { data, error } = await supabase
      .from('share_links')
      .select('token, is_active')
      .eq('wishlist_id', wishlistId)
      .order('created_at', { ascending: true })
      .limit(1);
    if (error) throw error;
    const link = data?.[0];
    return link ? { token: link.token, is_active: link.is_active } : null;
  }

  private static async loadOwnerName(ownerId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', ownerId)
      .maybeSingle();
    if (error) throw error;
    return data?.full_name ?? null;
  }

  /** Makes a regular item free again (also clears claim rows left from when it was a gift card). */
  static async untake(itemId: string): Promise<void> {
    const { error: claimsError } = await supabase.from('item_claims').delete().eq('item_id', itemId);
    if (claimsError) throw claimsError;
    const { data, error } = await supabase
      .from('wishlist_items')
      .update({ is_taken: false, taken_by_name: null, taken_at: null })
      .eq('id', itemId)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('item_not_found');
  }

  /** Removes one person's gift from a gift card. */
  static async removeClaim(claimId: string): Promise<void> {
    const { data, error } = await supabase
      .from('item_claims')
      .delete()
      .eq('id', claimId)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('claim_not_found');
  }

  /** Approve applies the change to the item in the same transaction; keep leaves it. */
  static async resolveRequest(requestId: string, approve: boolean, message: string): Promise<void> {
    const text = message.trim();
    const { error } = await supabase.rpc('resolve_change_request', {
      p_request_id: requestId,
      p_approve: approve,
      p_message: text === '' ? undefined : text,
    });
    if (error) throw error;
  }

  /** One link per list: an existing one is returned, not duplicated. */
  static async createShareLink(wishlistId: string): Promise<ShareLinkRow> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('not_authenticated');

    const existing = await OrganizerService.loadShareLink(wishlistId);
    if (existing) return existing;

    const { data, error } = await supabase
      .from('share_links')
      .insert({ wishlist_id: wishlistId, created_by: user.id, token: crypto.randomUUID() })
      .select('token, is_active')
      .single();
    if (error) throw error;
    return { token: data.token, is_active: data.is_active };
  }

  /** Turning the link off stops claims and opens; turning it on again restores the same link. */
  static async setShareLinkActive(wishlistId: string, active: boolean): Promise<ShareLinkRow> {
    const { data, error } = await supabase
      .from('share_links')
      .update({ is_active: active })
      .eq('wishlist_id', wishlistId)
      .select('token, is_active');
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('share_link_not_found');
    return { token: data[0].token, is_active: data[0].is_active };
  }
}
