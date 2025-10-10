import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const AcceptInvitation = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email?: string;
  } | null>(null);
  const [invitationValid, setInvitationValid] = useState(false);
  const [inviterEmail, setInviterEmail] = useState<string | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    const checkInvitation = async () => {
      try {
        // Just check if the invitation token exists and is valid
        const { data: inviteData, error: inviteError } = await supabase
          .from('admin_invitations')
          .select('id, email, accepted, expires_at, invited_by')
          .eq('invitation_token', token)
          .single();

        if (inviteError || !inviteData) {
          setError('Invalid or expired invitation');
          setLoading(false);
          return;
        }

        if (inviteData.accepted) {
          setError('This invitation has already been accepted');
          setLoading(false);
          return;
        }

        if (
          inviteData.expires_at &&
          new Date(inviteData.expires_at) < new Date()
        ) {
          setError('This invitation has expired');
          setLoading(false);
          return;
        }

        setInvitationValid(true);

        // Get the inviter's profile information
        if (inviteData.invited_by) {
          try {
            const { data: inviterData, error: inviterError } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', inviteData.invited_by)
              .single();

            if (!inviterError && inviterData) {
              setInviterEmail(inviterData.email);
            } else {
              console.log('Could not fetch inviter profile:', inviterError);
              // Set a fallback message instead of email
              setInviterEmail('Someone');
            }
          } catch (error) {
            console.log('Error fetching inviter profile:', error);
            setInviterEmail('Someone');
          }
        }

        // Check if user is already logged in
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setCurrentUser(user);

        // If user is logged in, redirect to dashboard so they can see the invitation
        if (user) {
          // Store the token so they can process it from dashboard if needed
          sessionStorage.setItem('pendingInvitationToken', token);
          navigate('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error checking invitation:', error);
        setError('Unable to verify invitation');
      } finally {
        setLoading(false);
      }
    };

    checkInvitation();
  }, [token, navigate]);

  const handleSignIn = () => {
    // Store the token so user can complete the invitation after signing in
    if (token) {
      sessionStorage.setItem('pendingInvitationToken', token);
    }
    navigate('/auth');
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
            <h2 className="text-xl font-semibold mb-2">
              {t('acceptInvitation.invalidInvitation')}
            </h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')}>
              {t('acceptInvitation.goToHome')}
            </Button>
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
          <CardTitle className="text-2xl">
            {t('acceptInvitation.youveBeenInvited')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              {t('acceptInvitation.invitedToManage')}
            </p>

            {inviterEmail && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">
                    {t('acceptInvitation.invitedBy')}:
                  </span>{' '}
                  {inviterEmail === 'Someone'
                    ? t('acceptInvitation.someone')
                    : inviterEmail}
                </p>
              </div>
            )}

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">
                {t('acceptInvitation.asAdminYouCan')}
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• {t('acceptInvitation.seeItemsTaken')}</li>
                <li>• {t('acceptInvitation.shareWishlistLink')}</li>
                <li>• {t('acceptInvitation.coordinateGifts')}</li>
                <li>• {t('acceptInvitation.helpManage')}</li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t('acceptInvitation.signInToAccept')}
              </p>

              <Button
                onClick={handleSignIn}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                size="lg">
                {t('acceptInvitation.signInCreateAccount')}
              </Button>

              <p className="text-xs text-muted-foreground">
                {t('acceptInvitation.afterSignInInfo')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitation;
