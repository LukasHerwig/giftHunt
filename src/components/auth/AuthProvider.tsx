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

  // Function to validate session by making an API call
  const validateSession = async (session: Session): Promise<boolean> => {
    try {
      // First, check if the session exists and has a valid expiry
      if (!session || !session.access_token) {
        console.log('Session missing or no access token');
        return false;
      }

      // Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        console.log('Session has expired');
        return false;
      }

      console.log('Basic session checks passed, verifying with backend...');

      // Create a timeout promise to avoid hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Validation timeout')), 5000); // 5 second timeout
      });

      // Try to get the current user to validate the session is actually valid
      const userPromise = supabase.auth.getUser();

      const {
        data: { user },
        error,
      } = await Promise.race([userPromise, timeoutPromise]);

      if (error) {
        console.log('Session validation failed:', error.message);
        return false;
      }

      if (!user) {
        console.log('No user returned, session is invalid');
        return false;
      }

      console.log('Session validation successful for user:', user.email);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message === 'Validation timeout') {
        console.log('Session validation timed out, assuming valid for now');
        return true; // Fail gracefully - assume valid to avoid blocking users
      }
      console.log('Session validation error:', error);
      return false;
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
          // If there's an error getting the session, clear auth state
          setSession(null);
          setUser(null);
          if (!isPublicRoute) {
            navigate('/auth');
          }
        } else if (session) {
          // Validate the session by making an API call
          const isValid = await validateSession(session);

          if (isValid) {
            setSession(session);
            setUser(session.user);
          } else {
            // Session is invalid, force logout
            console.log('Session validation failed, forcing logout');
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            if (!isPublicRoute) {
              navigate('/auth');
              toast.info('Session expired. Please sign in again.');
            }
          }
        } else {
          // No session
          setSession(null);
          setUser(null);
          if (!isPublicRoute) {
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

    getInitialSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);

      switch (event) {
        case 'SIGNED_IN':
        case 'INITIAL_SESSION':
          console.log(
            'Processing auth event:',
            event,
            'Current path:',
            location.pathname
          );
          // Validate the session when we get it
          if (session) {
            try {
              console.log('Validating session...');
              const isValid = await validateSession(session);
              console.log('Session validation result:', isValid);

              if (isValid) {
                console.log('Setting valid session and user');
                setSession(session);
                setUser(session.user);
                setLoading(false); // Ensure loading is set to false
                console.log(
                  'Loading set to false, current path:',
                  location.pathname
                );

                if (location.pathname === '/auth') {
                  console.log('Navigating from auth to dashboard');
                  navigate('/');
                } else {
                  console.log('Already on correct page, staying here');
                }
              } else {
                console.log('Invalid session detected, forcing logout');
                await supabase.auth.signOut();
                setSession(null);
                setUser(null);
                setLoading(false); // Ensure loading is set to false
                if (!isPublicRoute) {
                  navigate('/auth');
                  toast.info('Session expired. Please sign in again.');
                }
              }
            } catch (error) {
              console.error('Session validation error:', error);
              setSession(null);
              setUser(null);
              setLoading(false); // Ensure loading is set to false
              if (!isPublicRoute) {
                navigate('/auth');
                toast.error('Authentication error. Please sign in again.');
              }
            }
          } else {
            console.log('No session provided');
            setSession(null);
            setUser(null);
            setLoading(false); // Ensure loading is set to false
            if (!isPublicRoute) {
              navigate('/auth');
            }
          }
          break;

        case 'SIGNED_OUT':
          // User signed out or session expired
          setSession(null);
          setUser(null);
          setLoading(false); // Ensure loading is set to false
          if (!isPublicRoute) {
            navigate('/auth');
            toast.info('Session expired. Please sign in again.');
          }
          break;

        case 'TOKEN_REFRESHED':
          // Validate the refreshed token
          if (session) {
            try {
              const isValid = await validateSession(session);

              if (isValid) {
                console.log('Token refreshed successfully');
                setSession(session);
                setUser(session.user);
              } else {
                console.log('Refreshed token is invalid, forcing logout');
                await supabase.auth.signOut();
                setSession(null);
                setUser(null);
                if (!isPublicRoute) {
                  navigate('/auth');
                  toast.info('Session expired. Please sign in again.');
                }
              }
            } catch (error) {
              console.error('Token refresh validation error:', error);
              setSession(session);
              setUser(session.user);
            }
          }
          break;

        case 'USER_UPDATED':
          // User profile was updated
          if (session) {
            setSession(session);
            setUser(session.user);
          }
          break;

        default:
          // Handle any other auth events
          setLoading(false); // Ensure loading is set to false
          if (!session && !isPublicRoute) {
            navigate('/auth');
          }
          break;
      }
    });

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
