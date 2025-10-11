import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/useAuth';
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
  created_at: string;
}

interface AdminWishlist {
  id: string;
  title: string;
  description: string | null;
  owner_profile: {
    id: string;
    email: string;
  };
}

interface PendingInvitation {
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

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [adminWishlists, setAdminWishlists] = useState<AdminWishlist[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<
    PendingInvitation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const loadAllData = useCallback(
    async (userId: string) => {
      try {
        // Load owned wishlists
        const { data: ownedData, error: ownedError } = await supabase
          .from('wishlists')
          .select('*')
          .eq('creator_id', userId)
          .order('created_at', { ascending: false });

        if (ownedError) throw ownedError;
        setWishlists(ownedData || []);

        // Load admin wishlists - simplified approach without joins
        const { data: adminRelations, error: adminRelError } = await supabase
          .from('wishlist_admins')
          .select('wishlist_id')
          .eq('admin_id', userId);

        if (adminRelError) {
          console.error('Admin relations error:', adminRelError);
          throw adminRelError;
        }

        let adminWishlistsFormatted: AdminWishlist[] = [];

        if (adminRelations && adminRelations.length > 0) {
          const wishlistIds = adminRelations.map((rel) => rel.wishlist_id);

          // Get the wishlists separately
          const { data: adminWishlistData, error: adminWishlistError } =
            await supabase.from('wishlists').select('*').in('id', wishlistIds);

          if (adminWishlistError) {
            console.error('Admin wishlists error:', adminWishlistError);
            throw adminWishlistError;
          }

          // Get owner details for each wishlist
          const wishlistUserIds =
            adminWishlistData?.map((wl) => wl.creator_id) || [];
          const ownerProfiles: Record<string, { id: string; email: string }> =
            {};

          if (wishlistUserIds.length > 0) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id, email')
              .in('id', wishlistUserIds);

            if (!profileError && profileData) {
              profileData.forEach((profile) => {
                ownerProfiles[profile.id] = profile;
              });
            }
          }

          adminWishlistsFormatted =
            adminWishlistData?.map((wishlist) => ({
              id: wishlist.id,
              title: wishlist.title,
              description: wishlist.description,
              owner_profile: ownerProfiles[wishlist.creator_id] || {
                id: wishlist.creator_id,
                email: 'Unknown',
              },
            })) || [];
        }

        setAdminWishlists(adminWishlistsFormatted);

        // Load pending invitations - simplified approach
        const { data: invitationData, error: invitationError } = await supabase
          .from('admin_invitations')
          .select('id, wishlist_id, invitation_token, created_at, invited_by')
          .eq('email', user?.email)
          .eq('accepted', false);

        if (invitationError) throw invitationError;

        let formattedInvitations: PendingInvitation[] = [];

        if (invitationData && invitationData.length > 0) {
          // Get wishlist details separately
          const wishlistIds = invitationData.map((inv) => inv.wishlist_id);
          const { data: invitationWishlists, error: invWishlistError } =
            await supabase
              .from('wishlists')
              .select('id, title, description, creator_id')
              .in('id', wishlistIds);

          if (invWishlistError) throw invWishlistError;

          // Get inviter details for invitations (the people who sent the invitations)
          const inviterIds = invitationData.map((inv) => inv.invited_by);
          const inviterProfiles: Record<string, { id: string; email: string }> =
            {};

          if (inviterIds.length > 0) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id, email')
              .in('id', inviterIds);

            if (!profileError && profileData) {
              profileData.forEach((profile) => {
                inviterProfiles[profile.id] = profile;
              });
            }
          }

          formattedInvitations = invitationData.map((invitation) => {
            const wishlist = invitationWishlists?.find(
              (wl) => wl.id === invitation.wishlist_id
            );
            return {
              id: invitation.id,
              wishlist_id: invitation.wishlist_id,
              token: invitation.invitation_token,
              created_at: invitation.created_at,
              invited_by: invitation.invited_by,
              wishlists: {
                title: wishlist?.title || 'Unknown',
                description: wishlist?.description || null,
                owner_profile: inviterProfiles[invitation.invited_by] || {
                  id: invitation.invited_by,
                  email: 'Unknown',
                },
              },
            };
          });
        }

        setPendingInvitations(formattedInvitations);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error(t('messages.failedToLoadDashboard'));
      } finally {
        setLoading(false);
      }
    },
    [user?.email, t]
  );

  useEffect(() => {
    if (user) {
      loadAllData(user.id);
    }
  }, [user, loadAllData]);

  const handleCreateWishlist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle.trim()) {
      toast.error(t('messages.enterTitle'));
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .insert([
          {
            creator_id: user?.id,
            title: newTitle.trim(),
            description: newDescription.trim() || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setWishlists([data, ...wishlists]);
      setNewTitle('');
      setNewDescription('');
      setCreateDialogOpen(false);
      toast.success(t('messages.wishlistCreated'));
    } catch (error) {
      console.error('Create wishlist error:', error);
      toast.error(t('messages.failedToCreate'));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWishlist = async (id: string) => {
    try {
      const { error } = await supabase.from('wishlists').delete().eq('id', id);

      if (error) throw error;

      setWishlists(wishlists.filter((w) => w.id !== id));
      toast.success(t('messages.wishlistDeleted'));
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
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      // First, create admin relationship while invitation is still pending
      const invitation = pendingInvitations.find(
        (inv) => inv.id === invitationId
      );
      if (invitation && user) {
        const { error: adminError } = await supabase
          .from('wishlist_admins')
          .insert({
            wishlist_id: invitation.wishlist_id,
            admin_id: user.id,
            invited_by: invitation.invited_by,
          });

        if (adminError) throw adminError;

        // Then mark invitation as accepted
        const { error } = await supabase
          .from('admin_invitations')
          .update({ accepted: true })
          .eq('id', invitationId);

        if (error) throw error;

        // Reload data
        await loadAllData(user.id);

        toast.success(t('messages.invitationAccepted'));
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
      {import.meta.env.VITE_SUPABASE_URL?.includes('127.0.0.1') && (
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
                      {invitation.wishlists.title}
                      <Badge
                        variant="outline"
                        className="text-orange-600 border-orange-600">
                        {t('dashboard.adminInvitation')}
                      </Badge>
                    </CardTitle>
                    {invitation.wishlists.description && (
                      <CardDescription>
                        {invitation.wishlists.description}
                      </CardDescription>
                    )}
                    <CardDescription className="text-sm">
                      {t('dashboard.invitedBy')}:{' '}
                      {invitation.wishlists.owner_profile?.email}
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

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('createWishlist.title')}</DialogTitle>
              <DialogDescription>
                {t('createWishlist.description')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateWishlist} className="space-y-4">
              <Input
                placeholder={t('createWishlist.titlePlaceholder')}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="text-base"
                disabled={creating}
              />
              <Textarea
                placeholder={t('createWishlist.descriptionPlaceholder')}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="text-base resize-none"
                rows={3}
                disabled={creating}
              />
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('createWishlist.creating')}
                  </>
                ) : (
                  t('createWishlist.createButton')
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

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
                      {t('dashboard.owner')}: {wishlist.owner_profile?.email}
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
