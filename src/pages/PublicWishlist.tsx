import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
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
import LanguageSwitcher from '@/components/LanguageSwitcher';
import AppHeader from '@/components/AppHeader';
import PageSubheader from '@/components/PageSubheader';

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
  expires_at: string | null;
}

const PublicWishlist = () => {
  const { token } = useParams(); // This will be the share token from /shared/:token route
  const { t } = useTranslation();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);

  const loadWishlistByToken = useCallback(async () => {
    try {
      // First, validate the share token and get wishlist ID
      const { data: shareLinkData, error: shareLinkError } = await supabase
        .from('share_links')
        .select('wishlist_id, expires_at')
        .eq('token', token)
        .maybeSingle();

      if (shareLinkError) {
        throw new Error(t('publicWishlist.invalidOrExpiredLink'));
      }

      if (!shareLinkData) {
        throw new Error(t('publicWishlist.invalidOrExpiredLink'));
      }

      if (
        shareLinkData.expires_at &&
        new Date(shareLinkData.expires_at) < new Date()
      ) {
        throw new Error(t('publicWishlist.linkExpired'));
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
        error instanceof Error
          ? error.message
          : t('publicWishlist.failedToLoad')
      );
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    const loadData = async () => {
      if (token) {
        await loadWishlistByToken();
      } else {
        // Fallback for old direct wishlist access (will show access denied)
        setLoading(false);
      }
    };

    loadData();
  }, [token, loadWishlistByToken]);

  const handleClaimItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedItem || !shareLink) return;

    // Validate that name is provided
    if (!buyerName.trim()) {
      toast.error(t('publicWishlist.nameRequired'));
      return;
    }

    setClaiming(true);
    try {
      const { error } = await supabase
        .from('wishlist_items')
        .update({
          is_taken: true,
          taken_by_name: buyerName.trim(),
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
      toast.success(t('publicWishlist.itemClaimed'));
    } catch (error) {
      console.error('Claim item error:', error);
      toast.error(t('publicWishlist.failedToClaim'));
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
        <span className="ml-2">{t('common.loading')}</span>
      </div>
    );
  }

  if (!wishlist || !shareLink) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">
              {t('publicWishlist.accessNotAvailable')}
            </h3>
            <p className="text-muted-foreground">
              {!token
                ? t('publicWishlist.requiresShareLink')
                : t('publicWishlist.invalidShareLink')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="absolute top-4 right-4 z-10">
          <LanguageSwitcher />
        </div>
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
                {t('publicWishlist.noItemsYet')}
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
                            <Check className="w-4 h-4 text-primary" />
                            {t('publicWishlist.taken')}
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
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                            <DollarSign className="w-3 h-3" />
                            {item.price_range}
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            item.priority === 3
                              ? 'bg-destructive/10 text-destructive'
                              : item.priority === 2
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                          {item.priority === 3
                            ? t('priority.high')
                            : item.priority === 2
                            ? t('priority.medium')
                            : t('priority.low')}
                        </span>
                      </div>

                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1 break-all">
                          {t('manageWishlist.viewLink')}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      )}
                    </div>
                    {!item.is_taken && (
                      <Button
                        onClick={() => openClaimDialog(item.id)}
                        className="flex-shrink-0">
                        {t('publicWishlist.illGetThis')}
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
              <DialogTitle>{t('publicWishlist.claimItem')}</DialogTitle>
              <DialogDescription>
                {t('publicWishlist.claimDescription')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleClaimItem} className="space-y-4">
              <Input
                placeholder={t('publicWishlist.yourNameRequired')}
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="text-base"
                disabled={claiming}
                required
              />
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                disabled={claiming || !buyerName.trim()}>
                {claiming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('publicWishlist.claiming')}
                  </>
                ) : (
                  t('publicWishlist.claimButton')
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
