import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/useAuth';
import { ProfileService } from '../services/ProfileService';
import { ProfileState, ProfileActions } from '../types';

export const useProfile = (): ProfileState & ProfileActions => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [state, setState] = useState<ProfileState>({
    profile: null,
    loading: true,
    saving: false,
    fullName: '',
  });

  const loadProfile = useCallback(async () => {
    if (!user) return;

    try {
      setState((prev) => ({ ...prev, loading: true }));
      const profile = await ProfileService.getProfile(user.id);

      setState((prev) => ({
        ...prev,
        profile,
        fullName: profile.full_name || '',
        loading: false,
      }));
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error(t('messages.failedToLoadProfile'));
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [user, t]);

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!user || !state.profile) return;

      // Validate that name is not empty or just spaces
      if (!state.fullName.trim()) {
        toast.error(t('profile.nameRequired'));
        return;
      }

      try {
        setState((prev) => ({ ...prev, saving: true }));

        await ProfileService.updateProfile(user.id, {
          fullName: state.fullName,
        });

        setState((prev) => ({
          ...prev,
          profile: prev.profile
            ? {
                ...prev.profile,
                full_name: state.fullName.trim() || null,
              }
            : null,
          saving: false,
        }));

        toast.success(t('messages.profileUpdated'));
      } catch (error) {
        console.error('Error updating profile:', error);
        toast.error(t('messages.failedToUpdateProfile'));
        setState((prev) => ({ ...prev, saving: false }));
      }
    },
    [user, state.profile, state.fullName, t]
  );

  const setFullName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, fullName: name }));
  }, []);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user, loadProfile]);

  return {
    ...state,
    loadProfile,
    handleSave,
    setFullName,
  };
};
