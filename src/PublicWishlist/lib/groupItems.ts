import type { WishlistItem } from '../types/index.ts';

export type ItemKind = 'mine' | 'available' | 'taken';

export interface GroupedItems {
  mine: WishlistItem[];
  available: WishlistItem[];
  taken: WishlistItem[];
}

const claimCount = (item: WishlistItem) => item.claim_count ?? 0;

/** A gift card is taken only when its cap is reached; a regular item once it has any claim. */
export const isItemTaken = (item: WishlistItem): boolean => {
  if (item.is_giftcard) {
    return item.claim_cap != null && claimCount(item) >= item.claim_cap;
  }
  return item.is_taken || claimCount(item) > 0;
};

/** True while the item still carries at least one claim. */
const isStillClaimed = (item: WishlistItem): boolean =>
  item.is_giftcard ? claimCount(item) > 0 : item.is_taken || claimCount(item) > 0;

/**
 * "Mine" needs both this device's memory and a live claim: if the organizer
 * untakes the item it goes back to available even though the device remembers it.
 */
export const classifyItem = (
  item: WishlistItem,
  claimedIds: ReadonlySet<string>,
): ItemKind => {
  if (claimedIds.has(item.id) && isStillClaimed(item)) return 'mine';
  return isItemTaken(item) ? 'taken' : 'available';
};

export const groupItems = (
  items: WishlistItem[],
  claimedIds: ReadonlySet<string>,
): GroupedItems => {
  const grouped: GroupedItems = { mine: [], available: [], taken: [] };
  for (const item of items) {
    grouped[classifyItem(item, claimedIds)].push(item);
  }
  return grouped;
};
