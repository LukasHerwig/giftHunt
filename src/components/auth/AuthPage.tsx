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
import GiftHuntIcon from '../GiftHuntIcon';

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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-ios-background">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="text-center space-y-2">
          <GiftHuntIcon className="mx-auto w-20 h-20 text-ios-blue" />
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            GiftHunt
          </h1>
          <p className="text-ios-gray text-lg">
            {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
          </p>
        </div>

        <div className="space-y-6">
          {/* Mode Toggle Buttons (iOS Segmented Control Style) */}
          <div className="p-[2px] bg-ios-tertiary/80 backdrop-blur-md rounded-[9px] flex shadow-inner">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-1.5 text-[13px] font-medium rounded-[7px] transition-all duration-200 ${
                isLogin
                  ? 'bg-ios-secondary dark:bg-ios-quaternary text-foreground shadow-sm'
                  : 'text-ios-gray hover:text-foreground'
              }`}
              disabled={loading}>
              {t('common.signIn')}
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-1.5 text-[13px] font-medium rounded-[7px] transition-all duration-200 ${
                !isLogin
                  ? 'bg-ios-secondary dark:bg-ios-quaternary text-foreground shadow-sm'
                  : 'text-ios-gray hover:text-foreground'
              }`}
              disabled={loading}>
              {t('common.signUp')}
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="bg-ios-secondary rounded-[10px] overflow-hidden">
              <div className="px-4">
                <input
                  type="email"
                  placeholder={t('common.email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 bg-transparent text-[17px] outline-none placeholder-[#C7C7CC] dark:placeholder-[#48484A]"
                  disabled={loading}
                />
              </div>
              <div className="h-[0.5px] bg-ios-separator ml-4"></div>
              <div className="px-4">
                <input
                  type="password"
                  placeholder={t('common.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 bg-transparent text-[17px] outline-none placeholder-[#C7C7CC] dark:placeholder-[#48484A]"
                  disabled={loading}
                />
              </div>
            </div>

            {!isLogin && (
              <p className="px-4 text-[13px] text-ios-gray">
                {t('auth.passwordRequirement')}
              </p>
            )}

            <button
              type="submit"
              className={`w-full h-12 rounded-[12px] text-[17px] font-semibold transition-all active:opacity-70 flex items-center justify-center ${
                isLogin ? 'bg-ios-blue text-white' : 'bg-ios-green text-white'
              } disabled:opacity-50`}
              disabled={loading}>
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLogin ? (
                t('auth.signInButton')
              ) : (
                t('auth.createAccountButton')
              )}
            </button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-ios-blue text-[17px] hover:underline"
              disabled={loading}>
              {isLogin ? t('auth.createNewAccount') : t('auth.signInInstead')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
