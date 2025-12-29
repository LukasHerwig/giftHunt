import { supabase } from '@/integrations/supabase/client';

export interface LinkMetadata {
  image: string | null;
  title: string | null;
}

/**
 * Fetches metadata (image, title) for a given URL using a Supabase Edge Function
 */
export const fetchLinkMetadata = async (
  url: string
): Promise<LinkMetadata | null> => {
  if (!url || !url.trim()) return null;

  try {
    const { data, error } = await supabase.functions.invoke(
      'get-link-metadata',
      {
        body: { url: url.trim() },
      }
    );

    if (error) {
      console.error('Error invoking get-link-metadata:', error);
      return null;
    }

    return data as LinkMetadata;
  } catch (error) {
    console.error('Failed to fetch link metadata:', error);
    return null;
  }
};
