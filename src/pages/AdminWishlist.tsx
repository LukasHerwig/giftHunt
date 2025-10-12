import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
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
  Undo2,
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
  is_taken: boolean;
  taken_by_name: string | null;
  taken_at: string | null;
  created_at: string;
}

interface Wishlist {
  id: string;
  title: string;
  description: string | null;
  enable_links: boolean | null;
  enable_price: boolean | null;
  enable_priority: boolean | null;
}

const AdminWishlist = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [untakeDialogOpen, setUntakeDialogOpen] = useState(false);
  const [selectedUntakeItem, setSelectedUntakeItem] =
    useState<WishlistItem | null>(null);
  const [untaking, setUntaking] = useState(false);

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
        toast.error(t('messages.noAdminAccess'));
        navigate('/');
      }
    } catch (error) {
      console.error('Admin access check error:', error);
      toast.error(t('messages.failedToVerifyAccess'));
      navigate('/');
    }
  }, [id, navigate, t]);

  const loadWishlist = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select(
          'id, title, description, enable_links, enable_price, enable_priority'
        )
        .eq('id', id)
        .single();

      if (error) throw error;
      setWishlist(data);
    } catch (error) {
      console.error('Load wishlist error:', error);
      toast.error(t('messages.failedToLoadWishlist'));
    }
  }, [id, t]);

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
      toast.error(t('messages.failedToLoadItems'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  const loadShareLink = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('share_links')
        .select('token')
        .eq('wishlist_id', id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setShareLink(`${window.location.origin}/shared/${data.token}`);
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

  const generateShareLink = useCallback(async () => {
    if (!id) return;

    setGeneratingLink(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if there's already an existing share link
      const { data: existingLink } = await supabase
        .from('share_links')
        .select('token')
        .eq('wishlist_id', id)
        .maybeSingle();

      if (existingLink) {
        const url = `${window.location.origin}/shared/${existingLink.token}`;
        setShareLink(url);
        return url;
      }

      // Generate new share link
      const shareToken = crypto.randomUUID();
      const { data, error } = await supabase
        .from('share_links')
        .insert({
          wishlist_id: id,
          created_by: user.id,
          token: shareToken,
        })
        .select('token')
        .single();

      if (error) throw error;

      const url = `${window.location.origin}/shared/${data.token}`;
      setShareLink(url);
      return url;
    } catch (error) {
      console.error('Generate share link error:', error);
      toast.error(t('messages.failedToGenerateShareLink'));
      return null;
    } finally {
      setGeneratingLink(false);
    }
  }, [id, t]);

  const handleCopyShareLink = useCallback(async () => {
    let linkToCopy = shareLink;

    if (!linkToCopy) {
      linkToCopy = await generateShareLink();
    }

    if (linkToCopy) {
      await navigator.clipboard.writeText(linkToCopy);
      toast.success(t('messages.shareLinkCopied'));
    }
  }, [shareLink, generateShareLink, t]);

  const handleUntakeItem = useCallback(async () => {
    if (!selectedUntakeItem) return;

    setUntaking(true);
    try {
      const { error } = await supabase
        .from('wishlist_items')
        .update({
          is_taken: false,
          taken_by_name: null,
          taken_at: null,
        })
        .eq('id', selectedUntakeItem.id);

      if (error) throw error;

      // Update local state
      setItems(
        items.map((item) =>
          item.id === selectedUntakeItem.id
            ? { ...item, is_taken: false, taken_by_name: null, taken_at: null }
            : item
        )
      );

      setUntakeDialogOpen(false);
      setSelectedUntakeItem(null);
      toast.success(t('messages.itemUntaken'));
    } catch (error) {
      console.error('Untake item error:', error);
      toast.error(t('messages.failedToUntakeItem'));
    } finally {
      setUntaking(false);
    }
  }, [selectedUntakeItem, items, t]);

  const openUntakeDialog = (item: WishlistItem) => {
    setSelectedUntakeItem(item);
    setUntakeDialogOpen(true);
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
              {t('adminWishlist.accessDenied')}
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
      <AppHeader />

      <PageSubheader
        actions={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Button>
          </div>
        }
        children={
          <Button
            onClick={handleCopyShareLink}
            disabled={generatingLink}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
            {generatingLink ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('adminWishlist.generating')}
              </>
            ) : (
              <>
                <Share className="w-4 h-4 mr-2" />
                {shareLink
                  ? t('adminWishlist.copyShareLink')
                  : t('adminWishlist.generateShareLink')}
              </>
            )}
          </Button>
        }
      />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Share Link Info */}
        {shareLink && (
          <Card className="mb-6 border-accent/30 bg-accent/5 dark:bg-accent/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-accent mb-1">
                    {t('adminWishlist.activeShareLink')}
                  </h3>
                  <p className="text-sm text-accent/80 break-all font-mono">
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

        {/* Summary Stats */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('adminWishlist.summary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {items.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('adminWishlist.totalItems')}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {availableItems.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('adminWishlist.available')}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent">
                  {takenItems.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('adminWishlist.taken')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Available Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">
                {t('adminWishlist.availableItems')} ({availableItems.length})
              </CardTitle>
              <CardDescription>
                {t('adminWishlist.availableItemsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {t('adminWishlist.allItemsTaken')}
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
                          {wishlist?.enable_price && item.price_range && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                              <DollarSign className="w-3 h-3" />
                              {item.price_range}
                            </span>
                          )}
                          {wishlist?.enable_priority && item.priority > 0 && (
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                item.priority === 3
                                  ? 'bg-destructive/10 text-destructive'
                                  : item.priority === 2
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                              {item.priority === 3
                                ? t('adminWishlist.high')
                                : item.priority === 2
                                ? t('adminWishlist.medium')
                                : t('adminWishlist.low')}
                            </span>
                          )}
                        </div>

                        {wishlist?.enable_links && item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1">
                            <LinkIcon className="w-3 h-3" />
                            {t('adminWishlist.viewLink')}
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
              <CardTitle className="text-accent">
                {t('adminWishlist.takenItems')} ({takenItems.length})
              </CardTitle>
              <CardDescription>
                {t('adminWishlist.itemsClaimedByGuests')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {takenItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {t('adminWishlist.noItemsTakenYet')}
                </p>
              ) : (
                takenItems.map((item) => (
                  <Card key={item.id} className="p-3 bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{item.title}</h4>
                          <Check className="w-4 h-4 text-primary" />
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
                          {wishlist?.enable_price && item.price_range && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                              <DollarSign className="w-3 h-3" />
                              {item.price_range}
                            </span>
                          )}
                          {wishlist?.enable_priority && item.priority > 0 && (
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                item.priority === 3
                                  ? 'bg-destructive/10 text-destructive'
                                  : item.priority === 2
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                              {item.priority === 3
                                ? t('adminWishlist.high')
                                : item.priority === 2
                                ? t('adminWishlist.medium')
                                : t('adminWishlist.low')}
                            </span>
                          )}
                        </div>

                        {wishlist?.enable_links && item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1 mb-2">
                            <LinkIcon className="w-3 h-3" />
                            {t('adminWishlist.viewLink')}
                          </a>
                        )}

                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">
                            {t('adminWishlist.takenBy')}:
                          </span>{' '}
                          {item.taken_by_name || t('adminWishlist.anonymous')}
                          {item.taken_at && (
                            <span className="ml-2">
                              {t('adminWishlist.on')}{' '}
                              {new Date(item.taken_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openUntakeDialog(item)}
                          className="text-xs">
                          <Undo2 className="w-3 h-3 mr-1" />
                          {t('adminWishlist.untakeItem')}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Untake Item Confirmation Dialog */}
      <Dialog open={untakeDialogOpen} onOpenChange={setUntakeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('untakeItemDialog.title')}</DialogTitle>
            <DialogDescription>
              {selectedUntakeItem &&
                t('untakeItemDialog.description', {
                  title: selectedUntakeItem.title,
                  takenBy:
                    selectedUntakeItem.taken_by_name ||
                    t('adminWishlist.anonymous'),
                })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setUntakeDialogOpen(false)}
              disabled={untaking}>
              {t('untakeItemDialog.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleUntakeItem}
              disabled={untaking}>
              {untaking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('adminWishlist.untaking')}
                </>
              ) : (
                t('untakeItemDialog.untake')
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWishlist;
