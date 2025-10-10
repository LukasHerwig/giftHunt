import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
} from 'lucide-react';

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
}

const ManageWishlist = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newPriceRange, setNewPriceRange] = useState('');
  const [newPriority, setNewPriority] = useState(2); // Default to medium priority
  const [inviteEmail, setInviteEmail] = useState('');
  const [adding, setAdding] = useState(false);
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
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadAdminData = useCallback(async () => {
    if (!id) return;

    try {
      // Load current admins
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

      if (adminError) throw adminError;
      setAdmins(adminData || []);

      // Load pending invitations
      const { data: inviteData, error: inviteError } = await supabase
        .from('admin_invitations')
        .select('*')
        .eq('wishlist_id', id)
        .eq('accepted', false)
        .gt('expires_at', new Date().toISOString());

      if (inviteError) throw inviteError;
      setInvitations(inviteData || []);
    } catch (error: unknown) {
      console.error('Failed to load admin data:', error);
    }
  }, [id]);

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

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle.trim()) {
      toast.error('Please enter a title');
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
      setNewPriority(2);
      setDialogOpen(false);
      toast.success('Item added!');
    } catch (error: unknown) {
      toast.error('Failed to add item');
    } finally {
      setAdding(false);
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

      if (inviteError) throw inviteError;

      // Send invitation link
      const inviteLink = `${window.location.origin}/accept-invitation?token=${token}`;

      // For now, copy to clipboard (later we could integrate email service)
      await navigator.clipboard.writeText(inviteLink);

      toast.success('Invitation created! Link copied to clipboard');
      setInviteEmail('');
      setInviteDialogOpen(false);
      loadAdminData(); // Reload admin data to show new invitation
    } catch (error: unknown) {
      toast.error('Failed to create invitation');
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
      toast.success('Item deleted');
    } catch (error: unknown) {
      toast.error('Failed to delete item');
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
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Wishlists
          </Button>
          <h1 className="text-2xl font-bold">Manage Items</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8 flex gap-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Plus className="w-5 h-5 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Wishlist Item</DialogTitle>
                <DialogDescription>
                  Add something you'd like to receive
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Item title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="text-base"
                    disabled={adding}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the item (optional)"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="text-base resize-none"
                    rows={3}
                    disabled={adding}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link">Link</Label>
                  <Input
                    id="link"
                    placeholder="Link to the item (optional)"
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    className="text-base"
                    disabled={adding}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price Range</Label>
                  <Input
                    id="price"
                    placeholder="e.g. $50-100, Under $25 (optional)"
                    value={newPriceRange}
                    onChange={(e) => setNewPriceRange(e.target.value)}
                    className="text-base"
                    disabled={adding}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newPriority.toString()}
                    onValueChange={(value) => setNewPriority(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Low Priority</SelectItem>
                      <SelectItem value="2">Medium Priority</SelectItem>
                      <SelectItem value="3">High Priority</SelectItem>
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
                      Adding...
                    </>
                  ) : (
                    'Add Item'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <UserPlus className="w-5 h-5 mr-2" />
                Invite Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Admin</DialogTitle>
                <DialogDescription>
                  Invite someone to help manage your wishlist and share it with
                  others
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
        </div>

        {/* Admin Status Section */}
        {(admins.length > 0 || invitations.length > 0) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Admin Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {admins.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                    Current Admins
                  </h4>
                  <div className="space-y-2">
                    {admins.map((admin) => (
                      <div
                        key={admin.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <p className="font-medium">
                            {admin.profiles?.email || 'Unknown email'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Admin since{' '}
                            {new Date(admin.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {invitations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                    Pending Invitations
                  </h4>
                  <div className="space-y-2">
                    {invitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                        <div>
                          <p className="font-medium">{invitation.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Invited{' '}
                            {new Date(
                              invitation.created_at
                            ).toLocaleDateString()}{' '}
                            • Expires{' '}
                            {new Date(
                              invitation.expires_at
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                          Pending
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {items.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">
                No items yet. Add your first wish!
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
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            item.priority === 3
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                              : item.priority === 2
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400'
                          }`}>
                          {item.priority === 3
                            ? 'High Priority'
                            : item.priority === 2
                            ? 'Medium Priority'
                            : 'Low Priority'}
                        </span>
                      </div>

                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1 break-all">
                          View link
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      )}
                    </div>
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
                          <AlertDialogTitle>Delete Item</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{item.title}"? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteItem(item.id)}
                            className="bg-destructive hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
