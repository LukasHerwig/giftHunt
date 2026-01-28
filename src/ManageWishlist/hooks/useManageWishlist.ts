import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ManageWishlistService } from '../services/ManageWishlistService';
import { fetchLinkMetadata } from '@/lib/metadataUtils';
import {
  WishlistItem,
  Wishlist,
  WishlistAdmin,
  WishlistInvitation,
  ShareLink,
  ItemFormData,
  SettingsFormData,
} from '../types';

export const useManageWishlist = (wishlistId: string | undefined) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // State
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<WishlistAdmin[]>([]);
  const [invitations, setInvitations] = useState<WishlistInvitation[]>([]);
  const [hasActiveShareLink, setHasActiveShareLink] = useState(false);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDescriptionDialogOpen, setEditDescriptionDialogOpen] =
    useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form states
  const [newItem, setNewItem] = useState<ItemFormData>({
    title: '',
    description: '',
    link: '',
    url: '',
    priceRange: '',
    priority: null,
    isGiftcard: false,
  });

  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [editItem, setEditItem] = useState<ItemFormData>({
    title: '',
    description: '',
    link: '',
    url: '',
    priceRange: '',
    priority: null,
    isGiftcard: false,
  });

  // Fetch metadata when link changes for new item
  useEffect(() => {
    if (!newItem.link || !newItem.link.trim()) {
      if (newItem.url) setNewItem((prev) => ({ ...prev, url: '' }));
      return;
    }

    const timer = setTimeout(async () => {
      console.log('Fetching metadata for:', newItem.link);
      // Only fetch if we don't have a URL yet or if the link changed significantly
      const metadata = await fetchLinkMetadata(newItem.link);
      console.log('Metadata result:', metadata);
      if (metadata?.image) {
        setNewItem((prev) => ({ ...prev, url: metadata.image }));
        // If title is empty, maybe fill it too?
        if (!newItem.title && metadata.title) {
          setNewItem((prev) => ({ ...prev, title: metadata.title }));
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [newItem.link]);

  // Fetch metadata when link changes for editing item
  useEffect(() => {
    if (!editItem.link || !editItem.link.trim()) {
      return;
    }

    const timer = setTimeout(async () => {
      const metadata = await fetchLinkMetadata(editItem.link);
      if (metadata?.image) {
        setEditItem((prev) => ({ ...prev, url: metadata.image }));
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [editItem.link]);

  const [editingDescriptionItem, setEditingDescriptionItem] =
    useState<WishlistItem | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editLinkLimited, setEditLinkLimited] = useState('');
  const [editUrlLimited, setEditUrlLimited] = useState('');
  const [editPriceRangeLimited, setEditPriceRangeLimited] = useState('');
  const [editPriorityLimited, setEditPriorityLimited] = useState<number | null>(
    null,
  );

  // Fetch metadata when link changes for limited editing item
  useEffect(() => {
    if (!editLinkLimited || !editLinkLimited.trim()) {
      return;
    }

    const timer = setTimeout(async () => {
      const metadata = await fetchLinkMetadata(editLinkLimited);
      if (metadata?.image) {
        setEditUrlLimited(metadata.image);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [editLinkLimited]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [settings, setSettings] = useState<SettingsFormData>({
    enableLinks: true,
    enablePrice: false,
    enablePriority: false,
  });

  // Loading states
  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState(false);

  // Load data functions
  const loadWishlistData = useCallback(async () => {
    if (!wishlistId) return;

    try {
      const data = await ManageWishlistService.loadWishlistData(wishlistId);

      setWishlist(data.wishlist);
      setItems(data.items);
      setShareLinks(data.shareLinks);
      setHasActiveShareLink(data.hasActiveShareLink);

      // Set settings form state
      setSettings({
        enableLinks: data.wishlist?.enable_links ?? true,
        enablePrice: data.wishlist?.enable_price ?? false,
        enablePriority: data.wishlist?.enable_priority ?? false,
      });
    } catch (error: unknown) {
      toast.error(t('messages.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [wishlistId, t]);

  const loadAdminData = useCallback(async () => {
    if (!wishlistId) return;

    try {
      const data = await ManageWishlistService.loadAdminData(wishlistId);
      setAdmins(data.admins);
      setInvitations(data.invitations);
    } catch (error: unknown) {
      console.error('Failed to load admin data:', error);
    }
  }, [wishlistId]);

  // Item management functions
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishlistId || !newItem.title.trim()) {
      toast.error(t('messages.enterTitle'));
      return;
    }

    setAdding(true);
    try {
      const data = await ManageWishlistService.addItem(wishlistId, {
        title: newItem.title.trim(),
        description: newItem.description.trim() || null,
        link: newItem.link.trim() || null,
        url: newItem.url || null,
        price_range: newItem.priceRange.trim() || null,
        priority: newItem.priority,
        is_giftcard: newItem.isGiftcard,
      });

      setItems([data, ...items]);
      setNewItem({
        title: '',
        description: '',
        link: '',
        url: '',
        priceRange: '',
        priority: null,
        isGiftcard: false,
      });
      setDialogOpen(false);
      toast.success(t('messages.itemAdded'));
    } catch (error: unknown) {
      toast.error(t('messages.failedToAdd'));
    } finally {
      setAdding(false);
    }
  };

  const handleEditItem = (item: WishlistItem) => {
    setEditingItem(item);
    setEditItem({
      title: item.title,
      description: item.description || '',
      link: item.link || '',
      url: item.url || '',
      priceRange: item.price_range || '',
      priority: item.priority || null,
      isGiftcard: item.is_giftcard || false,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editItem.title.trim()) {
      toast.error(t('messages.enterTitle'));
      return;
    }

    setUpdating(true);
    try {
      const data = await ManageWishlistService.updateItem(editingItem.id, {
        title: editItem.title.trim(),
        description: editItem.description.trim() || null,
        link: editItem.link.trim() || null,
        url: editItem.url || null,
        price_range: editItem.priceRange.trim() || null,
        priority: editItem.priority,
        is_giftcard: editItem.isGiftcard,
      });

      setItems(items.map((item) => (item.id === editingItem.id ? data : item)));
      setEditDialogOpen(false);
      setEditingItem(null);
      setEditItem({
        title: '',
        description: '',
        link: '',
        url: '',
        priceRange: '',
        priority: null,
        isGiftcard: false,
      });
      toast.success(t('messages.itemUpdated'));
    } catch (error: unknown) {
      toast.error(t('messages.failedToUpdate'));
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await ManageWishlistService.deleteItem(itemId);
      setItems(items.filter((item) => item.id !== itemId));
      toast.success(t('messages.itemDeleted'));
    } catch (error: unknown) {
      toast.error(t('messages.failedToDelete'));
    }
  };

  const handleEditDescriptionOnly = (item: WishlistItem) => {
    setEditingDescriptionItem(item);
    setEditDescription(item.description || '');
    setEditLinkLimited(item.link || ''); // Initialize with current link or empty
    setEditUrlLimited(item.url || ''); // Initialize with current url or empty
    setEditPriceRangeLimited(item.price_range || ''); // Initialize with current price range or empty
    setEditPriorityLimited(item.priority || null); // Initialize with current priority or null
    setEditDescriptionDialogOpen(true);
  };

  const handleUpdateDescriptionOnly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDescriptionItem) {
      return;
    }

    setUpdating(true);
    try {
      const data = await ManageWishlistService.updateItem(
        editingDescriptionItem.id,
        {
          title: editingDescriptionItem.title,
          description: editDescription.trim() || null,
          link: editLinkLimited.trim() || null, // Use the link from the form, allowing updates only if originally empty
          url: editUrlLimited.trim() || null, // Use the url from the form
          price_range: editPriceRangeLimited.trim() || null, // Use the price range from the form, allowing updates only if originally empty
          priority: editPriorityLimited, // Use the priority from the form, allowing updates only if originally empty
        },
      );

      setItems(
        items.map((item) =>
          item.id === editingDescriptionItem.id ? data : item,
        ),
      );
      setEditDescriptionDialogOpen(false);
      setEditingDescriptionItem(null);
      setEditDescription('');
      setEditLinkLimited('');
      setEditUrlLimited('');
      setEditPriceRangeLimited('');
      setEditPriorityLimited(null);
      toast.success(t('messages.itemUpdated'));
    } catch (error: unknown) {
      toast.error(t('messages.failedToUpdate'));
    } finally {
      setUpdating(false);
    }
  };

  // Admin management functions
  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !wishlistId) return;

    setInviting(true);
    try {
      await ManageWishlistService.createAdminInvitation(
        wishlistId,
        inviteEmail,
      );

      toast.success(t('messages.invitationCreated'));
      setInviteEmail('');
      setInviteDialogOpen(false);
      loadAdminData();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create invitation';
      toast.error(errorMessage);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveInvitation = async (invitationId: string) => {
    try {
      await ManageWishlistService.removeInvitation(invitationId);
      setInvitations(invitations.filter((inv) => inv.id !== invitationId));
      toast.success(t('messages.invitationRemoved'));
    } catch (error: unknown) {
      toast.error(t('messages.failedToRemoveInvitation'));
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!wishlistId) return;

    try {
      const result = await ManageWishlistService.removeAdmin(
        adminId,
        wishlistId,
      );

      setAdmins(admins.filter((admin) => admin.id !== adminId));
      setHasActiveShareLink(false);

      if (result.hadShareLinks) {
        toast.success(t('messages.adminRemovedAndShareLinksDeleted'));
      } else {
        toast.success(t('messages.adminRemoved'));
      }
    } catch (error: unknown) {
      toast.error(t('messages.failedToRemoveAdmin'));
    }
  };

  // Settings management
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishlistId || !wishlist?.title.trim()) {
      toast.error(t('messages.enterTitle'));
      return;
    }

    setUpdatingSettings(true);
    try {
      const data = await ManageWishlistService.updateWishlistSettings(
        wishlistId,
        {
          title: wishlist.title.trim(),
          description: wishlist.description?.trim() || null,
          enable_links: settings.enableLinks,
          enable_price: settings.enablePrice,
          enable_priority: settings.enablePriority,
        },
      );

      setWishlist(data);
      setSettingsDialogOpen(false);
      toast.success(t('messages.settingsUpdated'));
    } catch (error: unknown) {
      toast.error(t('messages.failedToUpdateSettings'));
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleDeleteWishlist = async () => {
    if (!wishlistId) return;

    try {
      await ManageWishlistService.deleteWishlist(wishlistId);
      toast.success(t('messages.wishlistDeleted'));
      navigate('/');
    } catch (error: unknown) {
      toast.error(t('messages.failedToDeleteWishlist'));
    }
  };

  // Utility functions
  const formatUrl = (url: string): string => {
    if (!url) return url;
    if (!url.match(/^https?:\/\//)) {
      return `https://${url}`;
    }
    return url;
  };

  // Computed values
  const canInviteAdmin =
    admins.length === 0 &&
    invitations.filter((inv) => !inv.accepted).length === 0;

  // Effects
  useEffect(() => {
    ManageWishlistService.checkAuth().then((session) => {
      if (!session) {
        navigate('/auth');
      } else {
        loadWishlistData();
        loadAdminData();
      }
    });
  }, [navigate, loadWishlistData, loadAdminData]);

  // Refresh admin data every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadAdminData, 30000);
    return () => clearInterval(interval);
  }, [loadAdminData]);

  return {
    // State
    items,
    wishlist,
    setWishlist,
    loading,
    admins,
    invitations,
    hasActiveShareLink,
    shareLinks,

    // Dialog states
    dialogOpen,
    setDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    editDescriptionDialogOpen,
    setEditDescriptionDialogOpen,
    inviteDialogOpen,
    setInviteDialogOpen,
    settingsDialogOpen,
    setSettingsDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,

    // Form states
    newItem,
    setNewItem,
    editingItem,
    editItem,
    setEditItem,
    editingDescriptionItem,
    editDescription,
    setEditDescription,
    editLinkLimited,
    setEditLinkLimited,
    editUrlLimited,
    setEditUrlLimited,
    editPriceRangeLimited,
    setEditPriceRangeLimited,
    editPriorityLimited,
    setEditPriorityLimited,
    inviteEmail,
    setInviteEmail,
    settings,
    setSettings,

    // Loading states
    adding,
    updating,
    inviting,
    updatingSettings,

    // Actions
    handleAddItem,
    handleEditItem,
    handleUpdateItem,
    handleEditDescriptionOnly,
    handleUpdateDescriptionOnly,
    handleDeleteItem,
    handleInviteAdmin,
    handleRemoveInvitation,
    handleRemoveAdmin,
    handleUpdateSettings,
    handleDeleteWishlist,

    // Utilities
    formatUrl,
    canInviteAdmin,
  };
};
