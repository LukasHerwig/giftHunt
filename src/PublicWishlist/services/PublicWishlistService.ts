import { supabase } from '@/integrations/supabase/client';
import { WishlistItem, Wishlist, ShareLink, ClaimItemData } from '../types';

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
      .select('title, description, enable_links, enable_price, enable_priority')
      .eq('id', shareLinkData.wishlist_id)
      .single();

    if (wishlistError) throw wishlistError;

    // Load all items (but hide who took what from public users)
    const { data: itemsData, error: itemsError } = await supabase
      .from('wishlist_items')
      .select('id, title, description, link, price_range, priority, is_taken')
      .eq('wishlist_id', shareLinkData.wishlist_id)
      .order('priority', { ascending: false }) // Show high priority items first
      .order('created_at', { ascending: false });

    if (itemsError) throw itemsError;

    return {
      wishlist: wishlistData,
      items: itemsData || [],
      shareLink: shareLinkData,
    };
  }

  static async claimItem({ itemId, buyerName }: ClaimItemData): Promise<void> {
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
