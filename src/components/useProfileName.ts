import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/useAuth';

/** The signed-in person's name from their profile (sign-up stores none in the auth metadata). */
export const useProfileName = (): string | null => {
  const { user } = useAuth();
  const userId = user?.id;
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setName(data?.full_name ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return name;
};
