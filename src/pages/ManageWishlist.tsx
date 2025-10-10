import { useEffect, useState } from 'react';
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, ExternalLink, Loader2 } from 'lucide-react';

interface WishlistItem {
  id: string;
  title: string;
  link: string | null;
  created_at: string;
}

const ManageWishlist = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLink, setNewLink] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        loadItems();
      }
    });
  }, [id, navigate]);

  const loadItems = async () => {
    try {
      // Load all items for the owner (but don't show taken status to maintain surprise)
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('id, title, link, created_at')
        .eq('wishlist_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

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
            link: newLink.trim() || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setItems([data, ...items]);
      setNewTitle('');
      setNewLink('');
      setDialogOpen(false);
      toast.success('Item added!');
    } catch (error: any) {
      toast.error('Failed to add item');
    } finally {
      setAdding(false);
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
    } catch (error: any) {
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
        <div className="mb-8">
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
                <Input
                  placeholder="Item title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="text-base"
                  disabled={adding}
                />
                <Input
                  placeholder="Link (optional)"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  className="text-base"
                  disabled={adding}
                />
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
        </div>

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
                      <CardTitle className="text-lg break-words">
                        {item.title}
                      </CardTitle>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1 mt-2 break-all">
                          View link
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-destructive hover:text-destructive flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
