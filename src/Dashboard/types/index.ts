export interface Wishlist {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  item_count?: number;
}

export interface AdminWishlist {
  id: string;
  title: string;
  description: string | null;
  item_count?: number;
  owner_profile: {
    id: string;
    email: string;
  };
}

export interface PendingInvitation {
  id: string;
  wishlist_id: string;
  token: string;
  created_at: string;
  invited_by: string;
  wishlists: {
    title: string;
    description: string | null;
    owner_profile: {
      id: string;
      email: string;
    };
  };
}

export interface DashboardState {
  wishlists: Wishlist[];
  adminWishlists: AdminWishlist[];
  pendingInvitations: PendingInvitation[];
  loading: boolean;
  createDialogOpen: boolean;
  newTitle: string;
  newDescription: string;
  enableLinks: boolean;
  enablePrice: boolean;
  enablePriority: boolean;
  creating: boolean;
}

export interface DashboardActions {
  loadAllData: (userId: string) => Promise<void>;
  handleCreateWishlist: (e: React.FormEvent) => Promise<void>;
  handleCopyLink: (id: string) => void;
  handleSignOut: () => Promise<void>;
  handleAcceptInvitation: (invitationId: string) => Promise<void>;
  setCreateDialogOpen: (open: boolean) => void;
  setNewTitle: (title: string) => void;
  setNewDescription: (description: string) => void;
  setEnableLinks: (enable: boolean) => void;
  setEnablePrice: (enable: boolean) => void;
  setEnablePriority: (enable: boolean) => void;
}

export interface CreateWishlistForm {
  title: string;
  description: string;
  enableLinks: boolean;
  enablePrice: boolean;
  enablePriority: boolean;
}
