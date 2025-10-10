import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface Invitation {
  id: string;
  wishlist_id: string;
  email: string;
  invited_by: string;
  accepted: boolean;
  expires_at: string;
  wishlists: {
    title: string;
    description: string | null;
    profiles: {
      email: string;
    };
  };
}

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email?: string;
  } | null>(null);

  const token = searchParams.get('token');

  const loadInvitation = useCallback(async () => {
    try {
      console.log('Loading invitation with token:', token);

      // First, try to load just the invitation
      const { data: inviteData, error: inviteError } = await supabase
        .from('wishlist_invitations')
        .select('*')
        .eq('token', token)
        .single();

      console.log('Invitation data:', inviteData);
      console.log('Invitation error:', inviteError);

      if (inviteError) {
        console.error('Database error:', inviteError);
        throw inviteError;
      }

      if (!inviteData) {
        throw new Error('No invitation found');
      }

      if (inviteData.accepted) {
        setError('This invitation has already been accepted');
        setLoading(false);
        return;
      }

      if (new Date(inviteData.expires_at) < new Date()) {
        setError('This invitation has expired');
        setLoading(false);
        return;
      }

      // Then load the wishlist separately
      const { data: wishlistData, error: wishlistError } = await supabase
        .from('wishlists')
        .select(
          `
          title,
          description,
          profiles!wishlists_user_id_fkey (
            email
          )
        `
        )
        .eq('id', inviteData.wishlist_id)
        .single();

      console.log('Wishlist data:', wishlistData);
      console.log('Wishlist error:', wishlistError);

      // Combine the data
      const combinedData = {
        ...inviteData,
        wishlists: wishlistData,
      };

      console.log('Combined data:', combinedData);
      setInvitation(combinedData);
    } catch (error: unknown) {
      console.error('Failed to load invitation:', error);
      setError('Invalid or expired invitation');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    // Check if user is already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
      if (!user) {
        setNeedsAuth(true);
      }
      loadInvitation();
    });
  }, [token, loadInvitation]);

  const handleAcceptInvitation = async () => {
    if (!invitation) return;

    // If user is not logged in, redirect to auth
    if (!currentUser) {
      // Store the token in sessionStorage so we can return here after auth
      sessionStorage.setItem('pendingInvitationToken', token!);
      navigate('/auth');
      return;
    }

    // Check if user's email matches invitation email
    if (currentUser.email !== invitation.email) {
      setError(
        `You must be logged in with the email ${invitation.email} to accept this invitation.`
      );
      return;
    }

    setAccepting(true);
    try {
      // Create admin relationship
      const { error: adminError } = await supabase
        .from('wishlist_admins')
        .insert([
          {
            wishlist_id: invitation.wishlist_id,
            admin_user_id: currentUser.id,
            invited_by: invitation.invited_by,
          },
        ]);

      if (adminError) throw adminError;

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('wishlist_invitations')
        .update({ accepted: true })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      toast.success(
        'Invitation accepted! You are now an admin for this wishlist.'
      );
      navigate(`/wishlist/${invitation.wishlist_id}/admin`);
    } catch (error: unknown) {
      toast.error('Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">You've been invited!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {invitation && invitation.wishlists && (
            <>
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">
                  {invitation.wishlists.title}
                </h3>
                {invitation.wishlists.description && (
                  <p className="text-muted-foreground">
                    {invitation.wishlists.description}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  by {invitation.wishlists.profiles?.email || 'Unknown'}
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">
                  As an admin, you'll be able to:
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• See which items have been taken and by whom</li>
                  <li>• Share the wishlist link with others</li>
                  <li>• Coordinate gift-giving efforts</li>
                </ul>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Invited:{' '}
                  <span className="font-medium">{invitation.email}</span>
                </p>

                {!currentUser ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Please log in or create an account with the email{' '}
                      <strong>{invitation.email}</strong> to accept this
                      invitation.
                    </p>
                    <Button
                      onClick={handleAcceptInvitation}
                      className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                      Log In / Sign Up to Accept
                    </Button>
                  </div>
                ) : currentUser.email !== invitation.email ? (
                  <div className="space-y-3 text-center">
                    <p className="text-sm text-destructive">
                      You're logged in as <strong>{currentUser.email}</strong>,
                      but this invitation was sent to{' '}
                      <strong>{invitation.email}</strong>.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Please log out and sign in with the correct email address.
                    </p>
                    <Button
                      onClick={() => {
                        supabase.auth.signOut();
                        navigate('/auth');
                      }}
                      variant="outline"
                      className="w-full">
                      Sign Out & Log In with Correct Email
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleAcceptInvitation}
                    disabled={accepting}
                    className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                    {accepting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Accepting...
                      </>
                    ) : (
                      'Accept Invitation'
                    )}
                  </Button>
                )}
              </div>
            </>
          )}

          {invitation && !invitation.wishlists && (
            <div className="text-center space-y-4">
              <p className="text-destructive">
                Unable to load wishlist details.
              </p>
              <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitation;
