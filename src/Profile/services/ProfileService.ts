import { supabase } from '@/integrations/supabase/client';
import { ProfileData, ProfileFormData } from '../types';

export class ProfileService {
  static async getProfile(userId: string): Promise<ProfileData> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateProfile(
    userId: string,
    formData: ProfileFormData
  ): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.fullName.trim() || null,
      })
      .eq('id', userId);

    if (error) throw error;
  }
}
