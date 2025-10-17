import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/useAuth';
import { OnboardingService } from '../services';

interface OnboardingState {
  needsOnboarding: boolean;
  loading: boolean;
  saving: boolean;
}

interface OnboardingActions {
  checkOnboardingStatus: () => Promise<void>;
  completeOnboarding: (name: string) => Promise<void>;
}

export const useOnboarding = (): OnboardingState & OnboardingActions => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [state, setState] = useState<OnboardingState>({
    needsOnboarding: false,
    loading: false, // Start with false, only set to true when actually checking
    saving: false,
  });

  const checkOnboardingStatus = useCallback(async () => {
    if (!user) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true }));
      const needsOnboarding = await OnboardingService.checkIfOnboardingNeeded(
        user.id
      );
      setState((prev) => ({
        ...prev,
        needsOnboarding,
        loading: false,
      }));
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setState((prev) => ({
        ...prev,
        needsOnboarding: false,
        loading: false,
      }));
    }
  }, [user]);

  const completeOnboarding = useCallback(
    async (name: string) => {
      if (!user) return;

      try {
        setState((prev) => ({ ...prev, saving: true }));
        await OnboardingService.completeOnboarding(user.id, name);
        setState((prev) => ({
          ...prev,
          needsOnboarding: false,
          saving: false,
        }));
        toast.success(t('onboarding.welcomeComplete'));
      } catch (error) {
        console.error('Error completing onboarding:', error);
        toast.error(t('onboarding.errorSaving'));
        setState((prev) => ({ ...prev, saving: false }));
      }
    },
    [user, t]
  );

  return {
    ...state,
    checkOnboardingStatus,
    completeOnboarding,
  };
};
