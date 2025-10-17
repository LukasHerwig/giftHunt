import { Database } from '@/integrations/supabase/types';

export interface WishlistItem {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  price_range: string | null;
  priority: number;
  created_at: string;
}

export type Wishlist = Database['public']['Tables']['wishlists']['Row'];

export interface WishlistAdmin {
  id: string;
  admin_id: string;
  created_at: string;
  profiles: {
    email: string | null;
  } | null;
}

export interface WishlistInvitation {
  id: string;
  email: string;
  invitation_token: string;
  created_at: string;
  expires_at: string;
  accepted: boolean;
  wishlist_id: string;
  invited_by: string;
}

export interface ShareLink {
  id: string;
  wishlist_id: string;
  token: string;
  created_by: string;
  expires_at: string | null;
  created_at: string;
}

export interface ManageWishlistState {
  items: WishlistItem[];
  wishlist: Wishlist | null;
  loading: boolean;
  dialogOpen: boolean;
  editDialogOpen: boolean;
  inviteDialogOpen: boolean;
  settingsDialogOpen: boolean;
  deleteDialogOpen: boolean;
  admins: WishlistAdmin[];
  invitations: WishlistInvitation[];
  hasActiveShareLink: boolean;
  shareLinks: ShareLink[];
}

export interface ItemFormData {
  title: string;
  description: string;
  link: string;
  priceRange: string;
  priority: number | null;
}

export interface SettingsFormData {
  enableLinks: boolean;
  enablePrice: boolean;
  enablePriority: boolean;
}
