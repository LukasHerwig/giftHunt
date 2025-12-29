import { supabase } from '@/integrations/supabase/client';
import { getBaseUrl } from '@/lib/urlUtils';
import { fetchLinkMetadata } from '@/lib/metadataUtils';
import { Wishlist, WishlistItem } from '../types';

interface WishlistWithProfile {
  id: string;
  title: string;
  description: string | null;
  enable_links: boolean | null;
  enable_price: boolean | null;
  enable_priority: boolean | null;
  profiles: {
    full_name: string | null;
  } | null;
}

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
        `
        id, 
        title, 
        description, 
        enable_links, 
        enable_price, 
        enable_priority,
        profiles!creator_id (
          full_name
        )
        `
      )
      .eq('id', wishlistId)
      .single();

    if (error) throw error;

    // Transform the data to flatten the creator name
    const wishlistWithProfile = data as WishlistWithProfile;
    const { profiles, ...wishlistData } = wishlistWithProfile;
    return {
      ...wishlistData,
      creator_name: profiles?.full_name || null,
    };
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
      return `${getBaseUrl()}/shared/${data.token}`;
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
      return `${getBaseUrl()}/shared/${existingLink.token}`;
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

    return `${getBaseUrl()}/shared/${data.token}`;
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

  static async updateItem(
    itemId: string,
    updates: {
      title: string;
      description?: string;
      link?: string;
      url?: string;
      price_range?: string;
      priority?: number;
    }
  ): Promise<void> {
    let imageUrl = updates.url;

    // If link is provided and no image URL, try to fetch it
    if (updates.link && !imageUrl) {
      try {
        const metadata = await fetchLinkMetadata(updates.link);
        if (metadata?.image) {
          imageUrl = metadata.image;
        }
      } catch (e) {
        console.error('Failed to fetch metadata in Admin updateItem:', e);
      }
    }

    const { error } = await supabase
      .from('wishlist_items')
      .update({
        title: updates.title,
        description: updates.description || null,
        link: updates.link || null,
        url: imageUrl || null,
        price_range: updates.price_range || null,
        priority: updates.priority || 0,
      })
      .eq('id', itemId);

    if (error) throw error;
  }

  static async deleteItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  }
}
