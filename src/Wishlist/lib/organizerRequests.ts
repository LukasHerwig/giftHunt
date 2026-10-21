import { toOwnerRequests } from './changeRequests.ts';
import { hasClaims, takerNames } from './organizerItems.ts';
import type { ChangeRequestRow, ClaimRow, OrganizerItem, OrganizerRequest } from '../types/index.ts';

/**
 * The organizer's view of the owner's pending requests: what is asked, and whether
 * the item is taken (which the owner is never told).
 */
export const toOrganizerRequests = (
  rows: ChangeRequestRow[],
  items: OrganizerItem[],
  claims: ClaimRow[],
  now: Date,
): OrganizerRequest[] => {
  const byId = new Map(items.map((item) => [item.id, item]));
  return toOwnerRequests(
    rows.filter((row) => row.status === 'pending'),
    items,
    now,
  ).map((request): OrganizerRequest => {
    const item = request.itemId ? byId.get(request.itemId) : undefined;
    const itemClaims = item ? claims.filter((claim) => claim.item_id === item.id) : [];
    const names = item ? takerNames(item, itemClaims) : [];
    return {
      ...request,
      claimed: item ? hasClaims(item, itemClaims) : false,
      claimedBy: names.length > 0 ? names.join(', ') : null,
    };
  });
};
