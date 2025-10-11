import { supabase } from '@/integrations/supabase/client';

// API Client for .NET Wishlist API (using Supabase auth)
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Remove auth-related interfaces since we're using Supabase
export interface CreateWishlistRequest {
  title: string;
  description?: string;
}

export interface UpdateWishlistRequest {
  title?: string;
  description?: string;
}

export interface CreateWishlistItemRequest {
  title: string;
  description?: string;
  link?: string;
  priceRange?: string;
  priority?: number;
}

export interface UpdateWishlistItemRequest {
  title?: string;
  description?: string;
  link?: string;
  priceRange?: string;
  priority?: number;
}

export interface InviteAdminRequest {
  email: string;
}

// API Response Types (matching your .NET DTOs)
export interface WishlistDto {
  id: string;
  title: string;
  description?: string;
  creatorId: string;
  createdAt: string;
  isPublic?: boolean;
}

export interface WishlistItemDto {
  id: string;
  wishlistId: string;
  title: string;
  description?: string;
  link?: string;
  priceRange?: string;
  priority?: number;
  claimedBy?: string;
  claimedAt?: string;
  createdAt: string;
}

export interface ProfileDto {
  id: string;
  email: string;
  createdAt: string;
}

export interface AdminInvitationDto {
  id: string;
  wishlistId: string;
  email: string;
  invitationToken: string;
  createdAt: string;
  expiresAt: string;
  accepted: boolean;
  invitedBy: string;
}

export interface ShareLinkDto {
  id: string;
  wishlistId: string;
  linkToken: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5176';
    this.accessToken = localStorage.getItem('access_token');
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          error:
            responseData.message || responseData.title || 'An error occurred',
        };
      }

      return {
        data: responseData,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthTokens>> {
    const response = await this.request<AuthTokens>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.data) {
      this.accessToken = response.data.accessToken;
      localStorage.setItem('access_token', response.data.accessToken);
      localStorage.setItem('refresh_token', response.data.refreshToken);
    }

    return response;
  }

  async register(
    credentials: RegisterRequest
  ): Promise<ApiResponse<AuthTokens>> {
    const response = await this.request<AuthTokens>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.data) {
      this.accessToken = response.data.accessToken;
      localStorage.setItem('access_token', response.data.accessToken);
      localStorage.setItem('refresh_token', response.data.refreshToken);
    }

    return response;
  }

  async logout(): Promise<void> {
    this.accessToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  async getCurrentUser(): Promise<ApiResponse<ProfileDto>> {
    return this.request<ProfileDto>('/api/auth/me');
  }

  // Wishlist methods
  async getWishlists(): Promise<ApiResponse<WishlistDto[]>> {
    return this.request<WishlistDto[]>('/api/wishlists');
  }

  async getWishlistById(id: string): Promise<ApiResponse<WishlistDto>> {
    return this.request<WishlistDto>(`/api/wishlists/${id}`);
  }

  async createWishlist(
    wishlist: CreateWishlistRequest
  ): Promise<ApiResponse<WishlistDto>> {
    return this.request<WishlistDto>('/api/wishlists', {
      method: 'POST',
      body: JSON.stringify(wishlist),
    });
  }

  async updateWishlist(
    id: string,
    wishlist: UpdateWishlistRequest
  ): Promise<ApiResponse<WishlistDto>> {
    return this.request<WishlistDto>(`/api/wishlists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(wishlist),
    });
  }

  async deleteWishlist(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/wishlists/${id}`, {
      method: 'DELETE',
    });
  }

  // Wishlist Items methods
  async getWishlistItems(
    wishlistId: string
  ): Promise<ApiResponse<WishlistItemDto[]>> {
    return this.request<WishlistItemDto[]>(
      `/api/wishlists/${wishlistId}/items`
    );
  }

  async getWishlistItem(
    wishlistId: string,
    itemId: string
  ): Promise<ApiResponse<WishlistItemDto>> {
    return this.request<WishlistItemDto>(
      `/api/wishlists/${wishlistId}/items/${itemId}`
    );
  }

  async createWishlistItem(
    wishlistId: string,
    item: CreateWishlistItemRequest
  ): Promise<ApiResponse<WishlistItemDto>> {
    return this.request<WishlistItemDto>(`/api/wishlists/${wishlistId}/items`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async updateWishlistItem(
    wishlistId: string,
    itemId: string,
    item: UpdateWishlistItemRequest
  ): Promise<ApiResponse<WishlistItemDto>> {
    return this.request<WishlistItemDto>(
      `/api/wishlists/${wishlistId}/items/${itemId}`,
      {
        method: 'PUT',
        body: JSON.stringify(item),
      }
    );
  }

  async deleteWishlistItem(
    wishlistId: string,
    itemId: string
  ): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/wishlists/${wishlistId}/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  async claimWishlistItem(
    wishlistId: string,
    itemId: string
  ): Promise<ApiResponse<WishlistItemDto>> {
    return this.request<WishlistItemDto>(
      `/api/wishlists/${wishlistId}/items/${itemId}/claim`,
      {
        method: 'POST',
      }
    );
  }

  async unclaimWishlistItem(
    wishlistId: string,
    itemId: string
  ): Promise<ApiResponse<WishlistItemDto>> {
    return this.request<WishlistItemDto>(
      `/api/wishlists/${wishlistId}/items/${itemId}/unclaim`,
      {
        method: 'POST',
      }
    );
  }

  // Admin methods
  async getAdminWishlists(): Promise<ApiResponse<WishlistDto[]>> {
    return this.request<WishlistDto[]>('/api/admin/wishlists');
  }

  async inviteAdmin(
    wishlistId: string,
    invitation: InviteAdminRequest
  ): Promise<ApiResponse<AdminInvitationDto>> {
    return this.request<AdminInvitationDto>(
      `/api/admin/wishlists/${wishlistId}/invite`,
      {
        method: 'POST',
        body: JSON.stringify(invitation),
      }
    );
  }

  async getPendingInvitations(): Promise<ApiResponse<AdminInvitationDto[]>> {
    return this.request<AdminInvitationDto[]>('/api/admin/invitations/pending');
  }

  async acceptInvitation(token: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/admin/invitations/${token}/accept`, {
      method: 'POST',
    });
  }

  async getWishlistAdmins(
    wishlistId: string
  ): Promise<ApiResponse<ProfileDto[]>> {
    return this.request<ProfileDto[]>(
      `/api/admin/wishlists/${wishlistId}/admins`
    );
  }

  async removeAdmin(
    wishlistId: string,
    adminId: string
  ): Promise<ApiResponse<void>> {
    return this.request<void>(
      `/api/admin/wishlists/${wishlistId}/admins/${adminId}`,
      {
        method: 'DELETE',
      }
    );
  }

  // Share link methods
  async createShareLink(
    wishlistId: string
  ): Promise<ApiResponse<ShareLinkDto>> {
    return this.request<ShareLinkDto>(`/api/share/${wishlistId}`, {
      method: 'POST',
    });
  }

  async getWishlistByShareToken(
    token: string
  ): Promise<ApiResponse<{ wishlist: WishlistDto; items: WishlistItemDto[] }>> {
    return this.request<{ wishlist: WishlistDto; items: WishlistItemDto[] }>(
      `/api/share/${token}`
    );
  }

  async deleteShareLink(
    wishlistId: string,
    linkId: string
  ): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/share/${wishlistId}/${linkId}`, {
      method: 'DELETE',
    });
  }

  async getShareLinks(
    wishlistId: string
  ): Promise<ApiResponse<ShareLinkDto[]>> {
    return this.request<ShareLinkDto[]>(`/api/share/${wishlistId}/links`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
