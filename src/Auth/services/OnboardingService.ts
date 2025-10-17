import { supabase } from '@/integrations/supabase/client';

export class OnboardingService {
  /**
   * Check if a user needs to complete onboarding
   * Returns true if the user doesn't have a full_name set
   */
  static async checkIfOnboardingNeeded(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking profile:', error);
      // If there's an error getting profile, assume onboarding is needed
      return true;
    }

    // User needs onboarding if they don't have a name set
    return !data.full_name || data.full_name.trim() === '';
  }

  /**
   * Complete onboarding by updating the user's profile with their name
   */
  static async completeOnboarding(userId: string, name: string): Promise<void> {
    // Validate that the name is not empty or just spaces
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Name cannot be empty');
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: trimmedName,
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }
  }
}
