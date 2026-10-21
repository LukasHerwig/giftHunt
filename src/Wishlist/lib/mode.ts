import type { Mode } from '../types/index.ts';

interface ModeInput {
  wishlist: { creator_id: string; is_self_managed: boolean } | null;
  userId: string | undefined;
  /** The viewer is the list's organizer (a wishlist_admins row). */
  isOrganizer: boolean;
}

export const resolveMode = ({ wishlist, userId, isOrganizer }: ModeInput): Mode => {
  if (!wishlist || !userId) return 'none';
  if (wishlist.creator_id === userId) return wishlist.is_self_managed ? 'self' : 'owner';
  return isOrganizer ? 'organizer' : 'none';
};
