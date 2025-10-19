import { supabase } from '@/integrations/supabase/client';
import { EmailService } from '@/lib/EmailService';
import { getBaseUrl } from '@/lib/urlUtils';
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

    // Load active share links for this wishlist
    const { data: shareLinksData, error: shareLinksError } = await supabase
      .from('share_links')
      .select('*')
      .eq('wishlist_id', wishlistId)
      .or('expires_at.is.null,expires_at.gt.now()'); // Active links (no expiry or not expired)

    if (shareLinksError) {
      console.error('Error loading share links:', shareLinksError);
    }

    // Load all items for the owner (but don't show taken status to maintain surprise)
    const { data: itemsData, error: itemsError } = await supabase
      .from('wishlist_items')
      .select('id, title, description, link, price_range, priority, created_at')
      .eq('wishlist_id', wishlistId)
      .order('created_at', { ascending: false });

    if (itemsError) throw itemsError;

    return {
      wishlist: wishlistData,
      items: itemsData || [],
      shareLinks: shareLinksData || [],
      hasActiveShareLink: (shareLinksData || []).length > 0,
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
      `
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
      price_range: string | null;
      priority: number | null;
    }
  ): Promise<WishlistItem> {
    const { data, error } = await supabase
      .from('wishlist_items')
      .insert([
        {
          wishlist_id: wishlistId,
          ...itemData,
        },
      ])
      .select()
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
      price_range: string | null;
      priority: number | null;
    }
  ): Promise<WishlistItem> {
    const { data, error } = await supabase
      .from('wishlist_items')
      .update(itemData)
      .eq('id', itemId)
      .select()
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
    email: string
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
        inviterData?.full_name || undefined
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
    wishlistId: string
  ): Promise<{
    adminEmail?: string;
    hadShareLinks: boolean;
  }> {
    // First, find the admin to get their email for invitation cleanup
    const { data: adminData } = await supabase
      .from('wishlist_admins')
      .select('profiles!admin_id(email)')
      .eq('id', adminId)
      .single();

    const adminEmail = adminData?.profiles?.email;

    // Remove any active share links for this wishlist
    const { data: deletedLinks, error: shareLinkError } = await supabase
      .from('share_links')
      .delete()
      .eq('wishlist_id', wishlistId)
      .select();

    if (shareLinkError) {
      console.error('Error removing share links:', shareLinkError);
    }

    // Remove the admin record
    const { error: adminError } = await supabase
      .from('wishlist_admins')
      .delete()
      .eq('id', adminId);

    if (adminError) throw adminError;

    // Also remove their invitation record to allow re-inviting
    if (adminEmail) {
      const { error: inviteError } = await supabase
        .from('admin_invitations')
        .delete()
        .eq('email', adminEmail)
        .eq('wishlist_id', wishlistId);

      if (inviteError) {
        console.log(
          'Note: Could not find invitation record to clean up:',
          inviteError
        );
      }
    }

    return {
      adminEmail,
      hadShareLinks: (deletedLinks || []).length > 0,
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
    }
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
