import { supabase } from '@/integrations/supabase/client';
import {
  Wishlist,
  AdminWishlist,
  PendingInvitation,
  CreateWishlistForm,
} from '../types';

export class DashboardService {
  static async getOwnedWishlists(userId: string): Promise<Wishlist[]> {
    const { data: ownedData, error: ownedError } = await supabase
      .from('wishlists')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });

    if (ownedError) throw ownedError;

    // Load item counts for owned wishlists
    const ownedWishlistsWithCounts = await Promise.all(
      (ownedData || []).map(async (wishlist) => {
        const { count, error: countError } = await supabase
          .from('wishlist_items')
          .select('*', { count: 'exact', head: true })
          .eq('wishlist_id', wishlist.id);

        if (countError) {
          console.error('Error counting items:', countError);
          return { ...wishlist, item_count: 0 };
        }

        return { ...wishlist, item_count: count || 0 };
      })
    );

    return ownedWishlistsWithCounts;
  }

  static async getAdminWishlists(userId: string): Promise<AdminWishlist[]> {
    // Load admin wishlists - simplified approach without joins
    const { data: adminRelations, error: adminRelError } = await supabase
      .from('wishlist_admins')
      .select('wishlist_id')
      .eq('admin_id', userId);

    if (adminRelError) {
      console.error('Admin relations error:', adminRelError);
      throw adminRelError;
    }

    let adminWishlistsFormatted: AdminWishlist[] = [];

    if (adminRelations && adminRelations.length > 0) {
      const wishlistIds = adminRelations.map((rel) => rel.wishlist_id);

      // Get the wishlists separately
      const { data: adminWishlistData, error: adminWishlistError } =
        await supabase.from('wishlists').select('*').in('id', wishlistIds);

      if (adminWishlistError) {
        console.error('Admin wishlists error:', adminWishlistError);
        throw adminWishlistError;
      }

      // Get owner details for each wishlist
      const wishlistUserIds =
        adminWishlistData?.map((wl) => wl.creator_id) || [];
      const ownerProfiles: Record<string, { id: string; email: string }> = {};

      if (wishlistUserIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', wishlistUserIds);

        if (!profileError && profileData) {
          profileData.forEach((profile) => {
            ownerProfiles[profile.id] = profile;
          });
        }
      }

      // Get admin wishlists with item counts
      const adminWishlistsWithCounts = await Promise.all(
        (adminWishlistData || []).map(async (wishlist) => {
          const { count, error: countError } = await supabase
            .from('wishlist_items')
            .select('*', { count: 'exact', head: true })
            .eq('wishlist_id', wishlist.id);

          if (countError) {
            console.error('Error counting items:', countError);
          }

          return {
            id: wishlist.id,
            title: wishlist.title,
            description: wishlist.description,
            item_count: count || 0,
            owner_profile: ownerProfiles[wishlist.creator_id] || {
              id: wishlist.creator_id,
              email: 'Unknown',
            },
          };
        })
      );

      adminWishlistsFormatted = adminWishlistsWithCounts;
    }

    return adminWishlistsFormatted;
  }

  static async getPendingInvitations(
    userEmail: string
  ): Promise<PendingInvitation[]> {
    // Load pending invitations - simplified approach
    const { data: invitationData, error: invitationError } = await supabase
      .from('admin_invitations')
      .select('id, wishlist_id, invitation_token, created_at, invited_by')
      .eq('email', userEmail)
      .eq('accepted', false);

    if (invitationError) throw invitationError;

    let formattedInvitations: PendingInvitation[] = [];

    if (invitationData && invitationData.length > 0) {
      // Get wishlist details separately
      const wishlistIds = invitationData.map((inv) => inv.wishlist_id);
      const { data: invitationWishlists, error: invWishlistError } =
        await supabase
          .from('wishlists')
          .select('id, title, description, creator_id')
          .in('id', wishlistIds);

      if (invWishlistError) throw invWishlistError;

      // Get inviter details for invitations (the people who sent the invitations)
      const inviterIds = invitationData.map((inv) => inv.invited_by);
      const inviterProfiles: Record<string, { id: string; email: string }> = {};

      if (inviterIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', inviterIds);

        if (!profileError && profileData) {
          profileData.forEach((profile) => {
            inviterProfiles[profile.id] = profile;
          });
        }
      }

      formattedInvitations = invitationData.map((invitation) => {
        const wishlist = invitationWishlists?.find(
          (wl) => wl.id === invitation.wishlist_id
        );
        return {
          id: invitation.id,
          wishlist_id: invitation.wishlist_id,
          token: invitation.invitation_token,
          created_at: invitation.created_at,
          invited_by: invitation.invited_by,
          wishlists: {
            title: wishlist?.title || 'Unknown',
            description: wishlist?.description || null,
            owner_profile: inviterProfiles[invitation.invited_by] || {
              id: invitation.invited_by,
              email: 'Unknown',
            },
          },
        };
      });
    }

    return formattedInvitations;
  }

  static async createWishlist(
    userId: string,
    form: CreateWishlistForm
  ): Promise<Wishlist> {
    const { data, error } = await supabase
      .from('wishlists')
      .insert([
        {
          creator_id: userId,
          title: form.title.trim(),
          description: form.description.trim() || null,
          enable_links: form.enableLinks,
          enable_price: form.enablePrice,
          enable_priority: form.enablePriority,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { ...data, item_count: 0 };
  }

  static async acceptInvitation(
    invitationId: string,
    userId: string,
    wishlistId: string,
    invitedBy: string
  ): Promise<void> {
    // The database trigger automatically creates the admin record when accepted = true
    // So we only need to mark the invitation as accepted
    const { error } = await supabase
      .from('admin_invitations')
      .update({ accepted: true })
      .eq('id', invitationId);

    if (error) throw error;
  }

  static async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
}
