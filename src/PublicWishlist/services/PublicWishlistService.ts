import { supabase } from '@/integrations/supabase/client';
import { WishlistItem, Wishlist, ShareLink, ClaimItemData } from '../types';

interface WishlistWithProfile {
  title: string;
  description: string | null;
  enable_links: boolean | null;
  enable_price: boolean | null;
  enable_priority: boolean | null;
  profiles: {
    full_name: string | null;
  } | null;
}

export class PublicWishlistService {
  static async loadWishlistByToken(token: string): Promise<{
    wishlist: Wishlist;
    items: WishlistItem[];
    shareLink: ShareLink;
  }> {
    // First, validate the share token and get wishlist ID
    const { data: shareLinkData, error: shareLinkError } = await supabase
      .from('share_links')
      .select('wishlist_id, expires_at')
      .eq('token', token)
      .maybeSingle();

    if (shareLinkError) {
      throw new Error('Invalid or expired link');
    }

    if (!shareLinkData) {
      throw new Error('Invalid or expired link');
    }

    if (
      shareLinkData.expires_at &&
      new Date(shareLinkData.expires_at) < new Date()
    ) {
      throw new Error('Link has expired');
    }

    // Load wishlist info
    const { data: wishlistData, error: wishlistError } = await supabase
      .from('wishlists')
      .select(
        `
        title, 
        description, 
        enable_links, 
        enable_price, 
        enable_priority,
        profiles!creator_id (
          full_name
        )
      `,
      )
      .eq('id', shareLinkData.wishlist_id)
      .single();

    if (wishlistError) throw wishlistError;

    // Transform the data to match our interface
    const wishlistWithProfile = wishlistData as WishlistWithProfile;
    const wishlist: Wishlist = {
      title: wishlistWithProfile.title,
      description: wishlistWithProfile.description,
      enable_links: wishlistWithProfile.enable_links,
      enable_price: wishlistWithProfile.enable_price,
      enable_priority: wishlistWithProfile.enable_priority,
      creator_name: wishlistWithProfile.profiles?.full_name || null,
    };

    // Load all items (but hide who took what from public users)
    const { data: itemsData, error: itemsError } = await supabase
      .from('wishlist_items')
      .select(
        'id, title, description, link, url, price_range, priority, is_taken, is_giftcard',
      )
      .eq('wishlist_id', shareLinkData.wishlist_id)
      .order('priority', { ascending: false }) // Show high priority items first
      .order('created_at', { ascending: false });

    if (itemsError) throw itemsError;

    // Get claim counts for ALL items (not just gift cards, in case gift card was toggled off)
    const allItemIds = (itemsData || []).map((item) => item.id);

    let claimCounts: Record<string, number> = {};
    if (allItemIds.length > 0) {
      const { data: claimsData, error: claimsError } = await supabase
        .from('item_claims')
        .select('item_id')
        .in('item_id', allItemIds);

      if (!claimsError && claimsData) {
        claimsData.forEach((claim) => {
          claimCounts[claim.item_id] = (claimCounts[claim.item_id] || 0) + 1;
        });
      }
    }

    // Add claim_count to all items (needed for items where gift card was toggled off)
    const itemsWithClaimCount = (itemsData || []).map((item) => ({
      ...item,
      claim_count: claimCounts[item.id] || 0,
    }));

    return {
      wishlist: wishlist,
      items: itemsWithClaimCount,
      shareLink: shareLinkData,
    };
  }

  static async claimItem({
    itemId,
    buyerName,
    isGiftcard,
  }: ClaimItemData): Promise<void> {
    if (isGiftcard) {
      // For gift card items, insert into item_claims table
      // Don't update is_taken on the item itself
      const { error } = await supabase.from('item_claims').insert({
        item_id: itemId,
        claimer_name: buyerName.trim(),
      });

      if (error) {
        // Check if it's a unique constraint violation (user already claimed)
        if (error.code === '23505') {
          throw new Error('You have already claimed this item');
        }
        throw error;
      }
    } else {
      // For regular items, use the existing behavior
      const { error } = await supabase
        .from('wishlist_items')
        .update({
          is_taken: true,
          taken_by_name: buyerName.trim(),
          taken_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) throw error;
    }
  }
}
