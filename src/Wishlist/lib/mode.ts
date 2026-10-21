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

/**
 * Until phase 4c, organizers and self-managed owners keep their existing
 * screens; only the owner mode lives on /wishlist/:id.
 */
export const modePath = (mode: Mode, wishlistId: string): string => {
  switch (mode) {
    case 'owner':
      return `/wishlist/${wishlistId}`;
    case 'organizer':
      return `/wishlist/${wishlistId}/admin`;
    case 'self':
      return `/wishlist/${wishlistId}/self`;
    default:
      return '/';
  }
};
