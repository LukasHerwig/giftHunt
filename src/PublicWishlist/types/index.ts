export interface WishlistItem {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  url: string | null;
  price_range: string | null;
  priority: number;
  is_taken: boolean;
  is_giftcard: boolean | null;
  claim_cap: number | null;
  claim_count?: number;
}

export interface Wishlist {
  title: string;
  description: string | null;
  enable_links: boolean | null;
  enable_price: boolean | null;
  enable_priority: boolean | null;
  creator_name: string | null;
  organizer_name: string | null;
}

export interface ShareLink {
  wishlist_id: string;
  expires_at: string | null;
}

export interface Receipt {
  name: string;
  title: string;
  price: string | null;
  link: string | null;
}

export interface PublicWishlistState {
  wishlist: Wishlist | null;
  items: WishlistItem[];
  loading: boolean;
  shareLink: ShareLink | null;
  selectedItemId: string | null;
  receipt: Receipt | null;
  buyerName: string;
  nameError: boolean;
  claiming: boolean;
  /** Item ids this device claimed on this list (from localStorage). */
  claimedIds: string[];
}

export interface ClaimItemData {
  token: string;
  itemId: string;
  buyerName: string;
}
