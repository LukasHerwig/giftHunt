import { supabase } from '@/integrations/supabase/client';
import { WishlistItem, Wishlist, ShareLink, ClaimItemData } from '../types';

interface SharedWishlistResponse {
  wishlist: Wishlist;
  items: WishlistItem[];
  share_link: ShareLink;
}

export class PublicWishlistService {
  static async loadWishlistByToken(token: string): Promise<{
    wishlist: Wishlist;
    items: WishlistItem[];
    shareLink: ShareLink;
  }> {
    const { data, error } = await supabase.rpc('get_shared_wishlist', {
      p_token: token,
    });

    if (error) {
      if (error.message === 'expired_link') {
        throw new Error('Link has expired');
      }
      throw new Error('Invalid or expired link');
    }

    const result = data as unknown as SharedWishlistResponse;
    return {
      wishlist: result.wishlist,
      items: result.items,
      shareLink: result.share_link,
    };
  }

  static async claimItem({
    token,
    itemId,
    buyerName,
  }: ClaimItemData): Promise<void> {
    const { error } = await supabase.rpc('claim_shared_item', {
      p_token: token,
      p_item_id: itemId,
      p_name: buyerName,
    });

    if (error) {
      // The same name already holds a claim on this gift card
      if (error.code === '23505') {
        throw new Error('already_claimed');
      }
      throw new Error(error.message);
    }
  }
}
