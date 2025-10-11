import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { AuthPage } from '@/components/auth/AuthPage';
import { Loader2 } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      // Check if there's a pending invitation token
      const pendingToken = sessionStorage.getItem('pendingInvitationToken');
      if (pendingToken) {
        sessionStorage.removeItem('pendingInvitationToken');
        navigate(`/accept-invitation?token=${pendingToken}`);
      } else {
        navigate('/');
      }
    }
  }, [navigate, user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <AuthPage />;
};

export default Auth;
