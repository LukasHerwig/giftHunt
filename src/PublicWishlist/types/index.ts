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
  claim_count?: number; // For gift card items: how many people have claimed
}

export interface Wishlist {
  title: string;
  description: string | null;
  enable_links: boolean | null;
  enable_price: boolean | null;
  enable_priority: boolean | null;
  creator_name: string | null;
}

export interface ShareLink {
  wishlist_id: string;
  expires_at: string | null;
}

export interface PublicWishlistState {
  wishlist: Wishlist | null;
  items: WishlistItem[];
  loading: boolean;
  shareLink: ShareLink | null;
  selectedItem: string | null;
  buyerName: string;
  claiming: boolean;
  dialogOpen: boolean;
}

export interface ClaimItemData {
  itemId: string;
  buyerName: string;
  isGiftcard?: boolean;
}
