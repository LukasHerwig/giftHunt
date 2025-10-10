import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Gift, Plus, LogOut, Link as LinkIcon, Trash2, Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Wishlist {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadWishlists();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadWishlists = async () => {
    try {
      const { data, error } = await supabase
        .from("wishlists")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWishlists(data || []);
    } catch (error: any) {
      toast.error("Failed to load wishlists");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWishlist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("wishlists")
        .insert([
          {
            user_id: user?.id,
            title: newTitle.trim(),
            description: newDescription.trim() || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setWishlists([data, ...wishlists]);
      setNewTitle("");
      setNewDescription("");
      setCreateDialogOpen(false);
      toast.success("Wishlist created!");
    } catch (error: any) {
      toast.error("Failed to create wishlist");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWishlist = async (id: string) => {
    try {
      const { error } = await supabase
        .from("wishlists")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setWishlists(wishlists.filter((w) => w.id !== id));
      toast.success("Wishlist deleted");
    } catch (error: any) {
      toast.error("Failed to delete wishlist");
    }
  };

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/wishlist/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
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
            <h1 className="text-2xl font-bold">My Wishlists</h1>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:opacity-90">
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
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Wishlist"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

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
              <Card key={wishlist.id} className="hover:shadow-lg transition-shadow">
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
                      onClick={() => navigate(`/wishlist/${wishlist.id}/manage`)}
                      className="w-full"
                    >
                      Manage Items
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleCopyLink(wishlist.id)}
                      className="w-full"
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Copy Share Link
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleDeleteWishlist(wishlist.id)}
                      className="w-full text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
