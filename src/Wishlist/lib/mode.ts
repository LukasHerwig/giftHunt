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
  if (!isOrganizer) return 'none';
  return wishlist.is_self_managed ? 'helper' : 'organizer';
};

/**
 * A helper or organizer whose list no longer loads was removed (or the list went away)
 * while the screen was open: leave it instead of staying on a dead screen.
 */
export const leavesWhenListGone = (mode: Mode, code: string): boolean =>
  code === 'wishlist_not_found' && (mode === 'helper' || mode === 'organizer');
