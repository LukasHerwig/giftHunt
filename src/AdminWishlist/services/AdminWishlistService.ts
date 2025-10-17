import { supabase } from '@/integrations/supabase/client';
import { Wishlist, WishlistItem } from '../types';

export class AdminWishlistService {
  static async checkAdminAccess(wishlistId: string): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('wishlist_admins')
      .select('id')
      .eq('wishlist_id', wishlistId)
      .eq('admin_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  }

  static async getWishlist(wishlistId: string): Promise<Wishlist> {
    const { data, error } = await supabase
      .from('wishlists')
      .select(
        'id, title, description, enable_links, enable_price, enable_priority'
      )
      .eq('id', wishlistId)
      .single();

    if (error) throw error;
    return data;
  }

  static async getWishlistItems(wishlistId: string): Promise<WishlistItem[]> {
    const { data, error } = await supabase
      .from('wishlist_items')
      .select('*')
      .eq('wishlist_id', wishlistId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getShareLink(wishlistId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('share_links')
      .select('token')
      .eq('wishlist_id', wishlistId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return `${window.location.origin}/shared/${data.token}`;
    }

    return null;
  }

  static async createShareLink(wishlistId: string): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if there's already an existing share link
    const { data: existingLink } = await supabase
      .from('share_links')
      .select('token')
      .eq('wishlist_id', wishlistId)
      .maybeSingle();

    if (existingLink) {
      return `${window.location.origin}/shared/${existingLink.token}`;
    }

    // Generate new share link
    const shareToken = crypto.randomUUID();
    const { data, error } = await supabase
      .from('share_links')
      .insert({
        wishlist_id: wishlistId,
        created_by: user.id,
        token: shareToken,
      })
      .select('token')
      .single();

    if (error) throw error;

    return `${window.location.origin}/shared/${data.token}`;
  }

  static async untakeItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('wishlist_items')
      .update({
        is_taken: false,
        taken_by_name: null,
        taken_at: null,
      })
      .eq('id', itemId);

    if (error) throw error;
  }
}
