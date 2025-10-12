import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const AuthTester = () => {
  const testInvalidToken = () => {
    // Corrupt the access token in localStorage
    const keys = Object.keys(localStorage);
    const supabaseKey = keys.find(
      (key) => key.includes('sb-') && key.includes('auth-token')
    );

    if (supabaseKey) {
      const session = JSON.parse(localStorage.getItem(supabaseKey) || '{}');
      if (session.access_token) {
        // Corrupt the token
        session.access_token = session.access_token + 'INVALID';
        localStorage.setItem(supabaseKey, JSON.stringify(session));
        toast.info('Token corrupted! Refresh page to test auth handling.');
      }
    }
  };

  const testExpiredToken = () => {
    // Set token expiry to past
    const keys = Object.keys(localStorage);
    const supabaseKey = keys.find(
      (key) => key.includes('sb-') && key.includes('auth-token')
    );

    if (supabaseKey) {
      const session = JSON.parse(localStorage.getItem(supabaseKey) || '{}');
      if (session.expires_at) {
        // Set expiry to 1 hour ago
        session.expires_at = Math.floor(Date.now() / 1000) - 3600;
        localStorage.setItem(supabaseKey, JSON.stringify(session));
        toast.info('Token expired! Refresh page to test auth handling.');
      }
    }
  };

  const clearAllAuth = () => {
    // Clear all auth data
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    toast.info('All auth data cleared! Refresh page.');
  };

  const forceValidation = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        toast.error(`Validation failed: ${error.message}`);
      } else {
        toast.success(`Validation successful: ${data.user?.email}`);
      }
    } catch (error) {
      toast.error(`Validation error: ${error}`);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg space-y-2 z-50">
      <h3 className="font-semibold text-sm">🧪 Auth Testing</h3>
      <div className="flex flex-col space-y-2">
        <Button onClick={testInvalidToken} variant="destructive" size="sm">
          Corrupt Token
        </Button>
        <Button onClick={testExpiredToken} variant="destructive" size="sm">
          Expire Token
        </Button>
        <Button onClick={clearAllAuth} variant="destructive" size="sm">
          Clear All Auth
        </Button>
        <Button onClick={forceValidation} variant="outline" size="sm">
          Test Validation
        </Button>
      </div>
    </div>
  );
};
