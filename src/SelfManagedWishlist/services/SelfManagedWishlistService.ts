import { supabase } from '@/integrations/supabase/client';
import { getBaseUrl } from '@/lib/urlUtils';
import { fetchLinkMetadata } from '@/lib/metadataUtils';
import { Wishlist, WishlistItem, ItemFormData } from '../types';

export class SelfManagedWishlistService {
  static async getWishlist(wishlistId: string): Promise<Wishlist> {
    const { data, error } = await supabase
      .from('wishlists')
      .select('*')
      .eq('id', wishlistId)
      .single();

    if (error) throw error;
    return data;
  }

  static async getItems(wishlistId: string): Promise<WishlistItem[]> {
    const { data, error } = await supabase
      .from('wishlist_items')
      .select('*')
      .eq('wishlist_id', wishlistId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const items = data || [];
    const allItemIds = items.map((item) => item.id);

    const claimsMap: Record<string, WishlistItem['claims']> = {};

    if (allItemIds.length > 0) {
      const { data: claimsData, error: claimsError } = await supabase
        .from('item_claims')
        .select('id, item_id, claimer_name, claimed_at')
        .in('item_id', allItemIds)
        .order('claimed_at', { ascending: true });

      if (!claimsError && claimsData) {
        claimsData.forEach((claim) => {
          if (!claimsMap[claim.item_id]) claimsMap[claim.item_id] = [];
          claimsMap[claim.item_id]!.push(claim);
        });
      }
    }

    return items.map((item) => ({
      ...item,
      priority: item.priority ?? 0,
      is_taken: item.is_taken ?? false,
      is_giftcard: item.is_giftcard ?? false,
      claims: claimsMap[item.id] || [],
    }));
  }

  static async addItem(wishlistId: string, form: ItemFormData): Promise<WishlistItem> {
    let imageUrl = form.url;

    if (form.link && !imageUrl) {
      try {
        const metadata = await fetchLinkMetadata(form.link);
        if (metadata?.image) imageUrl = metadata.image;
      } catch (e) {
        console.error('Failed to fetch metadata:', e);
      }
    }

    const { data, error } = await supabase
      .from('wishlist_items')
      .insert([{
        wishlist_id: wishlistId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        link: form.link.trim() || null,
        url: imageUrl || null,
        price_range: form.priceRange.trim() || null,
        priority: form.priority,
        is_giftcard: form.isGiftcard,
      }])
      .select()
      .single();

    if (error) throw error;
    return { ...data, priority: data.priority ?? 0, is_taken: data.is_taken ?? false, claims: [] };
  }

  static async updateItem(itemId: string, form: ItemFormData): Promise<void> {
    let imageUrl = form.url;

    if (form.link && !imageUrl) {
      try {
        const metadata = await fetchLinkMetadata(form.link);
        if (metadata?.image) imageUrl = metadata.image;
      } catch (e) {
        console.error('Failed to fetch metadata:', e);
      }
    }

    const { error } = await supabase
      .from('wishlist_items')
      .update({
        title: form.title.trim(),
        description: form.description.trim() || null,
        link: form.link.trim() || null,
        url: imageUrl || null,
        price_range: form.priceRange.trim() || null,
        priority: form.priority ?? 0,
        is_giftcard: form.isGiftcard,
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

  static async untakeItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('wishlist_items')
      .update({ is_taken: false, taken_by_name: null, taken_at: null })
      .eq('id', itemId);

    if (error) throw error;
  }

  static async getShareLink(wishlistId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('share_links')
      .select('token')
      .eq('wishlist_id', wishlistId)
      .maybeSingle();

    if (error) throw error;
    return data ? `${getBaseUrl()}/shared/${data.token}` : null;
  }

  static async createShareLink(wishlistId: string): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existing } = await supabase
      .from('share_links')
      .select('token')
      .eq('wishlist_id', wishlistId)
      .maybeSingle();

    if (existing) return `${getBaseUrl()}/shared/${existing.token}`;

    const shareToken = crypto.randomUUID();
    const { data, error } = await supabase
      .from('share_links')
      .insert({ wishlist_id: wishlistId, created_by: user.id, token: shareToken })
      .select('token')
      .single();

    if (error) throw error;
    return `${getBaseUrl()}/shared/${data.token}`;
  }
}
