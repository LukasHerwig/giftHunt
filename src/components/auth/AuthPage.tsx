import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { getBaseUrl } from '@/lib/urlUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Gift, Loader2, UserPlus, LogIn } from 'lucide-react';
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
        const redirectUrl = `${getBaseUrl()}/`;
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
        <CardContent className="space-y-6">
          {/* Mode Toggle Buttons */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsLogin(true)}
              className={`flex items-center gap-2 transition-all ${
                isLogin
                  ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                  : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
              }`}
              disabled={loading}>
              <LogIn className="w-4 h-4" />
              {t('common.signIn')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsLogin(false)}
              className={`flex items-center gap-2 transition-all ${
                !isLogin
                  ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                  : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
              }`}
              disabled={loading}>
              <UserPlus className="w-4 h-4" />
              {t('common.signUp')}
            </Button>
          </div>

          {/* Additional Context for Each Mode */}
          <div className="text-center">
            {isLogin ? (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">
                  {t('auth.welcomeBackTitle')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('auth.signInDescription')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">
                  {t('auth.createAccountTitle')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('auth.signUpDescription')}
                </p>
              </div>
            )}
          </div>

          <Separator />

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
              {!isLogin && (
                <p className="text-xs text-muted-foreground">
                  {t('auth.passwordRequirement')}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className={`w-full h-12 text-base font-semibold ${
                isLogin
                  ? 'bg-primary hover:bg-primary/90'
                  : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600'
              }`}
              disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? t('auth.signingIn') : t('auth.creatingAccount')}
                </>
              ) : (
                <>
                  {isLogin ? (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      {t('auth.signInButton')}
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      {t('auth.createAccountButton')}
                    </>
                  )}
                </>
              )}
            </Button>
          </form>

          {/* Additional Help Text */}
          {isLogin ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {t('auth.newUserQuestion')}{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="text-primary hover:text-primary/80 font-medium underline"
                  disabled={loading}>
                  {t('auth.createNewAccount')}
                </button>
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {t('auth.existingUserQuestion')}{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="text-primary hover:text-primary/80 font-medium underline"
                  disabled={loading}>
                  {t('auth.signInInstead')}
                </button>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
