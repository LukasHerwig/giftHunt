import type { Wishlist, WishlistItem } from '../types/index.ts';

export type Translate = (key: string, options?: Record<string, unknown>) => string;

/** Store links come from the list owner: always open them as an https URL. */
export const toStoreUrl = (link: string): string => {
  const trimmed = link.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export const priorityKey = (priority: number): 'high' | 'medium' | 'low' | null => {
  if (priority === 3) return 'high';
  if (priority === 2) return 'medium';
  if (priority === 1) return 'low';
  return null;
};

/** "ca 400 kr · Prio hög", honouring the list's price and priority switches. */
export const buildMeta = (item: WishlistItem, wishlist: Wishlist, t: Translate): string => {
  const parts: string[] = [];
  if (wishlist.enable_price && item.price_range) parts.push(item.price_range);
  const prio = wishlist.enable_priority ? priorityKey(item.priority) : null;
  if (prio) parts.push(t(`publicWishlist.prio.${prio}`));
  return parts.join(' · ');
};

export const claimLabel = (count: number, cap: number | null, t: Translate): string =>
  cap != null && cap > 0
    ? t('publicWishlist.claimsOfCap', { count, cap })
    : t('publicWishlist.claimsCount', { count });
