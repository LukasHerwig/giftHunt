import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
import { toast } from 'sonner';
import {
  Gift,
  ExternalLink,
  Check,
  Loader2,
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
  is_taken: boolean;
}

interface Wishlist {
  title: string;
  description: string | null;
}

interface ShareLink {
  wishlist_id: string;
  is_active: boolean;
  expires_at: string | null;
}

const PublicWishlist = () => {
  const { token } = useParams(); // This will be the share token from /shared/:token route
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);

  useEffect(() => {
    if (token) {
      loadWishlistByToken();
    } else {
      // Fallback for old direct wishlist access (will show access denied)
      setLoading(false);
    }
  }, [token]);

  const loadWishlistByToken = async () => {
    try {
      // First, validate the share token and get wishlist ID
      const { data: shareLinkData, error: shareLinkError } = await supabase
        .from('share_links')
        .select('wishlist_id, is_active, expires_at')
        .eq('share_token', token)
        .single();

      if (shareLinkError) {
        throw new Error('Invalid or expired share link');
      }

      if (!shareLinkData.is_active) {
        throw new Error('This share link has been deactivated');
      }

      if (
        shareLinkData.expires_at &&
        new Date(shareLinkData.expires_at) < new Date()
      ) {
        throw new Error('This share link has expired');
      }

      setShareLink(shareLinkData);

      // Load wishlist info
      const { data: wishlistData, error: wishlistError } = await supabase
        .from('wishlists')
        .select('title, description')
        .eq('id', shareLinkData.wishlist_id)
        .single();

      if (wishlistError) throw wishlistError;
      setWishlist(wishlistData);

      // Load all items (but hide who took what from public users)
      const { data: itemsData, error: itemsError } = await supabase
        .from('wishlist_items')
        .select('id, title, description, link, price_range, priority, is_taken')
        .eq('wishlist_id', shareLinkData.wishlist_id)
        .order('priority', { ascending: false }) // Show high priority items first
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;
      setItems(itemsData || []);
    } catch (error) {
      console.error('Load wishlist error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to load wishlist'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClaimItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedItem || !shareLink) return;

    setClaiming(true);
    try {
      const { error } = await supabase
        .from('wishlist_items')
        .update({
          is_taken: true,
          taken_by_name: buyerName.trim() || 'Anonymous',
          taken_at: new Date().toISOString(),
        })
        .eq('id', selectedItem);

      if (error) throw error;

      // Update local state
      setItems(
        items.map((item) =>
          item.id === selectedItem ? { ...item, is_taken: true } : item
        )
      );

      setBuyerName('');
      setDialogOpen(false);
      setSelectedItem(null);
      toast.success('Item claimed! Thank you!');
    } catch (error) {
      console.error('Claim item error:', error);
      toast.error('Failed to claim item');
    } finally {
      setClaiming(false);
    }
  };

  const openClaimDialog = (itemId: string) => {
    setSelectedItem(itemId);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!wishlist || !shareLink) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Access Not Available</h3>
            <p className="text-muted-foreground">
              {!token
                ? 'This wishlist requires a valid share link to access'
                : 'The share link is invalid, expired, or has been deactivated'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">{wishlist.title}</h1>
          {wishlist.description && (
            <p className="text-muted-foreground text-lg">
              {wishlist.description}
            </p>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {items.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">
                No items in this wishlist yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Card
                key={item.id}
                className={`transition-all ${
                  item.is_taken ? 'opacity-60 bg-muted/50' : 'hover:shadow-md'
                }`}>
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
                        {item.is_taken && (
                          <span className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
                            <Check className="w-4 h-4 text-green-600" />
                            Taken
                          </span>
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
                    {!item.is_taken && (
                      <Button
                        onClick={() => openClaimDialog(item.id)}
                        className="flex-shrink-0">
                        I'll get this!
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Claim this item</DialogTitle>
              <DialogDescription>
                Let others know you're getting this gift. You can add your name
                or stay anonymous.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleClaimItem} className="space-y-4">
              <Input
                placeholder="Your name (optional)"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="text-base"
                disabled={claiming}
              />
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                disabled={claiming}>
                {claiming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  'Claim Item'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default PublicWishlist;
