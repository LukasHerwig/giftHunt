import type { Mode } from '../types/index.ts';

interface ModeInput {
  wishlist: { creator_id: string; is_self_managed: boolean; archived_at: string | null } | null;
  userId: string | undefined;
  /** The viewer is the list's organizer (a wishlist_admins row). */
  isOrganizer: boolean;
}

export const resolveMode = ({ wishlist, userId, isOrganizer }: ModeInput): Mode => {
  if (!wishlist || !userId) return 'none';
  if (wishlist.creator_id === userId) {
    if (wishlist.archived_at) return 'archived';
    return wishlist.is_self_managed ? 'self' : 'owner';
  }
  // An archived list is the owner's alone, whatever an organizer row says.
  if (wishlist.archived_at) return 'none';
  return isOrganizer ? 'organizer' : 'none';
};
