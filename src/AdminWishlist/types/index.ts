export interface ItemClaim {
  id: string;
  item_id: string;
  claimer_name: string;
  claimed_at: string;
}

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
  taken_by_name: string | null;
  taken_at: string | null;
  created_at: string;
  // For gift card items: list of all claimers
  claims?: ItemClaim[];
}

export interface Wishlist {
  id: string;
  title: string;
  description: string | null;
  enable_links: boolean | null;
  enable_price: boolean | null;
  enable_priority: boolean | null;
  creator_name: string | null;
}

export interface ItemFormData {
  title: string;
  description: string;
  link: string;
  url?: string;
  priceRange: string;
  priority: number | null;
  isGiftcard: boolean;
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
  editDialogOpen: boolean;
  selectedEditItem: WishlistItem | null;
  editFormData: ItemFormData;
  updating: boolean;
  deleteDialogOpen: boolean;
  selectedDeleteItem: WishlistItem | null;
  deleting: boolean;
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
  openEditDialog: (item: WishlistItem) => void;
  setEditDialogOpen: (open: boolean) => void;
  setEditFormData: (data: ItemFormData) => void;
  handleUpdateItem: (e: React.FormEvent) => Promise<void>;
  openDeleteDialog: (item: WishlistItem) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  handleDeleteItem: () => Promise<void>;
}
