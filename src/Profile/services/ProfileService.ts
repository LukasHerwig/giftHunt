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
    // Validate that the name is not empty or just spaces
    const trimmedName = formData.fullName.trim();
    if (!trimmedName) {
      throw new Error('Name cannot be empty');
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: trimmedName,
      })
      .eq('id', userId);

    if (error) throw error;
  }
}
