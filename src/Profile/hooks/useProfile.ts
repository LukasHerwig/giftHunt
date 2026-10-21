import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/lib/toast';
import { useAuth } from '@/components/auth/useAuth';
import { nameChanged, validateName, type NameError } from '@/lib/personName';
import { ProfileService } from '../services/ProfileService';
import type { ProfileData } from '../types';

export const useProfile = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullNameState] = useState('');
  const [nameError, setNameError] = useState<NameError | null>(null);
  // A second tap while saving must not start a second save.
  const running = useRef(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const loaded = await ProfileService.getProfile(userId);
      setProfile(loaded);
      setFullNameState(loaded.full_name ?? '');
      setFailed(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error(t('profile.loadFailed'));
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const setFullName = (value: string) => {
    setFullNameState(value);
    setNameError(null);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!userId || running.current) return;
    const invalid = validateName(fullName);
    setNameError(invalid);
    if (invalid) return;

    running.current = true;
    setSaving(true);
    try {
      await ProfileService.updateProfile(userId, { fullName });
      const saved = fullName.trim();
      setProfile((current) => (current ? { ...current, full_name: saved } : current));
      setFullNameState(saved);
      toast.success(t('profile.toast.saved'));
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('profile.toast.saveFailed'));
    } finally {
      running.current = false;
      setSaving(false);
    }
  };

  return {
    profile,
    loading,
    failed,
    saving,
    fullName,
    nameError,
    changed: nameChanged(profile?.full_name ?? null, fullName),
    setFullName,
    save,
    reload: load,
  };
};
