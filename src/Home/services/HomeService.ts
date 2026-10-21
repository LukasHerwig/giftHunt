import { supabase } from '@/integrations/supabase/client';
import { toNewListRow } from '../lib/newList';
import type {
  HomeData,
  InvitationRaw,
  NewListForm,
  OrganizedListRaw,
  OwnedListRaw,
  ProfileName,
} from '../types';

type CountRow = { count: number }[] | null;
const countOf = (rows: CountRow): number => rows?.[0]?.count ?? 0;

export class HomeService {
  static async loadHome(userId: string, email: string): Promise<HomeData> {
    const [owned, organized, invitations] = await Promise.all([
      HomeService.loadOwned(userId),
      HomeService.loadOrganized(userId),
      HomeService.loadInvitations(email),
    ]);
    return { owned, organized, invitations };
  }

  /** Lists the user made, including ones made for someone else; item count and organizer in one query. */
  private static async loadOwned(userId: string): Promise<OwnedListRaw[]> {
    const { data, error } = await supabase
      .from('wishlists')
      .select(
        'id, title, description, is_self_managed, created_at, items:wishlist_items(count), admins:wishlist_admins(profile:profiles!admin_id(full_name, email))',
      )
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    type Row = Omit<OwnedListRaw, 'itemCount' | 'organizer'> & {
      items: CountRow;
      admins: { profile: ProfileName | null }[] | null;
    };
    return ((data ?? []) as unknown as Row[]).map(({ items, admins, ...list }) => ({
      ...list,
      itemCount: countOf(items),
      organizer: admins?.[0]?.profile ?? null,
    }));
  }

  /** Lists someone else made and the user organizes, with how many requests wait. */
  private static async loadOrganized(userId: string): Promise<OrganizedListRaw[]> {
    const { data, error } = await supabase
      .from('wishlists')
      .select(
        'id, title, description, owner:profiles!creator_id(full_name, email), items:wishlist_items(count), mine:wishlist_admins!inner(admin_id)',
      )
      .eq('mine.admin_id', userId)
      .neq('creator_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    type Row = Omit<OrganizedListRaw, 'itemCount' | 'requestCount' | 'owner'> & {
      owner: ProfileName | null;
      items: CountRow;
    };
    const lists = (data ?? []) as unknown as Row[];
    if (lists.length === 0) return [];

    const { data: requests, error: requestError } = await supabase
      .from('item_change_requests')
      .select('wishlist_id')
      .eq('status', 'pending')
      .in('wishlist_id', lists.map((list) => list.id));
    if (requestError) throw requestError;
    const waiting = new Map<string, number>();
    for (const request of requests ?? []) {
      waiting.set(request.wishlist_id, (waiting.get(request.wishlist_id) ?? 0) + 1);
    }

    return lists.map(({ items, ...list }) => ({
      ...list,
      itemCount: countOf(items),
      requestCount: waiting.get(list.id) ?? 0,
    }));
  }

  private static async loadInvitations(email: string): Promise<InvitationRaw[]> {
    if (!email) return [];
    const { data, error } = await supabase
      .from('admin_invitations')
      .select(
        'id, wishlist_id, wishlist:wishlists(title, description), inviter:profiles!invited_by(full_name, email)',
      )
      .ilike('email', email)
      .eq('accepted', false)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
    if (error) throw error;

    type Row = {
      id: string;
      wishlist_id: string;
      wishlist: { title: string; description: string | null } | null;
      inviter: ProfileName | null;
    };
    return ((data ?? []) as unknown as Row[]).map((row) => ({
      id: row.id,
      wishlistId: row.wishlist_id,
      title: row.wishlist?.title ?? '',
      description: row.wishlist?.description ?? null,
      inviter: row.inviter,
    }));
  }

  /** Creates the list; one made for someone else also makes the creator its organizer (undone if that fails). */
  static async createList(userId: string, form: NewListForm): Promise<string> {
    const { data, error } = await supabase
      .from('wishlists')
      .insert(toNewListRow(userId, form))
      .select('id')
      .single();
    if (error) throw error;

    if (form.kind === 'other') {
      const { error: adminError } = await supabase
        .from('wishlist_admins')
        .insert({ wishlist_id: data.id, admin_id: userId, invited_by: userId });
      if (adminError) {
        await supabase.from('wishlists').delete().eq('id', data.id);
        throw adminError;
      }
    }
    return data.id;
  }

  static async acceptInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase.rpc('accept_invitation', { p_invitation_id: invitationId });
    if (error) throw error;
  }

  static async declineInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase.rpc('decline_invitation', { p_invitation_id: invitationId });
    if (error) throw error;
  }
}
