import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { getBaseUrl } from '@/lib/urlUtils';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/gh/Segmented';
import { TextField } from '@/components/gh/TextField';
import { AccountHeading, AccountShell } from '@/components/AccountShell';
import {
  authErrorField,
  authErrorKey,
  validateAuthForm,
  type AuthErrorKey,
  type AuthFormErrors,
  type AuthMode,
} from '@/Auth/lib/authForm';

export const AuthPage = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(params.get('mode') === 'signup' ? 'signUp' : 'signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [loading, setLoading] = useState(false);

  const message = (key?: AuthErrorKey) => (key ? t(`auth.errors.${key}`) : undefined);
  const signingUp = mode === 'signUp';

  const changeMode = (next: string) => {
    setMode(next === 'signUp' ? 'signUp' : 'signIn');
    setErrors({});
  };

  // After a successful sign-in AuthProvider sends the person on (Home, or back to an invitation).
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;
    const found = validateAuthForm(mode, email, password);
    setErrors(found);
    if (found.email || found.password) return;

    setLoading(true);
    try {
      const address = email.trim();
      if (signingUp) {
        const { error } = await supabase.auth.signUp({
          email: address,
          password,
          options: { emailRedirectTo: `${getBaseUrl()}/` },
        });
        if (error) throw error;
        toast.success(t('auth.toast.accountCreated'));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: address, password });
        if (error) throw error;
        toast.success(t('auth.toast.welcomeBack'));
      }
    } catch (error) {
      console.error('Auth error:', error);
      const key = authErrorKey((error as Error)?.message);
      setErrors({ [authErrorField(key)]: key });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccountShell>
      <AccountHeading
        title={signingUp ? t('auth.titleSignUp') : t('auth.titleSignIn')}
        lead={signingUp ? t('auth.leadSignUp') : t('auth.leadSignIn')}
      />
      <Segmented
        ariaLabel={t('auth.modeLabel')}
        value={mode}
        onChange={changeMode}
        options={[
          { value: 'signIn', label: t('auth.signIn') },
          { value: 'signUp', label: t('auth.signUp') },
        ]}
      />
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <TextField
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          error={message(errors.email)}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          label={t('auth.password')}
          type="password"
          autoComplete={signingUp ? 'new-password' : 'current-password'}
          value={password}
          help={signingUp ? t('auth.passwordHelp') : undefined}
          error={message(errors.password)}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button
          type="submit"
          disabled={loading}
          className="h-[52px] w-full gap-2 rounded-gh-md text-[17px] font-semibold">
          {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
          {signingUp ? t('auth.signUp') : t('auth.signIn')}
        </Button>
      </form>
    </AccountShell>
  );
};
