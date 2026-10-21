export type AuthMode = 'signIn' | 'signUp';

export type AuthErrorKey =
  | 'emailRequired'
  | 'emailInvalid'
  | 'passwordRequired'
  | 'passwordTooShort'
  | 'invalidCredentials'
  | 'alreadyRegistered'
  | 'emailNotConfirmed'
  | 'generic';

export interface AuthFormErrors {
  email?: AuthErrorKey;
  password?: AuthErrorKey;
}

export const PASSWORD_MIN = 6;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateAuthForm = (mode: AuthMode, email: string, password: string): AuthFormErrors => {
  const errors: AuthFormErrors = {};
  const address = email.trim();
  if (address === '') errors.email = 'emailRequired';
  else if (!EMAIL.test(address)) errors.email = 'emailInvalid';

  if (password === '') errors.password = 'passwordRequired';
  else if (mode === 'signUp' && password.length < PASSWORD_MIN) errors.password = 'passwordTooShort';
  return errors;
};

/** Supabase auth messages are English prose; map the few we can act on. */
export const authErrorKey = (message: string | undefined): AuthErrorKey => {
  const text = (message ?? '').toLowerCase();
  if (text.includes('invalid login credentials')) return 'invalidCredentials';
  if (text.includes('already registered')) return 'alreadyRegistered';
  if (text.includes('email not confirmed')) return 'emailNotConfirmed';
  return 'generic';
};

export const authErrorField = (key: AuthErrorKey): 'email' | 'password' =>
  key === 'alreadyRegistered' || key === 'emailNotConfirmed' ? 'email' : 'password';
