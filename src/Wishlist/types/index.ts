import type { Database } from '@/integrations/supabase/types';

export type Wishlist = Database['public']['Tables']['wishlists']['Row'];
type ItemRow = Database['public']['Tables']['wishlist_items']['Row'];

/** What an owner may read of an item: never the claim columns. */
export type OwnerItem = Pick<
  ItemRow,
  | 'id'
  | 'title'
  | 'description'
  | 'link'
  | 'url'
  | 'price_range'
  | 'priority'
  | 'is_giftcard'
  | 'claim_cap'
  | 'created_at'
>;

export interface ItemFormData {
  title: string;
  description: string;
  link: string;
  /** Image address, filled from the link's metadata. */
  url: string;
  priceRange: string;
  /** 1 low, 2 medium, 3 high, null none. */
  priority: number | null;
  isGiftcard: boolean;
  claimCap: number | null;
}

export type ItemFormError = 'title_required' | 'title_too_long' | 'claim_cap_invalid';

export type RequestKind = 'edit' | 'remove';

export interface ChangeRequestRow {
  id: string;
  item_id: string | null;
  item_title: string;
  kind: RequestKind;
  proposed: Record<string, unknown> | null;
  status: 'pending' | 'approved' | 'declined' | 'withdrawn';
  message: string | null;
  created_at: string;
  resolved_at: string | null;
}

export type ChangedField =
  | 'title'
  | 'description'
  | 'link'
  | 'image'
  | 'price'
  | 'priority'
  | 'giftcard'
  | 'claimCap';

export type FieldValue = string | number | boolean | null;

export interface FieldChange {
  field: ChangedField;
  /** Undefined once the change has been applied: the old value is gone. */
  before?: FieldValue;
  after: FieldValue;
}

export interface OwnerRequest {
  id: string;
  itemId: string | null;
  itemTitle: string;
  kind: RequestKind;
  /** applied = approved, kept = declined. Neutral on purpose. */
  state: 'pending' | 'applied' | 'kept';
  changes: FieldChange[];
  message: string | null;
  /** When it was sent (pending) or answered. ISO string. */
  when: string;
}

export type OrganizerState =
  | { kind: 'none' }
  | { kind: 'pending'; email: string; invitationId: string }
  | { kind: 'accepted'; name: string; email: string | null };

export interface OwnerData {
  wishlist: Wishlist;
  items: OwnerItem[];
  requests: ChangeRequestRow[];
  /** An active share link exists (the owner never sees the link itself). */
  shared: boolean;
  organizer: OrganizerState;
}

export type Sheet =
  | { type: 'add' }
  | { type: 'item'; itemId: string }
  | { type: 'share' }
  | { type: 'settings' }
  | null;

export type Mode = 'owner' | 'organizer' | 'self' | 'none';

export interface SettingsValues {
  title: string;
  description: string;
  enableLinks: boolean;
  enablePrice: boolean;
  enablePriority: boolean;
}
/** What an organizer reads of an item: the owner's columns plus who took it. */
export interface OrganizerItem extends OwnerItem {
  is_taken: boolean;
  taken_by_name: string | null;
  taken_at: string | null;
}

export interface ClaimRow {
  id: string;
  item_id: string;
  claimer_name: string;
  claimed_at: string;
}

export interface ItemWithClaims {
  item: OrganizerItem;
  /** Oldest first. */
  claims: ClaimRow[];
}

export interface ShareLinkRow {
  token: string;
  is_active: boolean;
}

export interface OrganizerData {
  wishlist: Wishlist;
  /** The owner's name, for "Önskelista av Anna". */
  ownerName: string | null;
  items: OrganizerItem[];
  claims: ClaimRow[];
  /** Pending requests only. */
  requests: ChangeRequestRow[];
  shareLink: ShareLinkRow | null;
}

/** A pending request plus what only an organizer may know: is the item taken, and by whom. */
export interface OrganizerRequest extends OwnerRequest {
  claimed: boolean;
  claimedBy: string | null;
}

export type OrganizerSheet =
  | { type: 'add' }
  | { type: 'item'; itemId: string }
  | { type: 'edit'; itemId: string }
  | { type: 'share' }
  | { type: 'settings' }
  | null;
