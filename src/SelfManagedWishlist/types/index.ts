import { Database } from '@/integrations/supabase/types';

export type Wishlist = Database['public']['Tables']['wishlists']['Row'];

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
  claim_cap: number | null;
  taken_by_name: string | null;
  taken_at: string | null;
  created_at: string;
  claims?: ItemClaim[];
}

export interface ItemFormData {
  title: string;
  description: string;
  link: string;
  url?: string;
  priceRange: string;
  priority: number | null;
  isGiftcard: boolean;
  claimCap: number | null;
}

export interface SelfManagedWishlistState {
  wishlist: Wishlist | null;
  items: WishlistItem[];
  loading: boolean;
  shareLink: string | null;
  generatingLink: boolean;
  // Add dialog
  addDialogOpen: boolean;
  newItem: ItemFormData;
  adding: boolean;
  // Edit dialog
  editDialogOpen: boolean;
  selectedEditItem: WishlistItem | null;
  editFormData: ItemFormData;
  updating: boolean;
  // Delete dialog
  deleteDialogOpen: boolean;
  selectedDeleteItem: WishlistItem | null;
  deleting: boolean;
  // Untake dialog
  untakeDialogOpen: boolean;
  selectedUntakeItem: WishlistItem | null;
  untaking: boolean;
  // Delete claim dialog
  deleteClaimDialogOpen: boolean;
  pendingDeleteClaim: { id: string; itemId: string; name: string } | null;
}

export interface SelfManagedWishlistActions {
  handleCopyShareLink: () => Promise<void>;
  // Add
  setAddDialogOpen: (open: boolean) => void;
  setNewItem: (item: ItemFormData) => void;
  handleAddItem: (e: React.FormEvent) => Promise<void>;
  // Edit
  openEditDialog: (item: WishlistItem) => void;
  setEditDialogOpen: (open: boolean) => void;
  setEditFormData: (data: ItemFormData) => void;
  handleUpdateItem: (e: React.FormEvent) => Promise<void>;
  // Delete
  openDeleteDialog: (item: WishlistItem) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  handleDeleteItem: () => Promise<void>;
  // Untake
  openUntakeDialog: (item: WishlistItem) => void;
  setUntakeDialogOpen: (open: boolean) => void;
  handleUntakeItem: () => Promise<void>;
  handleDeleteClaim: (claimId: string, itemId: string) => Promise<void>;
  openDeleteClaimDialog: (claimId: string, itemId: string, name: string) => void;
  setDeleteClaimDialogOpen: (open: boolean) => void;
}
