import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { AuthContext, AuthContextType } from './AuthContext';
import { OnboardingService } from '@/Auth/services';

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

  // Onboarding route requires authentication but is handled specially
  const isOnboardingRoute = location.pathname === '/onboarding';

  // Helper function to handle authenticated user navigation
  const handleAuthenticatedNavigation = useCallback(
    async (session: Session | null) => {
      if (!session) return;

      try {
        // Check if user needs onboarding
        const needsOnboarding = await OnboardingService.checkIfOnboardingNeeded(
          session.user.id
        );

        if (needsOnboarding && location.pathname !== '/onboarding') {
          navigate('/onboarding');
        } else if (!needsOnboarding && location.pathname === '/auth') {
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // If there's an error, just redirect normally
        if (location.pathname === '/auth') {
          navigate('/');
        }
      }
    },
    [navigate, location.pathname]
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
          if (session) {
            handleAuthenticatedNavigation(session);
          } else if (!isPublicRoute && !isOnboardingRoute) {
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
      switch (event) {
        case 'INITIAL_SESSION':
          // Handle initial session when app starts
          setSession(session);
          setUser(session?.user || null);
          setLoading(false);

          if (session) {
            handleAuthenticatedNavigation(session);
          } else if (!isPublicRoute && !isOnboardingRoute) {
            navigate('/auth');
          }
          break;

        case 'SIGNED_IN':
          // User successfully signed in
          setSession(session);
          setUser(session?.user || null);
          setLoading(false);

          if (session) {
            handleAuthenticatedNavigation(session);
          }
          break;

        case 'SIGNED_OUT':
          // User signed out or session expired
          setSession(null);
          setUser(null);
          setLoading(false);

          if (!isPublicRoute && !isOnboardingRoute) {
            navigate('/auth');
            toast.info('Session expired. Please sign in again.');
          }
          break;

        case 'TOKEN_REFRESHED':
          // Token was refreshed successfully
          setSession(session);
          setUser(session?.user || null);
          break;

        case 'USER_UPDATED':
          // User profile was updated
          setSession(session);
          setUser(session?.user || null);
          break;

        case 'PASSWORD_RECOVERY':
          // Handle password recovery if needed in the future
          break;

        default:
          // Ensure we're not stuck in loading state
          setLoading(false);
          break;
      }
    });

    // Initialize auth state
    getInitialSession();

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, [
    navigate,
    location.pathname,
    isPublicRoute,
    isOnboardingRoute,
    handleAuthenticatedNavigation,
  ]);

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
