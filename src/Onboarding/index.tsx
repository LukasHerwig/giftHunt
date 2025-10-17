import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/useAuth';
import { OnboardingService } from '@/Auth/services';
import { OnboardingStep } from '@/Auth/components/OnboardingStep';
import { AuthLoadingState } from '@/Auth/components/AuthLoadingState';
import { useState, useCallback } from 'react';

const Onboarding = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const checkOnboardingStatus = useCallback(async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      setLoading(true);
      const needs = await OnboardingService.checkIfOnboardingNeeded(user.id);
      setNeedsOnboarding(needs);

      // If user doesn't need onboarding, redirect to main app
      if (!needs) {
        navigate('/');
        return;
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);

      // If it's a profile error, the user has been signed out already
      // Just redirect to auth page
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error checking profile status';
      toast.error(errorMessage);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  const completeOnboarding = useCallback(
    async (name: string) => {
      if (!user) return;

      try {
        setSaving(true);
        await OnboardingService.completeOnboarding(user.id, name);
        toast.success(t('onboarding.welcomeComplete'));
        navigate('/');
      } catch (error) {
        console.error('Error completing onboarding:', error);
        toast.error(t('onboarding.errorSaving'));
      } finally {
        setSaving(false);
      }
    },
    [user, t, navigate]
  );

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  if (loading) {
    return <AuthLoadingState />;
  }

  if (!user) {
    // This should not happen due to AuthProvider protection, but just in case
    return <AuthLoadingState />;
  }

  if (!needsOnboarding) {
    // This should not happen due to redirect in checkOnboardingStatus, but just in case
    return <AuthLoadingState />;
  }

  return <OnboardingStep onComplete={completeOnboarding} loading={saving} />;
};

export default Onboarding;
