import { supabase } from '@/integrations/supabase/client';
import { ITEM_COLUMNS } from '@/lib/itemColumns';
import { EmailService } from '@/lib/EmailService';
import { getBaseUrl } from '@/lib/urlUtils';
import { fetchLinkMetadata } from '@/lib/metadataUtils';
import {
  WishlistItem,
  Wishlist,
  WishlistAdmin,
  WishlistInvitation,
  ShareLink,
} from '../types';

export class ManageWishlistService {
  /**
   * Load wishlist, items, and share links
   */
  static async loadWishlistData(wishlistId: string) {
    // Load wishlist configuration
    const { data: wishlistData, error: wishlistError } = await supabase
      .from('wishlists')
      .select('*')
      .eq('id', wishlistId)
      .single();

    if (wishlistError) throw wishlistError;

    // The owner may know the list is shared, but never the token itself
    const { data: hasActiveShareLink, error: shareLinkError } =
      await supabase.rpc('wishlist_has_share_link', {
        p_wishlist_id: wishlistId,
      });

    if (shareLinkError) {
      console.error('Error checking share link:', shareLinkError);
    }

    // Load all items for the owner (but don't show taken status to maintain surprise)
    const { data: itemsData, error: itemsError } = await supabase
      .from('wishlist_items')
      .select(
        'id, title, description, link, url, price_range, priority, is_giftcard, claim_cap, created_at',
      )
      .eq('wishlist_id', wishlistId)
      .order('created_at', { ascending: false });

    if (itemsError) throw itemsError;

    return {
      wishlist: wishlistData,
      items: itemsData || [],
      shareLinks: [],
      hasActiveShareLink: hasActiveShareLink === true,
    };
  }

  /**
   * Load admin and invitation data
   */
  static async loadAdminData(wishlistId: string) {
    // Load current admins
    const { data: adminData, error: adminError } = await supabase
      .from('wishlist_admins')
      .select(
        `
        id,
        admin_id,
        created_at,
        profiles!admin_id (
          email
        )
      `,
      )
      .eq('wishlist_id', wishlistId);

    if (adminError) throw adminError;

    // Load pending invitations AND accepted ones (for showing completion status)
    const { data: inviteData, error: inviteError } = await supabase
      .from('admin_invitations')
      .select('*')
      .eq('wishlist_id', wishlistId)
      .gt('expires_at', new Date().toISOString());

    if (inviteError) throw inviteError;

    return {
      admins: adminData || [],
      invitations: inviteData || [],
    };
  }

  /**
   * Add a new wishlist item
   */
  static async addItem(
    wishlistId: string,
    itemData: {
      title: string;
      description: string | null;
      link: string | null;
      url?: string | null;
      price_range: string | null;
      priority: number | null;
      is_giftcard?: boolean;
      claim_cap?: number | null;
    },
  ): Promise<WishlistItem> {
    let imageUrl = itemData.url;

    console.log('addItem called with:', { itemData, imageUrl });

    // If link is provided but no image URL, try to fetch it
    if (itemData.link && !imageUrl) {
      try {
        console.log('Fetching metadata in addItem for:', itemData.link);
        const metadata = await fetchLinkMetadata(itemData.link);
        console.log('Metadata result in addItem:', metadata);
        if (metadata?.image) {
          imageUrl = metadata.image;
        }
      } catch (e) {
        console.error('Failed to fetch metadata in addItem:', e);
      }
    }

    const { data, error } = await supabase
      .from('wishlist_items')
      .insert([
        {
          wishlist_id: wishlistId,
          ...itemData,
          url: imageUrl,
        },
      ])
      .select(ITEM_COLUMNS)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing wishlist item
   */
  static async updateItem(
    itemId: string,
    itemData: {
      title: string;
      description: string | null;
      link: string | null;
      url?: string | null;
      price_range: string | null;
      priority: number | null;
      is_giftcard?: boolean;
      claim_cap?: number | null;
    },
  ): Promise<WishlistItem> {
    let imageUrl = itemData.url;

    // If link is provided and it's different from before, or if we just want to refresh
    // For simplicity, if link is present and url is not, we fetch
    if (itemData.link && !imageUrl) {
      try {
        const metadata = await fetchLinkMetadata(itemData.link);
        if (metadata?.image) {
          imageUrl = metadata.image;
        }
      } catch (e) {
        console.error('Failed to fetch metadata in updateItem:', e);
      }
    }

    const { data, error } = await supabase
      .from('wishlist_items')
      .update({
        ...itemData,
        url: imageUrl,
      })
      .eq('id', itemId)
      .select(ITEM_COLUMNS)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a wishlist item
   */
  static async deleteItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  }

  /**
   * Create an admin invitation
   */
  static async createAdminInvitation(
    wishlistId: string,
    email: string,
  ): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const { error } = await supabase.from('admin_invitations').insert({
      wishlist_id: wishlistId,
      email: email.trim(),
      invitation_token: token,
      expires_at: expiresAt.toISOString(),
      invited_by: user.id,
    });

    if (error) {
      if (error.code === '23505') {
        throw new Error('An invitation for this wishlist is already pending');
      }
      throw error;
    }

    const invitationLink = `${getBaseUrl()}/accept-invitation?token=${token}`;

    // Send invitation email
    try {
      // Get wishlist details for the email
      const { data: wishlistData } = await supabase
        .from('wishlists')
        .select('title')
        .eq('id', wishlistId)
        .single();

      // Get inviter details for the email
      const { data: inviterData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      await EmailService.sendInvitationEmail(
        email.trim(),
        invitationLink,
        wishlistData?.title || 'Wishlist',
        inviterData?.full_name || undefined,
      );
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't throw here - the invitation was created successfully
      // The user can still manually share the link
    }

    return invitationLink;
  }

  /**
   * Remove an invitation
   */
  static async removeInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from('admin_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) throw error;
  }

  /**
   * Remove an admin
   */
  static async removeAdmin(
    adminId: string,
    wishlistId: string,
  ): Promise<{
    adminEmail?: string;
    hadShareLinks: boolean;
  }> {
    // Deletes share links, untakes items, removes the admin and their
    // invitation in one transaction
    const { data, error } = await supabase.rpc('remove_wishlist_admin', {
      p_wishlist_id: wishlistId,
    });

    if (error) throw error;

    const result = data as unknown as {
      admin_email: string | null;
      had_share_links: boolean;
    };

    return {
      adminEmail: result.admin_email ?? undefined,
      hadShareLinks: result.had_share_links,
    };
  }

  /**
   * Update wishlist settings
   */
  static async updateWishlistSettings(
    wishlistId: string,
    settings: {
      title: string;
      description: string | null;
      enable_links: boolean;
      enable_price: boolean;
      enable_priority: boolean;
    },
  ): Promise<Wishlist> {
    const { data, error } = await supabase
      .from('wishlists')
      .update(settings)
      .eq('id', wishlistId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a wishlist
   */
  static async deleteWishlist(wishlistId: string): Promise<void> {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('id', wishlistId);

    if (error) throw error;
  }

  /**
   * Check authentication session
   */
  static async checkAuth() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  }
}
