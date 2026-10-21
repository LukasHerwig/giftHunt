import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { EmailService } from '@/lib/EmailService';
import { ITEM_COLUMNS } from '@/lib/itemColumns';
import { fetchLinkMetadata } from '@/lib/metadataUtils';
import { getBaseUrl } from '@/lib/urlUtils';
import { toItemRow, type ItemRowValues } from '../lib/itemForm';
import type {
  ChangeRequestRow,
  ItemFormData,
  OrganizerState,
  OwnerData,
  OwnerItem,
  SettingsValues,
  Wishlist,
} from '../types';

const REQUEST_COLUMNS =
  'id, item_id, item_title, kind, proposed, status, message, created_at, resolved_at';

export class WishlistService {
  static async loadWishlist(wishlistId: string): Promise<Wishlist | null> {
    const { data, error } = await supabase
      .from('wishlists')
      .select('*')
      .eq('id', wishlistId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  static async isOrganizer(wishlistId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('wishlist_admins')
      .select('id')
      .eq('wishlist_id', wishlistId)
      .eq('admin_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data !== null;
  }

  static async loadOwnerData(wishlistId: string): Promise<OwnerData> {
    const wishlist = await WishlistService.loadWishlist(wishlistId);
    if (!wishlist) throw new Error('wishlist_not_found');
    const [items, requests, shared, organizer] = await Promise.all([
      WishlistService.loadItems(wishlistId),
      WishlistService.loadRequests(wishlistId),
      WishlistService.loadShared(wishlistId),
      WishlistService.loadOrganizer(wishlistId),
    ]);
    return { wishlist, items, requests, shared, organizer };
  }

  private static async loadItems(wishlistId: string): Promise<OwnerItem[]> {
    const { data, error } = await supabase
      .from('wishlist_items')
      .select(ITEM_COLUMNS)
      .eq('wishlist_id', wishlistId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as OwnerItem[];
  }

  private static async loadRequests(wishlistId: string): Promise<ChangeRequestRow[]> {
    const { data, error } = await supabase
      .from('item_change_requests')
      .select(REQUEST_COLUMNS)
      .eq('wishlist_id', wishlistId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as ChangeRequestRow[];
  }

  /** The owner may know the list is shared, never the link itself. */
  private static async loadShared(wishlistId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('wishlist_has_share_link', {
      p_wishlist_id: wishlistId,
    });
    if (error) {
      console.error('Error checking share link:', error);
      return false;
    }
    return data === true;
  }

  private static async loadOrganizer(wishlistId: string): Promise<OrganizerState> {
    const { data: admins, error: adminError } = await supabase
      .from('wishlist_admins')
      .select('id, profiles!admin_id(email, full_name)')
      .eq('wishlist_id', wishlistId);
    if (adminError) throw adminError;

    const admin = admins?.[0] as unknown as
      | { profiles: { email: string | null; full_name: string | null } | null }
      | undefined;
    if (admin) {
      return {
        kind: 'accepted',
        name: admin.profiles?.full_name || admin.profiles?.email || '',
        email: admin.profiles?.email ?? null,
      };
    }

    const { data: invites, error: inviteError } = await supabase
      .from('admin_invitations')
      .select('id, email')
      .eq('wishlist_id', wishlistId)
      .eq('accepted', false)
      .gt('expires_at', new Date().toISOString())
      .limit(1);
    if (inviteError) throw inviteError;

    const invite = invites?.[0];
    if (invite) return { kind: 'pending', email: invite.email, invitationId: invite.id };
    return { kind: 'none' };
  }

  /** Pasting a link fills the picture from the link's metadata. */
  static async withLinkImage(form: ItemFormData): Promise<ItemFormData> {
    if (!form.link.trim() || form.url.trim()) return form;
    const metadata = await fetchLinkMetadata(form.link);
    return metadata?.image ? { ...form, url: metadata.image } : form;
  }

  static async addItem(wishlistId: string, form: ItemFormData): Promise<void> {
    const ready = await WishlistService.withLinkImage(form);
    const { error } = await supabase
      .from('wishlist_items')
      .insert({ wishlist_id: wishlistId, ...toItemRow(ready) });
    if (error) throw error;
  }

  /** A direct update. If the list was shared meanwhile RLS matches no row. */
  static async updateItem(itemId: string, form: ItemFormData): Promise<void> {
    const ready = await WishlistService.withLinkImage(form);
    const { data, error } = await supabase
      .from('wishlist_items')
      .update(toItemRow(ready))
      .eq('id', itemId)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('edit_locked');
  }

  static async deleteItem(itemId: string): Promise<void> {
    const { data, error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('id', itemId)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('edit_locked');
  }

  static async requestEdit(itemId: string, proposal: Partial<ItemRowValues>): Promise<void> {
    const { error } = await supabase.rpc('request_item_change', {
      p_item_id: itemId,
      p_kind: 'edit',
      p_proposed: proposal as Json,
    });
    if (error) throw error;
  }

  static async requestRemove(itemId: string): Promise<void> {
    const { error } = await supabase.rpc('request_item_change', {
      p_item_id: itemId,
      p_kind: 'remove',
    });
    if (error) throw error;
  }

  static async withdrawRequest(requestId: string): Promise<void> {
    const { error } = await supabase.rpc('withdraw_change_request', {
      p_request_id: requestId,
    });
    if (error) throw error;
  }

  static async invite(wishlistId: string, email: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('not_authenticated');

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error } = await supabase.from('admin_invitations').insert({
      wishlist_id: wishlistId,
      email: email.trim(),
      invitation_token: token,
      expires_at: expiresAt.toISOString(),
      invited_by: user.id,
    });
    if (error) {
      if (error.code === '23505') throw new Error('invite_pending');
      throw error;
    }

    // The invitation exists even if the mail fails; the owner can retry later.
    try {
      const { data: list } = await supabase
        .from('wishlists')
        .select('title')
        .eq('id', wishlistId)
        .single();
      const { data: inviter } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      await EmailService.sendInvitationEmail(
        email.trim(),
        `${getBaseUrl()}/accept-invitation?token=${token}`,
        list?.title || 'Wishlist',
        inviter?.full_name || undefined,
      );
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
    }
  }

  static async revokeInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase.from('admin_invitations').delete().eq('id', invitationId);
    if (error) throw error;
  }

  /** Removes the organizer, their link and their invitation in one transaction. */
  static async removeOrganizer(wishlistId: string): Promise<void> {
    const { error } = await supabase.rpc('remove_wishlist_admin', { p_wishlist_id: wishlistId });
    if (error) throw error;
  }

  static async updateSettings(wishlistId: string, values: SettingsValues): Promise<void> {
    const { error } = await supabase
      .from('wishlists')
      .update({
        title: values.title.trim(),
        description: values.description.trim() || null,
        enable_links: values.enableLinks,
        enable_price: values.enablePrice,
        enable_priority: values.enablePriority,
      })
      .eq('id', wishlistId);
    if (error) throw error;
  }

  static async deleteList(wishlistId: string): Promise<void> {
    const { error } = await supabase.from('wishlists').delete().eq('id', wishlistId);
    if (error) throw error;
  }
}
