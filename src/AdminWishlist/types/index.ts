export interface WishlistItem {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  price_range: string | null;
  priority: number;
  is_taken: boolean;
  taken_by_name: string | null;
  taken_at: string | null;
  created_at: string;
}

export interface Wishlist {
  id: string;
  title: string;
  description: string | null;
  enable_links: boolean | null;
  enable_price: boolean | null;
  enable_priority: boolean | null;
}

export interface AdminWishlistState {
  wishlist: Wishlist | null;
  items: WishlistItem[];
  loading: boolean;
  isAdmin: boolean;
  shareLink: string | null;
  generatingLink: boolean;
  untakeDialogOpen: boolean;
  selectedUntakeItem: WishlistItem | null;
  untaking: boolean;
}

export interface AdminWishlistActions {
  checkAdminAccess: () => Promise<void>;
  loadWishlist: () => Promise<void>;
  loadItems: () => Promise<void>;
  loadShareLink: () => Promise<void>;
  generateShareLink: () => Promise<string | null>;
  handleCopyShareLink: () => Promise<void>;
  handleUntakeItem: () => Promise<void>;
  openUntakeDialog: (item: WishlistItem) => void;
  setUntakeDialogOpen: (open: boolean) => void;
}
