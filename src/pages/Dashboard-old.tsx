import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import { apiClient, type WishlistDto, type AdminInvitationDto } from '@/lib/api-client';
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Gift,
  Plus,
  LogOut,
  Link as LinkIcon,
  Trash2,
  Loader2,
  Users,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AppHeader from '@/components/AppHeader';
import PageSubheader from '@/components/PageSubheader';

interface Wishlist {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
}

interface AdminWishlist {
  id: string;
  title: string;
  description: string | null;
  ownerEmail: string;
}

interface PendingInvitation {
  id: string;
  wishlistId: string;
  invitationToken: string;
  createdAt: string;
  invitedBy: string;
  wishlistTitle: string;
  wishlistDescription: string | null;
  inviterEmail: string;
}

const Dashboard = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [adminWishlists, setAdminWishlists] = useState<AdminWishlist[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const loadAllData = useCallback(async () => {
    if (!user) return;

    try {
      // Load owned wishlists
      const ownedResponse = await apiClient.getWishlists();
      if (ownedResponse.data) {
        const formattedWishlists = ownedResponse.data.map(wl => ({
          id: wl.id,
          title: wl.title,
          description: wl.description || null,
          createdAt: wl.createdAt,
        }));
        setWishlists(formattedWishlists);
      } else {
        console.error('Failed to load wishlists:', ownedResponse.error);
        setWishlists([]);
      }

      // Load admin wishlists
      const adminResponse = await apiClient.getAdminWishlists();
      if (adminResponse.data) {
        const formattedAdminWishlists = adminResponse.data.map(wl => ({
          id: wl.id,
          title: wl.title,
          description: wl.description || null,
          ownerEmail: 'Admin Access', // The API should provide owner info
        }));
        setAdminWishlists(formattedAdminWishlists);
      } else {
        console.error('Failed to load admin wishlists:', adminResponse.error);
        setAdminWishlists([]);
      }

      // Load pending invitations
      const invitationsResponse = await apiClient.getPendingInvitations();
      if (invitationsResponse.data) {
        const formattedInvitations = invitationsResponse.data.map(inv => ({
          id: inv.id,
          wishlistId: inv.wishlistId,
          invitationToken: inv.invitationToken,
          createdAt: inv.createdAt,
          invitedBy: inv.invitedBy,
          wishlistTitle: 'Invitation', // We'll need to enhance the API to provide wishlist details
          wishlistDescription: null,
          inviterEmail: 'Unknown', // We'll need to enhance the API to provide inviter details
        }));
        setPendingInvitations(formattedInvitations);
      } else {
        console.error('Failed to load invitations:', invitationsResponse.error);
        setPendingInvitations([]);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error(t('messages.failedToLoadDashboard'));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else {
      loadAllData();
    }
  }, [user, navigate, loadAllData]);

  const handleCreateWishlist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle.trim()) {
      toast.error(t('messages.enterTitle'));
      return;
    }

    setCreating(true);
    try {
      const response = await apiClient.createWishlist({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
      });

      if (response.data) {
        const newWishlist = {
          id: response.data.id,
          title: response.data.title,
          description: response.data.description || null,
          createdAt: response.data.createdAt,
        };
        setWishlists([newWishlist, ...wishlists]);
        setNewTitle('');
        setNewDescription('');
        setCreateDialogOpen(false);
        toast.success(t('messages.wishlistCreated'));
      } else {
        toast.error(response.error || t('messages.failedToCreate'));
      }
    } catch (error) {
      console.error('Create wishlist error:', error);
      toast.error(t('messages.failedToCreate'));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWishlist = async (id: string) => {
    try {
      const response = await apiClient.deleteWishlist(id);

      if (!response.error) {
        setWishlists(wishlists.filter((w) => w.id !== id));
        toast.success(t('messages.wishlistDeleted'));
      } else {
        toast.error(response.error || t('messages.failedToDeleteWishlist'));
      }
    } catch (error) {
      console.error('Delete wishlist error:', error);
      toast.error(t('messages.failedToDeleteWishlist'));
    }
  };

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/wishlist/${id}`;
    navigator.clipboard.writeText(url);
    toast.success(t('messages.linkCopied'));
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/auth');
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const invitation = pendingInvitations.find(inv => inv.id === invitationId);
      if (invitation) {
        const response = await apiClient.acceptInvitation(invitation.invitationToken);
        
        if (!response.error) {
          // Reload data to refresh the lists
          await loadAllData();
          toast.success(t('messages.invitationAccepted'));
        } else {
          toast.error(response.error || t('messages.failedToAcceptInvitation'));
        }
      }
    } catch (error) {
      console.error('Accept invitation error:', error);
      toast.error(t('messages.failedToAcceptInvitation'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Environment Indicator */}
      {import.meta.env.VITE_API_BASE_URL?.includes('localhost') && (
        <div className="bg-orange-500 text-white text-center py-1 text-sm font-medium">
          {t('dashboard.localDevMode')}
        </div>
      )}

      <AppHeader />

      {/* Create Wishlist Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('createWishlistDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('createWishlistDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateWishlist} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder={t('createWishlistDialog.titlePlaceholder')}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="text-base"
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Textarea
                placeholder={t('createWishlistDialog.descriptionPlaceholder')}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="text-base resize-none"
                rows={3}
                disabled={creating}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
              disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('createWishlistDialog.creating')}
                </>
              ) : (
                t('createWishlistDialog.createButton')
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              {t('dashboard.pendingInvitations')}
            </h2>
            <div className="grid gap-4">
              {pendingInvitations.map((invitation) => (
                <Card
                  key={invitation.id}
                  className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      {invitation.wishlistTitle}
                      <Badge
                        variant="outline"
                        className="text-orange-600 border-orange-600">
                        {t('dashboard.adminInvitation')}
                      </Badge>
                    </CardTitle>
                    {invitation.wishlistDescription && (
                      <CardDescription>
                        {invitation.wishlistDescription}
                      </CardDescription>
                    )}
                    <CardDescription className="text-sm">
                      {t('dashboard.invitedBy')}: {invitation.inviterEmail}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleAcceptInvitation(invitation.id)}
                      className="w-full bg-orange-600 hover:bg-orange-700">
                      <Check className="w-4 h-4 mr-2" />
                      {t('dashboard.acceptInvitation')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Create New Wishlist */}
        <div className="mb-8">
          <Button
            size="lg"
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:opacity-90"
            onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-5 h-5 mr-2" />
            {t('dashboard.createNewWishlist')}
          </Button>
        </div>

        {/* My Wishlists */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5" />
            {t('navigation.myWishlists')}
          </h2>
          {wishlists.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">
                  {t('dashboard.noWishlistsYet')}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {t('dashboard.createFirstWishlist')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {wishlists.map((wishlist) => (
                <Card
                  key={wishlist.id}
                  className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl">{wishlist.title}</CardTitle>
                    {wishlist.description && (
                      <CardDescription className="text-base">
                        {wishlist.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() =>
                          navigate(`/wishlist/${wishlist.id}/manage`)
                        }
                        className="w-full">
                        {t('dashboard.manageItems')}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteWishlist(wishlist.id)}
                        className="w-full text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('common.delete')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Admin Wishlists */}
        {adminWishlists.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t('navigation.adminAccess')}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {adminWishlists.map((wishlist) => (
                <Card
                  key={wishlist.id}
                  className="hover:shadow-lg transition-shadow border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center justify-between">
                      {wishlist.title}
                      <Badge variant="secondary">{t('dashboard.admin')}</Badge>
                    </CardTitle>
                    {wishlist.description && (
                      <CardDescription className="text-base">
                        {wishlist.description}
                      </CardDescription>
                    )}
                    <CardDescription className="text-sm">
                      {t('dashboard.owner')}: {wishlist.ownerEmail}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() =>
                          navigate(`/wishlist/${wishlist.id}/admin`)
                        }
                        variant="outline"
                        className="w-full">
                        {t('dashboard.manageAsAdmin')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;