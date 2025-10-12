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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Gift,
  Plus,
  LogOut,
  Link as LinkIcon,
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
  item_count?: number;
}

interface AdminWishlist {
  id: string;
  title: string;
  description: string | null;
  item_count?: number;
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
  const [enableLinks, setEnableLinks] = useState(true);
  const [enablePrice, setEnablePrice] = useState(false);
  const [enablePriority, setEnablePriority] = useState(false);
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

        // Load item counts for owned wishlists
        const ownedWishlistsWithCounts = await Promise.all(
          (ownedData || []).map(async (wishlist) => {
            const { count, error: countError } = await supabase
              .from('wishlist_items')
              .select('*', { count: 'exact', head: true })
              .eq('wishlist_id', wishlist.id);

            if (countError) {
              console.error('Error counting items:', countError);
              return { ...wishlist, item_count: 0 };
            }

            return { ...wishlist, item_count: count || 0 };
          })
        );

        setWishlists(ownedWishlistsWithCounts);

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

          // Get admin wishlists with item counts
          const adminWishlistsWithCounts = await Promise.all(
            (adminWishlistData || []).map(async (wishlist) => {
              const { count, error: countError } = await supabase
                .from('wishlist_items')
                .select('*', { count: 'exact', head: true })
                .eq('wishlist_id', wishlist.id);

              if (countError) {
                console.error('Error counting items:', countError);
              }

              return {
                id: wishlist.id,
                title: wishlist.title,
                description: wishlist.description,
                item_count: count || 0,
                owner_profile: ownerProfiles[wishlist.creator_id] || {
                  id: wishlist.creator_id,
                  email: 'Unknown',
                },
              };
            })
          );

          adminWishlistsFormatted = adminWishlistsWithCounts;
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
            enable_links: enableLinks,
            enable_price: enablePrice,
            enable_priority: enablePriority,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setWishlists([data, ...wishlists]);
      setNewTitle('');
      setNewDescription('');
      setEnableLinks(true);
      setEnablePrice(false);
      setEnablePriority(false);
      setCreateDialogOpen(false);
      toast.success(t('messages.wishlistCreated'));
    } catch (error) {
      console.error('Create wishlist error:', error);
      toast.error(t('messages.failedToCreate'));
    } finally {
      setCreating(false);
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

            {/* Configuration Options */}
            <div className="space-y-4 pt-2 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">
                {t('createWishlistDialog.itemFeatures')}
              </h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-links" className="text-sm">
                    {t('createWishlistDialog.enableLinks')}
                  </Label>
                  <Switch
                    id="enable-links"
                    checked={enableLinks}
                    onCheckedChange={setEnableLinks}
                    disabled={creating}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-price" className="text-sm">
                    {t('createWishlistDialog.enablePrice')}
                  </Label>
                  <Switch
                    id="enable-price"
                    checked={enablePrice}
                    onCheckedChange={setEnablePrice}
                    disabled={creating}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-priority" className="text-sm">
                    {t('createWishlistDialog.enablePriority')}
                  </Label>
                  <Switch
                    id="enable-priority"
                    checked={enablePriority}
                    onCheckedChange={setEnablePriority}
                    disabled={creating}
                  />
                </div>
              </div>
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
              <AlertCircle className="w-5 h-5 text-primary" />
              {t('dashboard.pendingInvitations')}
            </h2>
            <div className="grid gap-4">
              {pendingInvitations.map((invitation) => (
                <Card
                  key={invitation.id}
                  className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      {invitation.wishlists.title}
                      <Badge
                        variant="outline"
                        className="text-primary border-primary">
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
                      className="w-full bg-primary hover:bg-primary/90">
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
                  className="hover:shadow-lg transition-all duration-200 cursor-pointer border-primary/10 hover:border-primary/30"
                  onClick={() => navigate(`/wishlist/${wishlist.id}/manage`)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1 flex items-center gap-2">
                          <Gift className="w-5 h-5 text-primary" />
                          {wishlist.title}
                        </CardTitle>
                        {wishlist.description && (
                          <CardDescription className="text-base line-clamp-2">
                            {wishlist.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {t('dashboard.itemCount', {
                          count: wishlist.item_count || 0,
                        })}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Plus className="w-4 h-4" />
                        {t('dashboard.createdOn', {
                          date: new Date(
                            wishlist.created_at
                          ).toLocaleDateString(),
                        })}
                      </span>
                      <span className="text-primary font-medium hover:underline">
                        {t('dashboard.manageAction')}
                      </span>
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
                  className="hover:shadow-lg transition-all duration-200 cursor-pointer border-blue-200 hover:border-blue-300"
                  onClick={() => navigate(`/wishlist/${wishlist.id}/admin`)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1 flex items-center gap-2">
                          <Users className="w-5 h-5 text-blue-500" />
                          {wishlist.title}
                        </CardTitle>
                        {wishlist.description && (
                          <CardDescription className="text-base line-clamp-2">
                            {wishlist.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex flex-row items-end gap-1 shrink-0">
                        <Badge variant="secondary">
                          {t('dashboard.admin')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {t('dashboard.itemCount', {
                            count: wishlist.item_count || 0,
                          })}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1 truncate">
                        <span>
                          {t('dashboard.owner')}:{' '}
                          {wishlist.owner_profile?.email}
                        </span>
                      </span>
                      <span className="text-blue-600 font-medium hover:underline">
                        {t('dashboard.manageAction')}
                      </span>
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
