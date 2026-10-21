import type { ClaimRow, ItemWithClaims, OrganizerItem } from '../types/index.ts';

/**
 * Taken means there is nothing more to give. A gift card with claims below its cap
 * stays available (and shows its progress); an unlimited one never runs out.
 */
export const isItemTaken = (item: OrganizerItem, claimCount: number): boolean => {
  if (item.is_taken) return true;
  if (!item.is_giftcard) return claimCount > 0;
  return item.claim_cap != null && claimCount >= item.claim_cap;
};

/** The people who took or gave, oldest first, each once. */
export const takerNames = (item: OrganizerItem, claims: ClaimRow[]): string[] => {
  const names = [...claims]
    .sort((a, b) => a.claimed_at.localeCompare(b.claimed_at))
    .map((claim) => claim.claimer_name);
  const all = !item.is_giftcard && item.taken_by_name ? [item.taken_by_name, ...names] : names;
  return all.filter((name, index) => all.indexOf(name) === index);
};

/** Anyone has taken or given something. */
export const hasClaims = (item: OrganizerItem, claims: ClaimRow[]): boolean =>
  item.is_taken || claims.length > 0;

export const splitItems = (
  items: OrganizerItem[],
  claims: ClaimRow[],
): { available: ItemWithClaims[]; taken: ItemWithClaims[] } => {
  const byItem = new Map<string, ClaimRow[]>();
  for (const claim of claims) byItem.set(claim.item_id, [...(byItem.get(claim.item_id) ?? []), claim]);

  const available: ItemWithClaims[] = [];
  const taken: ItemWithClaims[] = [];
  for (const item of items) {
    const itemClaims = [...(byItem.get(item.id) ?? [])].sort((a, b) =>
      a.claimed_at.localeCompare(b.claimed_at),
    );
    (isItemTaken(item, itemClaims.length) ? taken : available).push({ item, claims: itemClaims });
  }
  return { available, taken };
};
