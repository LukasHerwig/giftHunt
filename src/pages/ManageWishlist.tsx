import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  UserPlus,
  Star,
  DollarSign,
  Edit,
} from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import PageSubheader from '@/components/PageSubheader';

interface WishlistItem {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  price_range: string | null;
  priority: number;
  created_at: string;
}

interface WishlistAdmin {
  id: string;
  admin_id: string;
  created_at: string;
  profiles: {
    email: string | null;
  } | null;
}

interface WishlistInvitation {
  id: string;
  email: string;
  invitation_token: string;
  created_at: string;
  expires_at: string;
  accepted: boolean;
  wishlist_id: string;
  invited_by: string;
}

const ManageWishlist = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newPriceRange, setNewPriceRange] = useState('');
  const [newPriority, setNewPriority] = useState<number | null>(null); // Default to null (no priority)
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editPriceRange, setEditPriceRange] = useState('');
  const [editPriority, setEditPriority] = useState<number | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [admins, setAdmins] = useState<WishlistAdmin[]>([]);
  const [invitations, setInvitations] = useState<WishlistInvitation[]>([]);

  const loadItems = useCallback(async () => {
    try {
      // Load all items for the owner (but don't show taken status to maintain surprise)
      const { data, error } = await supabase
        .from('wishlist_items')
        .select(
          'id, title, description, link, price_range, priority, created_at'
        )
        .eq('wishlist_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: unknown) {
      toast.error(t('messages.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  const loadAdminData = useCallback(async () => {
    if (!id) return;

    try {
      // Load current admins
      console.log('Querying wishlist_admins for wishlist_id:', id);
      const { data: adminData, error: adminError } = await supabase
        .from('wishlist_admins')
        .select(
          `
          id,
          admin_id,
          created_at,
          profiles!admin_id (
            email
          )
        `
        )
        .eq('wishlist_id', id);

      console.log('Admin query result:', { adminData, adminError });
      if (adminError) throw adminError;
      setAdmins(adminData || []);

      // Load pending invitations AND accepted ones (for showing completion status)
      console.log('Querying admin_invitations for wishlist_id:', id);
      const { data: inviteData, error: inviteError } = await supabase
        .from('admin_invitations')
        .select('*')
        .eq('wishlist_id', id)
        .gt('expires_at', new Date().toISOString());

      console.log('Invitation query result:', { inviteData, inviteError });
      if (inviteError) throw inviteError;
      setInvitations(inviteData || []);
    } catch (error: unknown) {
      console.error('Failed to load admin data:', error);
    }
  }, [id]);

  const formatUrl = (url: string): string => {
    if (!url) return url;
    // If the URL doesn't start with http:// or https://, add https://
    if (!url.match(/^https?:\/\//)) {
      return `https://${url}`;
    }
    return url;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        loadItems();
        loadAdminData();
      }
    });
  }, [navigate, loadItems, loadAdminData]);

  // Refresh admin data every 30 seconds to catch accepted invitations
  useEffect(() => {
    const interval = setInterval(() => {
      loadAdminData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [loadAdminData]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle.trim()) {
      toast.error(t('messages.enterTitle'));
      return;
    }

    setAdding(true);
    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .insert([
          {
            wishlist_id: id,
            title: newTitle.trim(),
            description: newDescription.trim() || null,
            link: newLink.trim() || null,
            price_range: newPriceRange.trim() || null,
            priority: newPriority,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setItems([data, ...items]);
      setNewTitle('');
      setNewDescription('');
      setNewLink('');
      setNewPriceRange('');
      setNewPriority(null);
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
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setEditLink(item.link || '');
    setEditPriceRange(item.price_range || '');
    setEditPriority(item.priority || null);
    setEditDialogOpen(true);
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editTitle.trim()) {
      toast.error(t('messages.enterTitle'));
      return;
    }

    setUpdating(true);
    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .update({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          link: editLink.trim() || null,
          price_range: editPriceRange.trim() || null,
          priority: editPriority,
        })
        .eq('id', editingItem.id)
        .select()
        .single();

      if (error) throw error;

      setItems(items.map((item) => (item.id === editingItem.id ? data : item)));
      setEditDialogOpen(false);
      setEditingItem(null);
      setEditTitle('');
      setEditDescription('');
      setEditLink('');
      setEditPriceRange('');
      setEditPriority(null);
      toast.success(t('messages.itemUpdated'));
    } catch (error: unknown) {
      toast.error(t('messages.failedToUpdate'));
    } finally {
      setUpdating(false);
    }
  };

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !id) return;

    setInviting(true);
    try {
      // Create invitation
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { error: inviteError } = await supabase
        .from('admin_invitations')
        .insert({
          wishlist_id: id,
          email: inviteEmail.trim(),
          invitation_token: token,
          expires_at: expiresAt.toISOString(),
          invited_by: user.id,
        });

      if (inviteError) {
        // Handle the case where an invitation already exists
        if (inviteError.code === '23505') {
          // Unique constraint violation
          throw new Error('An invitation for this wishlist is already pending');
        }
        throw inviteError;
      }

      // Send invitation link
      const inviteLink = `${window.location.origin}/accept-invitation?token=${token}`;

      // For now, copy to clipboard (later we could integrate email service)
      await navigator.clipboard.writeText(inviteLink);

      toast.success(t('messages.invitationCreated'));
      setInviteEmail('');
      setInviteDialogOpen(false);
      loadAdminData(); // Reload admin data to show new invitation
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create invitation';
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.filter((item) => item.id !== itemId));
      toast.success(t('messages.itemDeleted'));
    } catch (error: unknown) {
      toast.error(t('messages.failedToDelete'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">{t('manageWishlist.loading')}</span>
      </div>
    );
  }

  // Check if we can show the invite admin button
  // Only show when there's no current admin AND no pending invitations
  const canInviteAdmin =
    admins.length === 0 &&
    invitations.filter((inv) => !inv.accepted).length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <AppHeader />
      <PageSubheader
        actions={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('manageWishlist.backToWishlists')}
            </Button>
          </div>
        }
      />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8 flex gap-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Plus className="w-5 h-5 mr-2" />
                {t('manageWishlist.addItem')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('addItemDialog.title')}</DialogTitle>
                <DialogDescription>
                  {t('addItemDialog.description')}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    {t('addItemDialog.titleLabel')} *
                  </Label>
                  <Input
                    id="title"
                    placeholder={t('addItemDialog.titlePlaceholder')}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="text-base"
                    disabled={adding}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    {t('addItemDialog.descriptionLabel')}
                  </Label>
                  <Textarea
                    id="description"
                    placeholder={t('addItemDialog.descriptionPlaceholder')}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="text-base resize-none"
                    rows={3}
                    disabled={adding}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link">{t('addItemDialog.linkLabel')}</Label>
                  <Input
                    id="link"
                    placeholder={t('addItemDialog.linkPlaceholder')}
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    className="text-base"
                    disabled={adding}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">{t('addItemDialog.priceLabel')}</Label>
                  <Input
                    id="price"
                    placeholder={t('addItemDialog.pricePlaceholder')}
                    value={newPriceRange}
                    onChange={(e) => setNewPriceRange(e.target.value)}
                    className="text-base"
                    disabled={adding}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">
                    {t('addItemDialog.priorityLabel')}
                  </Label>
                  <Select
                    value={newPriority?.toString() || 'none'}
                    onValueChange={(value) =>
                      setNewPriority(value === 'none' ? null : parseInt(value))
                    }>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('addItemDialog.priorityPlaceholder')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('priority.none')}</SelectItem>
                      <SelectItem value="1">{t('priority.low')}</SelectItem>
                      <SelectItem value="2">{t('priority.medium')}</SelectItem>
                      <SelectItem value="3">{t('priority.high')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  disabled={adding}>
                  {adding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('addItemDialog.adding')}
                    </>
                  ) : (
                    t('addItemDialog.addButton')
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('editItemDialog.title')}</DialogTitle>
                <DialogDescription>
                  {t('editItemDialog.description')}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateItem} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title *</Label>
                  <Input
                    id="edit-title"
                    placeholder="Item title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-base"
                    disabled={updating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">
                    {t('common.description')}
                  </Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Describe the item (optional)"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="text-base resize-none"
                    rows={3}
                    disabled={updating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-link">{t('common.link')}</Label>
                  <Input
                    id="edit-link"
                    placeholder="Link to the item (optional)"
                    value={editLink}
                    onChange={(e) => setEditLink(e.target.value)}
                    className="text-base"
                    disabled={updating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-price">{t('common.priceRange')}</Label>
                  <Input
                    id="edit-price"
                    placeholder="e.g. $50-100, Under $25 (optional)"
                    value={editPriceRange}
                    onChange={(e) => setEditPriceRange(e.target.value)}
                    className="text-base"
                    disabled={updating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-priority">{t('common.priority')}</Label>
                  <Select
                    value={editPriority?.toString() || 'none'}
                    onValueChange={(value) =>
                      setEditPriority(value === 'none' ? null : parseInt(value))
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('priority.none')}</SelectItem>
                      <SelectItem value="1">{t('priority.low')}</SelectItem>
                      <SelectItem value="2">{t('priority.medium')}</SelectItem>
                      <SelectItem value="3">{t('priority.high')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  disabled={updating}>
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Item'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {canInviteAdmin && (
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto">
                  <UserPlus className="w-5 h-5 mr-2" />
                  {t('manageWishlist.inviteAdmin')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('inviteDialog.title')}</DialogTitle>
                  <DialogDescription>
                    {t('inviteDialog.description')}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInviteAdmin} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="text-base"
                    disabled={inviting}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    disabled={inviting}>
                    {inviting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Invitation'
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Admin Status Section - Shows current admin and invitation status
            Each wishlist can only have one admin (enforced by database constraint) */}
        {(admins.length > 0 || invitations.length > 0) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">
                {t('manageWishlist.adminStatus')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {invitations.length > 0 && (
                <div>
                  {invitations.filter((inv) => !inv.accepted).length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                        {t('manageWishlist.pendingInvitations')}
                      </h4>
                      <div className="space-y-2">
                        {invitations
                          .filter((inv) => !inv.accepted)
                          .map((invitation) => (
                            <div
                              key={invitation.id}
                              className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                              <div>
                                <p className="font-medium">
                                  {invitation.email}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {t('inviteDialog.invited')}{' '}
                                  {new Date(
                                    invitation.created_at
                                  ).toLocaleDateString()}{' '}
                                  • {t('inviteDialog.expires')}{' '}
                                  {new Date(
                                    invitation.expires_at
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                                {t('manageWishlist.pending')}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {invitations.filter((inv) => inv.accepted).length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                        {t('manageWishlist.acceptedInvitations')}
                      </h4>
                      <div className="space-y-2">
                        {invitations
                          .filter((inv) => inv.accepted)
                          .map((invitation) => (
                            <div
                              key={invitation.id}
                              className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                              <div>
                                <p className="font-medium">
                                  {invitation.email}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {t('inviteDialog.invited')}{' '}
                                  {new Date(
                                    invitation.created_at
                                  ).toLocaleDateString()}{' '}
                                  • {t('manageWishlist.accepted')} ✓
                                </p>
                              </div>
                              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                                {t('manageWishlist.accepted')}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {items.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {t('manageWishlist.noItemsYet')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg break-words">
                          {item.title}
                        </CardTitle>
                        {item.priority === 3 && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </div>

                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-2 break-words">
                          {item.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 mb-2">
                        {item.price_range && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full">
                            <DollarSign className="w-3 h-3" />
                            {item.price_range}
                          </span>
                        )}
                        {item.priority && item.priority > 0 && (
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              item.priority === 3
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                                : item.priority === 2
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400'
                            }`}>
                            {item.priority === 3
                              ? t('priority.high')
                              : item.priority === 2
                              ? t('priority.medium')
                              : t('priority.low')}
                          </span>
                        )}
                      </div>

                      {item.link && (
                        <a
                          href={formatUrl(item.link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1 break-all">
                          {t('manageWishlist.viewLink')}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                        className="text-muted-foreground hover:text-foreground flex-shrink-0">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive flex-shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t('deleteDialog.title')}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('deleteDialog.description', {
                                title: item.title,
                              })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {t('deleteDialog.cancel')}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteItem(item.id)}
                              className="bg-destructive hover:bg-destructive/90">
                              {t('deleteDialog.delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageWishlist;
