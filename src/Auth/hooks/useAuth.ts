import { useEffect, useState } from 'react';
import { AuthService } from '../services/AuthService';
import type { AuthState } from '../types';

/**
 * Whether the first session check is still running. Where a signed-in person goes next
 * (Home, onboarding, a pending invitation) is decided in one place only: `AuthProvider`.
 */
export const useAuth = (): AuthState => {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    AuthService.getCurrentSession()
      .catch((error) => console.error('Error checking session:', error))
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { checking };
};
