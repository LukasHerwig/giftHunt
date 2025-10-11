import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Gift, Loader2 } from 'lucide-react';
import LanguageSwitcher from '../LanguageSwitcher';

export const AuthPage = () => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error(t('auth.fillAllFields'));
      return;
    }

    if (password.length < 6) {
      toast.error(t('auth.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success(t('auth.welcomeBackSuccess'));
        navigate('/');
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) throw error;
        toast.success(t('auth.accountCreated'));
        navigate('/');
      }
    } catch (error: unknown) {
      toast.error((error as Error)?.message || t('auth.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl">WishList</CardTitle>
          <CardDescription className="text-base">
            {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder={t('common.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder={t('common.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 text-base"
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base bg-gradient-to-r from-primary to-accent hover:opacity-90"
              disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? t('auth.signingIn') : t('auth.creatingAccount')}
                </>
              ) : isLogin ? (
                t('auth.signInButton')
              ) : (
                t('auth.createAccountButton')
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors">
              {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
