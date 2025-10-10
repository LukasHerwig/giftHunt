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
import { toast } from 'sonner';
import {
  ArrowLeft,
  Link as LinkIcon,
  Check,
  Loader2,
  Copy,
  Star,
  DollarSign,
  Share,
} from 'lucide-react';

interface WishlistItem {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  price_range: string | null;
  priority: number;
  is_taken: boolean;
  taken_by_name: string | null;
  taken_at: string | null;
  created_at: string;
}

interface Wishlist {
  id: string;
  title: string;
  description: string | null;
}

const AdminWishlist = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);

  const checkAdminAccess = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('wishlist_admins')
        .select('id')
        .eq('wishlist_id', id)
        .eq('admin_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setIsAdmin(true);
      } else {
        toast.error('You do not have admin access to this wishlist');
        navigate('/');
      }
    } catch (error) {
      console.error('Admin access check error:', error);
      toast.error('Failed to verify admin access');
      navigate('/');
    }
  }, [id, navigate]);

  const loadWishlist = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select('id, title, description')
        .eq('id', id)
        .single();

      if (error) throw error;
      setWishlist(data);
    } catch (error) {
      console.error('Load wishlist error:', error);
      toast.error('Failed to load wishlist');
    }
  }, [id]);

  const loadItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('wishlist_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Load items error:', error);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadShareLink = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('share_links')
        .select('share_token')
        .eq('wishlist_id', id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setShareLink(`${window.location.origin}/shared/${data.share_token}`);
      }
    } catch (error) {
      console.error('Load share link error:', error);
    }
  }, [id]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        checkAdminAccess();
        loadWishlist();
        loadItems();
        loadShareLink();
      }
    });
  }, [navigate, checkAdminAccess, loadWishlist, loadItems, loadShareLink]);

  const generateShareLink = async () => {
    if (!id) return;

    setGeneratingLink(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if there's already an active share link
      const { data: existingLink } = await supabase
        .from('share_links')
        .select('share_token')
        .eq('wishlist_id', id)
        .eq('is_active', true)
        .single();

      if (existingLink) {
        const url = `${window.location.origin}/shared/${existingLink.share_token}`;
        setShareLink(url);
        return url;
      }

      // Generate new share link
      const { data, error } = await supabase
        .from('share_links')
        .insert({
          wishlist_id: id,
          created_by: user.id,
        })
        .select('share_token')
        .single();

      if (error) throw error;

      const url = `${window.location.origin}/shared/${data.share_token}`;
      setShareLink(url);
      return url;
    } catch (error) {
      console.error('Generate share link error:', error);
      toast.error('Failed to generate share link');
      return null;
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyShareLink = async () => {
    let linkToCopy = shareLink;

    if (!linkToCopy) {
      linkToCopy = await generateShareLink();
    }

    if (linkToCopy) {
      await navigator.clipboard.writeText(linkToCopy);
      toast.success('Share link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin || !wishlist) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Access denied or wishlist not found
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const takenItems = items.filter((item) => item.is_taken);
  const availableItems = items.filter((item) => !item.is_taken);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin: {wishlist.title}</h1>
              {wishlist.description && (
                <p className="text-muted-foreground">{wishlist.description}</p>
              )}
            </div>
            <Button
              onClick={handleCopyShareLink}
              disabled={generatingLink}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
              {generatingLink ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Share className="w-4 h-4 mr-2" />
                  {shareLink ? 'Copy Share Link' : 'Generate Share Link'}
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Share Link Info */}
        {shareLink && (
          <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Active Share Link
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 break-all font-mono">
                    {shareLink}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(shareLink)}
                  className="flex-shrink-0">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Available Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">
                Available Items ({availableItems.length})
              </CardTitle>
              <CardDescription>
                Items that haven't been taken yet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  All items have been taken!
                </p>
              ) : (
                availableItems.map((item) => (
                  <Card key={item.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{item.title}</h4>
                          {item.priority === 3 && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>

                        {item.description && (
                          <p className="text-sm text-muted-foreground mb-2">
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
                              ? 'High'
                              : item.priority === 2
                              ? 'Medium'
                              : 'Low'}
                          </span>
                        </div>

                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1">
                            <LinkIcon className="w-3 h-3" />
                            View link
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          {/* Taken Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">
                Taken Items ({takenItems.length})
              </CardTitle>
              <CardDescription>
                Items that have been claimed by guests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {takenItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No items have been taken yet
                </p>
              ) : (
                takenItems.map((item) => (
                  <Card key={item.id} className="p-3 bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{item.title}</h4>
                          <Check className="w-4 h-4 text-green-600" />
                          {item.priority === 3 && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>

                        {item.description && (
                          <p className="text-sm text-muted-foreground mb-2">
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
                              ? 'High'
                              : item.priority === 2
                              ? 'Medium'
                              : 'Low'}
                          </span>
                        </div>

                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1 mb-2">
                            <LinkIcon className="w-3 h-3" />
                            View link
                          </a>
                        )}

                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Taken by:</span>{' '}
                          {item.taken_by_name || 'Anonymous'}
                          {item.taken_at && (
                            <span className="ml-2">
                              on {new Date(item.taken_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {items.length}
                </div>
                <div className="text-sm text-muted-foreground">Total Items</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {availableItems.length}
                </div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {takenItems.length}
                </div>
                <div className="text-sm text-muted-foreground">Taken</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminWishlist;
