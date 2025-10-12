import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { AuthContext, AuthContextType } from './AuthContext';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Routes that don't require authentication
  const publicRoutes = ['/auth', '/accept-invitation', '/shared'];
  const isPublicRoute = publicRoutes.some(
    (route) =>
      location.pathname === route || location.pathname.startsWith(route + '/')
  );

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear local state
      setSession(null);
      setUser(null);

      // Redirect to auth page
      navigate('/auth');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          setSession(null);
          setUser(null);
          if (!isPublicRoute) {
            navigate('/auth');
          }
        } else {
          // Trust Supabase's session management - no additional validation needed
          setSession(session);
          setUser(session?.user || null);

          // Redirect logic
          if (session && location.pathname === '/auth') {
            navigate('/');
          } else if (!session && !isPublicRoute) {
            navigate('/auth');
          }
        }
      } catch (error) {
        console.error('Unexpected error getting session:', error);
        setSession(null);
        setUser(null);
        if (!isPublicRoute) {
          navigate('/auth');
        }
      } finally {
        setLoading(false);
      }
    };

    // Listen for auth state changes - simple switch case like your Flutter code
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(
        'Auth state changed:',
        event,
        session?.user?.email || 'no user'
      );

      switch (event) {
        case 'INITIAL_SESSION':
          // Handle initial session when app starts
          setSession(session);
          setUser(session?.user || null);
          setLoading(false);

          if (session && location.pathname === '/auth') {
            navigate('/');
          } else if (!session && !isPublicRoute) {
            navigate('/auth');
          }
          break;

        case 'SIGNED_IN':
          // User successfully signed in
          setSession(session);
          setUser(session?.user || null);
          setLoading(false);

          if (location.pathname === '/auth') {
            navigate('/');
          }
          break;

        case 'SIGNED_OUT':
          // User signed out or session expired
          setSession(null);
          setUser(null);
          setLoading(false);

          if (!isPublicRoute) {
            navigate('/auth');
            toast.info('Session expired. Please sign in again.');
          }
          break;

        case 'TOKEN_REFRESHED':
          // Token was refreshed successfully
          setSession(session);
          setUser(session?.user || null);
          console.log('Token refreshed successfully');
          break;

        case 'USER_UPDATED':
          // User profile was updated
          setSession(session);
          setUser(session?.user || null);
          console.log('User data updated');
          break;

        case 'PASSWORD_RECOVERY':
          // Handle password recovery if needed in the future
          console.log('Password recovery initiated');
          break;

        default:
          // Log unhandled events for future debugging
          console.log('Unhandled auth event:', event);
          // Ensure we're not stuck in loading state
          setLoading(false);
          break;
      }
    });

    // Initialize auth state
    getInitialSession();

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, [navigate, location.pathname, isPublicRoute]);

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const value: AuthContextType = {
    session,
    user,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
