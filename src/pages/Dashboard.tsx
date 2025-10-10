import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import type { User } from '@supabase/supabase-js';

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
  const [user, setUser] = useState<User | null>(null);
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
  const navigate = useNavigate();

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
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    },
    [user?.email]
  );

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
        await loadAllData(session.user.id);
      }
    };

    // Get initial session
    checkUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, loadAllData]);

  const handleCreateWishlist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle.trim()) {
      toast.error('Please enter a title');
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
      toast.success('Wishlist created!');
    } catch (error) {
      console.error('Create wishlist error:', error);
      toast.error('Failed to create wishlist');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWishlist = async (id: string) => {
    try {
      const { error } = await supabase.from('wishlists').delete().eq('id', id);

      if (error) throw error;

      setWishlists(wishlists.filter((w) => w.id !== id));
      toast.success('Wishlist deleted');
    } catch (error) {
      console.error('Delete wishlist error:', error);
      toast.error('Failed to delete wishlist');
    }
  };

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/wishlist/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
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

        toast.success(
          'Invitation accepted! You are now an admin for this wishlist.'
        );
      }
    } catch (error) {
      console.error('Accept invitation error:', error);
      toast.error('Failed to accept invitation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Pending Invitations
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
                        Admin Invitation
                      </Badge>
                    </CardTitle>
                    {invitation.wishlists.description && (
                      <CardDescription>
                        {invitation.wishlists.description}
                      </CardDescription>
                    )}
                    <CardDescription className="text-sm">
                      Invited by: {invitation.wishlists.owner_profile?.email}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleAcceptInvitation(invitation.id)}
                      className="w-full bg-orange-600 hover:bg-orange-700">
                      <Check className="w-4 h-4 mr-2" />
                      Accept Invitation
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Create New Wishlist */}
        <div className="mb-8">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Plus className="w-5 h-5 mr-2" />
                Create New Wishlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Wishlist</DialogTitle>
                <DialogDescription>
                  Give your wishlist a name and description
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateWishlist} className="space-y-4">
                <Input
                  placeholder="Wishlist title (e.g., Birthday 2025)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="text-base"
                  disabled={creating}
                />
                <Textarea
                  placeholder="Description (optional)"
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
                      Creating...
                    </>
                  ) : (
                    'Create Wishlist'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* My Wishlists */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5" />
            My Wishlists
          </h2>
          {wishlists.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No wishlists yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first wishlist to get started
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
                        Manage Items
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteWishlist(wishlist.id)}
                        className="w-full text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
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
              Admin Access
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {adminWishlists.map((wishlist) => (
                <Card
                  key={wishlist.id}
                  className="hover:shadow-lg transition-shadow border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center justify-between">
                      {wishlist.title}
                      <Badge variant="secondary">Admin</Badge>
                    </CardTitle>
                    {wishlist.description && (
                      <CardDescription className="text-base">
                        {wishlist.description}
                      </CardDescription>
                    )}
                    <CardDescription className="text-sm">
                      Owner: {wishlist.owner_profile?.email}
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
                        Manage as Admin
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
