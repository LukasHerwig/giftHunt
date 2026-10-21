# Phase 6 – Account Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle and finish the account screens: sign in / sign up (`/auth`), first-time name (`/onboarding`), accept invitation (`/accept-invitation`, now accepting directly after sign-in), and Profile (`/profile`: name, theme, language, sign out). The header's avatar opens Profile; the dropdown menu is gone.

**Architecture:** No database change. Pure logic (name validation, auth form validation and error mapping, invitation outcome mapping, post-login path, member-since date, initials) is plain TypeScript with `node:test` unit tests. Screens are Tailwind with the `gh-*` tokens, built on the existing `gh/TextField`, `gh/Segmented`, `gh/SectionHeader`, `gh/EmptyState` and `ui/button`. One small shared frame (`AccountShell`) holds the wordmark and a centred column for the screens before sign-in. `AuthProvider` owns where to go after sign-in (Home, or back to a pending invitation); the Accept screen calls the existing `accept_invitation` RPC itself and opens the list.

**Tech Stack:** React 18 + TypeScript, react-router-dom, react-i18next, sonner, Tailwind (`gh-*`), Supabase JS, `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-20-ui-redesign-design.md` section 1 (rows `/auth`, `/onboarding`, `/accept-invitation`, `/profile`; the app frame). Approved design: https://claude.ai/artifact/55y11MkuWVCCyYvWMHBTEb (12 boards: sign in, sign up, sign-in error, first-time name, invitation signed out / no longer valid / wrong account, Profile light / dark / loading, desktop sign-in, desktop Profile). Decisions made while approving it: **Logga ut** sits at the bottom of Profile as a quiet secondary button with no confirmation; the wrong-account page names the signed-in account but never the address the invitation went to; the header is the wordmark plus an avatar that opens Profile (Profile has a back button and the title).

## Global Constraints

- Never hardcode user-facing strings: keys in `src/locales/en.json` and `sv.json`, through `useTranslation()` (non-React code uses `i18n.t` from `@/lib/i18n`). Swedish copy per the canvas; never gendered (pronouns are unknown).
- Only `gh-*` Tailwind tokens; one primary button per screen state; touch targets ≥ 44px; text ≥ 12px; components defined at module top level (never inside another component's render).
- Pure logic imports types with `import type` and `.ts` extensions in relative imports so `node --test` runs it.
- Generated links use `getBaseUrl()` (only the sign-up e-mail redirect here; keep it).
- Nothing under `src/**` may read the person's name from `user.user_metadata`: sign-up stores none; the name lives in `profiles.full_name`.
- The pending invitation token (`sessionStorage` key `pendingInvitationToken`) is removed only when the invitation is accepted or found no longer valid, never when the person must still sign in or switch account.
- Baselines before this phase: unit tests 86, `tsc` 0 errors, `npm run lint` 10 problems (3 errors, 7 warnings), db tests 21 files / 213 tests (untouched by this phase). Lint and tsc must not get worse.

## Review Focus

- **Accepting with the wrong account** never accepts and never reveals the invited address; the person can sign out and come back to the same invitation. (Task 6 `acceptProblem` tests; Task 7 browser)
- **Accept runs once:** React StrictMode's double effect, a second tap on retry, or reopening the link after success must not accept twice or flash "gäller inte längre" over a success. (Task 6 hook guard; Task 7 browser)
- **Pending invitation survives the whole trip** sign-in → (onboarding for a new account) → accept, and is cleared afterwards, so a later plain sign-in goes to Home. (Task 1 `postLoginPath` test; Tasks 4, 5, 6; Task 7 browser)
- **Names:** whitespace-only is refused on Profile and Onboarding; a saved name is trimmed; the header avatar and the Home greeting follow the profile name. (Task 1 tests; Task 7 browser)
- **Theme and language** apply at once and survive a reload. (Task 7 browser)
- **Every `auth.*`, `onboarding.*`, `acceptInvitation.*`, `profile.*` key used exists in both languages**, and no old key of these sections is still referenced. (Task 7 script)

## File structure

| File | Responsibility |
|---|---|
| `src/lib/personName.ts` (+test) | `validateName`, `nameChanged`, `initials` |
| `src/Auth/lib/authForm.ts` (+test) | Sign-in/up form validation, error key mapping |
| `src/Auth/lib/postLoginPath.ts` (+test) | Where to go after sign-in |
| `src/AcceptInvitation/lib/invitation.ts` (+test) | Token and accept outcome mapping, invitation view data |
| `src/Profile/lib/memberSince.ts` (+test) | "Medlem sedan" date |
| `src/components/useProfileName.ts` | The signed-in person's profile name |
| `src/components/AppHeader.tsx` | Wordmark, avatar → `/profile`; optional back + title; optional no avatar |
| `src/components/AccountShell.tsx` | Wordmark + centred column; `AccountHeading` |
| `src/Profile/*` | Page, `useProfile`, `AboutSection`, `ProfileLoading` |
| `src/components/auth/AuthPage.tsx`, `AuthProvider.tsx`, `src/Auth/hooks/useAuth.ts`, `src/Auth/services/AuthService.ts` | Sign-in screen and post-login routing |
| `src/Auth/components/OnboardingStep.tsx`, `AuthLoadingState.tsx`, `src/Onboarding/index.tsx` | First-time name |
| `src/AcceptInvitation/*` | Direct accept, prompt and problem screens |
| `src/locales/{en,sv}.json` | `auth`, `onboarding`, `acceptInvitation`, `profile` sections replaced |
| `CLAUDE.md`, feature `README.md` files | Docs |

---

### Task 1: Pure logic with unit tests

**Files:**
- Create: `src/lib/personName.ts`, `src/lib/personName.test.ts`
- Create: `src/Auth/lib/authForm.ts`, `src/Auth/lib/authForm.test.ts`
- Create: `src/Auth/lib/postLoginPath.ts`, `src/Auth/lib/postLoginPath.test.ts`
- Create: `src/AcceptInvitation/lib/invitation.ts`, `src/AcceptInvitation/lib/invitation.test.ts`
- Create: `src/Profile/lib/memberSince.ts`, `src/Profile/lib/memberSince.test.ts`

**Interfaces:**
- Produces: `NAME_MAX = 100`, `type NameError = 'required' | 'tooLong'`, `validateName(name: string): NameError | null`, `nameChanged(saved: string | null, input: string): boolean`, `initials(fullName, email): string`; `type AuthMode = 'signIn' | 'signUp'`, `type AuthErrorKey`, `interface AuthFormErrors { email?: AuthErrorKey; password?: AuthErrorKey }`, `validateAuthForm(mode, email, password): AuthFormErrors`, `authErrorKey(message: string | undefined): AuthErrorKey`, `authErrorField(key): 'email' | 'password'`; `postLoginPath(pendingToken: string | null): string`; `type InvitationProblem`, `tokenProblem(invitation, now)`, `acceptProblem(code)`, `toInvitationData(raw)`, types `InvitationQueryResult`, `InvitationData`; `formatMemberSince(createdAt: string, locale: string): string`.

- [ ] **Step 1: Write the failing tests**

`src/lib/personName.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NAME_MAX, initials, nameChanged, validateName } from './personName.ts';

test('a name is required, whitespace does not count', () => {
  assert.equal(validateName(''), 'required');
  assert.equal(validateName('   '), 'required');
});

test('a name over the limit is refused', () => {
  assert.equal(validateName('a'.repeat(NAME_MAX + 1)), 'tooLong');
  assert.equal(validateName('a'.repeat(NAME_MAX)), null);
});

test('a normal name is valid, surrounding spaces ignored', () => {
  assert.equal(validateName(' Erik Berg '), null);
});

test('nameChanged compares the trimmed name with the saved one', () => {
  assert.equal(nameChanged(null, ''), false);
  assert.equal(nameChanged('Erik', 'Erik '), false);
  assert.equal(nameChanged('Erik', 'Erika'), true);
  assert.equal(nameChanged(null, 'Erik'), true);
});

test('initials come from the first two words of the name', () => {
  assert.equal(initials('Erik Berg', 'e@x.se'), 'EB');
  assert.equal(initials('Anna Lind Ek', null), 'AL');
  assert.equal(initials('  maria  ', 'm@x.se'), 'M');
});

test('initials fall back to the e-mail, then to nothing', () => {
  assert.equal(initials(null, 'e@x.se'), 'E');
  assert.equal(initials('', '  z@x.se'), 'Z');
  assert.equal(initials(undefined, undefined), '');
});
```

`src/Auth/lib/authForm.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authErrorField, authErrorKey, validateAuthForm } from './authForm.ts';

test('an empty e-mail is required, whitespace does not count', () => {
  assert.equal(validateAuthForm('signIn', '', 'secret1').email, 'emailRequired');
  assert.equal(validateAuthForm('signIn', '   ', 'secret1').email, 'emailRequired');
});

test('an e-mail without an @ and a dot is invalid', () => {
  assert.equal(validateAuthForm('signIn', 'erik', 'secret1').email, 'emailInvalid');
  assert.equal(validateAuthForm('signIn', 'erik@x', 'secret1').email, 'emailInvalid');
  assert.equal(validateAuthForm('signIn', ' erik@x.se ', 'secret1').email, undefined);
});

test('an empty password is required in both modes', () => {
  assert.equal(validateAuthForm('signIn', 'e@x.se', '').password, 'passwordRequired');
  assert.equal(validateAuthForm('signUp', 'e@x.se', '').password, 'passwordRequired');
});

test('a short password is refused when signing up, not when signing in', () => {
  assert.equal(validateAuthForm('signUp', 'e@x.se', '12345').password, 'passwordTooShort');
  assert.equal(validateAuthForm('signUp', 'e@x.se', '123456').password, undefined);
  assert.equal(validateAuthForm('signIn', 'e@x.se', '12345').password, undefined);
});

test('a valid form has no errors', () => {
  assert.deepEqual(validateAuthForm('signIn', 'e@x.se', 'secret1'), {});
});

test('server messages map to an error key', () => {
  assert.equal(authErrorKey('Invalid login credentials'), 'invalidCredentials');
  assert.equal(authErrorKey('User already registered'), 'alreadyRegistered');
  assert.equal(authErrorKey('Email not confirmed'), 'emailNotConfirmed');
  assert.equal(authErrorKey('boom'), 'generic');
  assert.equal(authErrorKey(undefined), 'generic');
});

test('an error shows under the field it is about', () => {
  assert.equal(authErrorField('alreadyRegistered'), 'email');
  assert.equal(authErrorField('emailNotConfirmed'), 'email');
  assert.equal(authErrorField('invalidCredentials'), 'password');
  assert.equal(authErrorField('generic'), 'password');
});
```

`src/Auth/lib/postLoginPath.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { postLoginPath } from './postLoginPath.ts';

test('without a pending invitation the person goes Home', () => {
  assert.equal(postLoginPath(null), '/');
});

test('with a pending invitation the person goes back to it, token encoded', () => {
  assert.equal(postLoginPath('abc'), '/accept-invitation?token=abc');
  assert.equal(postLoginPath('a b&c'), '/accept-invitation?token=a%20b%26c');
});
```

`src/AcceptInvitation/lib/invitation.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acceptProblem, toInvitationData, tokenProblem } from './invitation.ts';
import type { InvitationQueryResult } from './invitation.ts';

const raw = (over: Partial<InvitationQueryResult> = {}): InvitationQueryResult => ({
  id: 'i1',
  email: 'e@x.se',
  accepted: false,
  expires_at: null,
  invited_by: 'u1',
  wishlist_id: 'w1',
  wishlist_title: ' Annas jul ',
  wishlist_description: null,
  inviter_email: 'anna@x.se',
  inviter_full_name: 'Anna Lind',
  ...over,
});

const now = new Date('2026-10-21T12:00:00Z');

test('a missing, accepted or expired invitation is gone', () => {
  assert.equal(tokenProblem(null, now), 'gone');
  assert.equal(tokenProblem(raw({ accepted: true }), now), 'gone');
  assert.equal(tokenProblem(raw({ expires_at: '2026-10-20T00:00:00Z' }), now), 'gone');
});

test('an open invitation has no problem, with or without an expiry', () => {
  assert.equal(tokenProblem(raw(), now), null);
  assert.equal(tokenProblem(raw({ expires_at: '2026-10-28T00:00:00Z' }), now), null);
});

test('accept errors map to what the person sees', () => {
  assert.equal(acceptProblem('invitation_not_found'), 'wrongAccount');
  for (const code of ['already_accepted', 'invitation_expired', 'admin_already_exists', 'owner_cannot_be_admin']) {
    assert.equal(acceptProblem(code), 'gone');
  }
  assert.equal(acceptProblem('email_not_confirmed'), 'unconfirmed');
  assert.equal(acceptProblem(''), 'failed');
  assert.equal(acceptProblem('something else'), 'failed');
});

test('invitation data names the inviter by full name, trimmed title', () => {
  assert.deepEqual(toInvitationData(raw()), { id: 'i1', wishlistId: 'w1', title: 'Annas jul', inviterName: 'Anna Lind' });
});

test('the inviter falls back to the e-mail, then to nobody', () => {
  assert.equal(toInvitationData(raw({ inviter_full_name: ' ' })).inviterName, 'anna@x.se');
  assert.equal(toInvitationData(raw({ inviter_full_name: null, inviter_email: null })).inviterName, null);
  assert.equal(toInvitationData(raw({ wishlist_title: null })).title, '');
});
```

`src/Profile/lib/memberSince.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatMemberSince } from './memberSince.ts';

test('the date is written in the chosen language', () => {
  assert.equal(formatMemberSince('2026-10-12T10:00:00Z', 'sv'), '12 oktober 2026');
  assert.equal(formatMemberSince('2026-10-12T10:00:00Z', 'en'), 'October 12, 2026');
});

test('the day does not depend on the time zone of the machine', () => {
  assert.equal(formatMemberSince('2026-10-12T00:30:00Z', 'sv'), '12 oktober 2026');
  assert.equal(formatMemberSince('2026-10-12T23:30:00Z', 'sv'), '12 oktober 2026');
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm run test:unit 2>&1 | grep -E "ℹ (tests|pass|fail)|Cannot find module" | head -8`
Expected: FAIL with `Cannot find module` for the five new modules (the 86 existing tests are unaffected).

- [ ] **Step 3: Implement**

`src/lib/personName.ts`:
```ts
export const NAME_MAX = 100;

export type NameError = 'required' | 'tooLong';

export const validateName = (name: string): NameError | null => {
  const trimmed = name.trim();
  if (trimmed === '') return 'required';
  if (trimmed.length > NAME_MAX) return 'tooLong';
  return null;
};

export const nameChanged = (saved: string | null, input: string): boolean =>
  input.trim() !== (saved ?? '').trim();

/** One or two capital letters for an avatar: from the name, else the first letter of the e-mail. */
export const initials = (
  fullName: string | null | undefined,
  email: string | null | undefined,
): string => {
  const name = fullName?.trim();
  if (name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }
  return email?.trim()[0]?.toUpperCase() ?? '';
};
```

`src/Auth/lib/authForm.ts`:
```ts
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
```

`src/Auth/lib/postLoginPath.ts`:
```ts
/** Where to go after signing in: back to a pending invitation, else Home. */
export const postLoginPath = (pendingToken: string | null): string =>
  pendingToken ? `/accept-invitation?token=${encodeURIComponent(pendingToken)}` : '/';
```

`src/AcceptInvitation/lib/invitation.ts`:
```ts
/** What `get_invitation_by_token` returns (null when no invitation has the token). Moves to `../types.ts` in Task 6. */
export interface InvitationQueryResult {
  id: string;
  email: string;
  accepted: boolean;
  expires_at: string | null;
  invited_by: string;
  wishlist_id: string;
  wishlist_title: string | null;
  wishlist_description: string | null;
  inviter_email: string | null;
  inviter_full_name: string | null;
}

export interface InvitationData {
  id: string;
  wishlistId: string;
  title: string;
  inviterName: string | null;
}

export type InvitationProblem = 'gone' | 'wrongAccount' | 'unconfirmed' | 'failed';

/** A missing, already accepted or expired invitation can no longer be used. */
export const tokenProblem = (
  invitation: Pick<InvitationQueryResult, 'accepted' | 'expires_at'> | null,
  now: Date,
): InvitationProblem | null => {
  if (!invitation) return 'gone';
  if (invitation.accepted) return 'gone';
  if (invitation.expires_at && new Date(invitation.expires_at) < now) return 'gone';
  return null;
};

/** `invitation_not_found` after the token resolved means it is addressed to someone else. */
export const acceptProblem = (code: string): InvitationProblem => {
  switch (code) {
    case 'invitation_not_found':
      return 'wrongAccount';
    case 'already_accepted':
    case 'invitation_expired':
    case 'admin_already_exists':
    case 'owner_cannot_be_admin':
      return 'gone';
    case 'email_not_confirmed':
      return 'unconfirmed';
    default:
      return 'failed';
  }
};

export const toInvitationData = (raw: InvitationQueryResult): InvitationData => ({
  id: raw.id,
  wishlistId: raw.wishlist_id,
  title: raw.wishlist_title?.trim() ?? '',
  inviterName: raw.inviter_full_name?.trim() || raw.inviter_email?.trim() || null,
});
```

`src/Profile/lib/memberSince.ts`:
```ts
/** "12 oktober 2026". Written in UTC so the day never depends on the machine's time zone. */
export const formatMemberSince = (createdAt: string, locale: string): string =>
  new Date(createdAt).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
```

- [ ] **Step 4: Run to verify they pass, then commit**

Run: `npm run test:unit 2>&1 | grep -E "ℹ (tests|pass|fail)"; npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -E "error TS" | cut -c1-200`
Expected: 108 tests (86 + 22), 108 pass, 0 fail; tsc prints nothing (the new interfaces live in `invitation.ts` for now so the old `AcceptInvitation` screens, which still import `src/AcceptInvitation/types.ts`, keep compiling until Task 6 rewrites them).

```bash
git add src/lib/personName.ts src/lib/personName.test.ts src/Auth/lib src/AcceptInvitation/lib src/Profile/lib
git commit -m "feat(account): pure logic for names, auth form, invitation outcomes, post-login path"
```

---

### Task 2: App header with avatar to Profile, and the account shell

**Files:**
- Create: `src/components/useProfileName.ts`, `src/components/AccountShell.tsx`
- Modify: `src/components/AppHeader.tsx` (replaced)

**Interfaces:**
- Consumes: `initials` (Task 1), `useAuth` (`@/components/auth/useAuth`).
- Produces: `AppHeader({ title?, hideAvatar? })` (default export, existing callers pass nothing); `useProfileName(): string | null`; `AccountShell({ children })` and `AccountHeading({ title, lead? })` (named exports).

- [ ] **Step 1: The profile-name hook** `src/components/useProfileName.ts`

```ts
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/useAuth';

/** The signed-in person's name from their profile (sign-up stores none in the auth metadata). */
export const useProfileName = (): string | null => {
  const { user } = useAuth();
  const userId = user?.id;
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setName(data?.full_name ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return name;
};
```

- [ ] **Step 2: The header** `src/components/AppHeader.tsx` (replace the whole file)

```tsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, User } from 'lucide-react';
import { useAuth } from '@/components/auth/useAuth';
import { useProfileName } from '@/components/useProfileName';
import { initials } from '@/lib/personName';

const ProfileAvatar = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const name = useProfileName();
  const label = initials(name, user?.email);
  return (
    <Link
      to="/profile"
      aria-label={t('common.profile')}
      className="flex h-11 w-11 items-center justify-center rounded-gh-pill bg-gh-primary-tint text-[15px] font-semibold text-gh-primary-strong transition-transform active:scale-[0.97]">
      {label || <User className="h-5 w-5" aria-hidden="true" />}
    </Link>
  );
};

interface AppHeaderProps {
  /** A page title with a back button to Home instead of the wordmark (Profile). */
  title?: string;
  /** No avatar, for the screen before the person has a name (onboarding). */
  hideAvatar?: boolean;
}

const AppHeader = ({ title, hideAvatar = false }: AppHeaderProps) => {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gh-line bg-gh-surface-100/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4">
        {title ? (
          <div className="flex items-center gap-1">
            <Link
              to="/"
              aria-label={t('common.back')}
              className="-ml-2 flex h-11 w-11 items-center justify-center rounded-gh-pill text-gh-ink">
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </Link>
            <h1 className="text-[20px] font-bold leading-6 tracking-[-0.3px] text-gh-ink">{title}</h1>
          </div>
        ) : (
          <Link
            to="/"
            className="rounded-gh-sm font-brand text-[22px] font-semibold leading-none tracking-[-0.3px] text-gh-ink">
            GiftHunt
          </Link>
        )}
        {!hideAvatar && <ProfileAvatar />}
      </div>
    </header>
  );
};

export default AppHeader;
```

- [ ] **Step 3: The shell** `src/components/AccountShell.tsx`

```tsx
import type { ReactNode } from 'react';

/** The frame for screens before sign-in: the wordmark and one centred column. */
export const AccountShell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-gh-bg pb-safe text-gh-ink">
    <div className="mx-auto flex w-full max-w-[440px] flex-col gap-8 px-4 pb-10 pt-12 md:pt-24">
      <div className="font-brand text-[32px] font-semibold leading-9">GiftHunt</div>
      {children}
    </div>
  </div>
);

/** The page heading and its one-line lead. */
export const AccountHeading = ({ title, lead }: { title: string; lead?: string }) => (
  <div className="flex flex-col gap-2">
    <h1 className="text-[32px] font-bold leading-9 tracking-[-0.8px] text-gh-ink">{title}</h1>
    {lead && <p className="text-[16px] leading-6 text-gh-ink-2">{lead}</p>}
  </div>
);
```

- [ ] **Step 4: Check and commit**

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"; npm run lint 2>&1 | grep -E "src/components/(AppHeader|AccountShell|useProfileName)|problems"`
Expected: `0`; no lint problem in these files; total still 10 problems. Check that `common.back` and `common.profile` exist in both locale files: `grep -c '"back"' src/locales/*.json`.

```bash
git add src/components/useProfileName.ts src/components/AppHeader.tsx src/components/AccountShell.tsx
git commit -m "feat(account): header avatar opens Profile; shared account shell"
```

---

### Task 3: Profile

**Files:**
- Modify: `src/Profile/index.tsx`, `src/Profile/hooks/useProfile.ts`, `src/Profile/types/index.ts` (all replaced)
- Create: `src/Profile/components/AboutSection.tsx`, `src/Profile/components/ProfileLoading.tsx`
- Modify: `src/Profile/components/index.ts` (replaced)
- Delete: `src/Profile/components/PersonalInformationCard.tsx`, `ProfileLoadingState.tsx`, `ProfileNotFoundState.tsx`
- Modify: `src/locales/en.json`, `src/locales/sv.json` (`profile` section replaced)

**Interfaces:**
- Consumes: `validateName`, `nameChanged`, `NameError` (Task 1), `formatMemberSince` (Task 1), `AppHeader({ title })` (Task 2), `useTheme` (`@/contexts/ThemeContext`), `useAuth().signOut`.
- Produces: the `/profile` page; locale keys `profile.*` below.

- [ ] **Step 1: Locale keys.** Replace the `profile` section of both files:

```bash
python3 -I - <<'EOF'
import json
def put(lang, section, value):
    p = f'src/locales/{lang}.json'
    d = json.load(open(p))
    d[section] = value
    open(p, 'w').write(json.dumps(d, indent=2, ensure_ascii=False) + '\n')

put('en', 'profile', {
  "title": "Profile",
  "sectionAbout": "About you",
  "name": "Name",
  "namePlaceholder": "First and last name",
  "email": "Email",
  "emailHelp": "The email address can't be changed.",
  "save": "Save name",
  "errors": {
    "required": "Enter your name.",
    "tooLong": "The name can be at most 100 characters."
  },
  "sectionAppearance": "Appearance",
  "themeLight": "Light",
  "themeDark": "Dark",
  "themeSystem": "Match device",
  "sectionLanguage": "Language",
  "languageSv": "Svenska",
  "languageEn": "English",
  "memberSince": "Member since {{date}}",
  "signOut": "Sign out",
  "loading": "Loading your profile",
  "loadFailed": "Couldn't load your profile.",
  "retry": "Try again",
  "toast": {
    "saved": "Name saved",
    "saveFailed": "Couldn't save your name. Try again."
  }
})
put('sv', 'profile', {
  "title": "Profil",
  "sectionAbout": "Om dig",
  "name": "Namn",
  "namePlaceholder": "För- och efternamn",
  "email": "E-post",
  "emailHelp": "E-postadressen kan inte ändras.",
  "save": "Spara namn",
  "errors": {
    "required": "Fyll i ditt namn.",
    "tooLong": "Namnet får vara högst 100 tecken."
  },
  "sectionAppearance": "Utseende",
  "themeLight": "Ljust",
  "themeDark": "Mörkt",
  "themeSystem": "Följ enheten",
  "sectionLanguage": "Språk",
  "languageSv": "Svenska",
  "languageEn": "English",
  "memberSince": "Medlem sedan {{date}}",
  "signOut": "Logga ut",
  "loading": "Laddar din profil",
  "loadFailed": "Profilen kunde inte laddas.",
  "retry": "Försök igen",
  "toast": {
    "saved": "Namnet är sparat",
    "saveFailed": "Namnet kunde inte sparas. Försök igen."
  }
})
EOF
git diff --stat src/locales | tail -1
```
Expected: only the `profile` blocks changed (the diff stat shows two files; skim `git diff src/locales | grep '^[-+]' | grep -v profile | head` is not needed because the section order is kept).

- [ ] **Step 2: Types and hook.** `src/Profile/types/index.ts` (replace):

```ts
export interface ProfileData {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export interface ProfileFormData {
  fullName: string;
}
```

`src/Profile/hooks/useProfile.ts` (replace):
```ts
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/useAuth';
import { nameChanged, validateName, type NameError } from '@/lib/personName';
import { ProfileService } from '../services/ProfileService';
import type { ProfileData } from '../types';

export const useProfile = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullNameState] = useState('');
  const [nameError, setNameError] = useState<NameError | null>(null);
  // A second tap while saving must not start a second save.
  const running = useRef(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const loaded = await ProfileService.getProfile(userId);
      setProfile(loaded);
      setFullNameState(loaded.full_name ?? '');
      setFailed(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error(t('profile.loadFailed'));
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const setFullName = (value: string) => {
    setFullNameState(value);
    setNameError(null);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!userId || running.current) return;
    const invalid = validateName(fullName);
    setNameError(invalid);
    if (invalid) return;

    running.current = true;
    setSaving(true);
    try {
      await ProfileService.updateProfile(userId, { fullName });
      const saved = fullName.trim();
      setProfile((current) => (current ? { ...current, full_name: saved } : current));
      setFullNameState(saved);
      toast.success(t('profile.toast.saved'));
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('profile.toast.saveFailed'));
    } finally {
      running.current = false;
      setSaving(false);
    }
  };

  return {
    profile,
    loading,
    failed,
    saving,
    fullName,
    nameError,
    changed: nameChanged(profile?.full_name ?? null, fullName),
    setFullName,
    save,
    reload: load,
  };
};
```

- [ ] **Step 3: Components.** `src/Profile/components/AboutSection.tsx`:

```tsx
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/gh/SectionHeader';
import { TextField } from '@/components/gh/TextField';
import type { NameError } from '@/lib/personName';

interface AboutSectionProps {
  email: string;
  fullName: string;
  error: NameError | null;
  changed: boolean;
  saving: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}

export const AboutSection = ({ email, fullName, error, changed, saving, onChange, onSubmit }: AboutSectionProps) => {
  const { t } = useTranslation();
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <SectionHeader title={t('profile.sectionAbout')} />
      <TextField
        label={t('profile.name')}
        value={fullName}
        autoComplete="name"
        placeholder={t('profile.namePlaceholder')}
        error={error ? t(`profile.errors.${error}`) : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      <TextField label={t('profile.email')} value={email} readOnly disabled help={t('profile.emailHelp')} />
      <div>
        <Button
          type="submit"
          disabled={!changed || saving}
          className="h-[52px] w-full gap-2 rounded-gh-md px-6 text-[17px] font-semibold md:w-auto">
          {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
          {t('profile.save')}
        </Button>
      </div>
    </form>
  );
};
```

`src/Profile/components/ProfileLoading.tsx`:
```tsx
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';

export const ProfileLoading = () => {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-label={t('profile.loading')}
      className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 pb-10 pt-6 md:px-8 md:pt-12">
      <Skeleton className="h-6 w-2/5 bg-gh-surface-300" />
      <Skeleton className="h-[52px] w-full rounded-gh-md bg-gh-surface-300" />
      <Skeleton className="h-[52px] w-full rounded-gh-md bg-gh-surface-300" />
      <Skeleton className="h-6 w-2/5 bg-gh-surface-300" />
      <Skeleton className="h-12 w-full rounded-gh-md bg-gh-surface-300" />
    </div>
  );
};
```

`src/Profile/components/index.ts` (replace):
```ts
export { AboutSection } from './AboutSection';
export { ProfileLoading } from './ProfileLoading';
```

Delete the three old components: `git rm -q src/Profile/components/PersonalInformationCard.tsx src/Profile/components/ProfileLoadingState.tsx src/Profile/components/ProfileNotFoundState.tsx`.

- [ ] **Step 4: The page** `src/Profile/index.tsx` (replace)

```tsx
import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { useAuth } from '@/components/auth/useAuth';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/gh/EmptyState';
import { SectionHeader } from '@/components/gh/SectionHeader';
import { Segmented } from '@/components/gh/Segmented';
import { useTheme, type Mode } from '@/contexts/ThemeContext';
import { AboutSection, ProfileLoading } from './components';
import { useProfile } from './hooks/useProfile';
import { formatMemberSince } from './lib/memberSince';

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { signOut } = useAuth();
  const { theme, setMode } = useTheme();
  const page = useProfile();
  const language = i18n.language?.startsWith('sv') ? 'sv' : 'en';

  return (
    <div className="min-h-screen bg-gh-bg pb-safe text-gh-ink">
      <AppHeader title={t('profile.title')} />
      {page.loading ? (
        <ProfileLoading />
      ) : page.failed || !page.profile ? (
        <EmptyState
          icon={User}
          size="screen"
          title={t('profile.loadFailed')}
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => void page.reload()}
              className="h-12 rounded-gh-md px-6 text-[16px] font-semibold">
              {t('profile.retry')}
            </Button>
          }
        />
      ) : (
        <main className="mx-auto flex w-full max-w-[720px] flex-col gap-8 px-4 pb-10 pt-6 md:gap-10 md:px-8 md:pt-12">
          <AboutSection
            email={page.profile.email}
            fullName={page.fullName}
            error={page.nameError}
            changed={page.changed}
            saving={page.saving}
            onChange={page.setFullName}
            onSubmit={page.save}
          />

          <div className="grid gap-8 md:grid-cols-2 md:gap-6">
            <section className="flex flex-col gap-3">
              <SectionHeader title={t('profile.sectionAppearance')} />
              <Segmented
                ariaLabel={t('profile.sectionAppearance')}
                value={theme.mode}
                onChange={(value) => setMode(value as Mode)}
                options={[
                  { value: 'light', label: t('profile.themeLight') },
                  { value: 'dark', label: t('profile.themeDark') },
                  { value: 'system', label: t('profile.themeSystem') },
                ]}
              />
            </section>
            <section className="flex flex-col gap-3">
              <SectionHeader title={t('profile.sectionLanguage')} />
              <Segmented
                ariaLabel={t('profile.sectionLanguage')}
                value={language}
                onChange={(value) => void i18n.changeLanguage(value)}
                options={[
                  { value: 'sv', label: t('profile.languageSv') },
                  { value: 'en', label: t('profile.languageEn') },
                ]}
              />
            </section>
          </div>

          <div className="flex flex-col gap-4 border-t border-gh-line pt-6 md:flex-row md:items-center md:justify-between">
            <p className="text-[13px] leading-[18px] text-gh-muted">
              {t('profile.memberSince', { date: formatMemberSince(page.profile.created_at, language) })}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void signOut()}
              className="h-[52px] w-full rounded-gh-md px-6 text-[16px] font-semibold md:w-auto">
              {t('profile.signOut')}
            </Button>
          </div>
        </main>
      )}
    </div>
  );
};

export default Profile;
```

- [ ] **Step 5: Check and commit**

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -E "error TS" | cut -c1-200; npm run lint 2>&1 | grep -E "src/Profile|problems"; npm run build 2>&1 | tail -1`
Expected: tsc nothing; no lint problem under `src/Profile` (total 10); build succeeds. If `ThemeContext` does not export `Mode` as a type, it does (`export type Mode`); import with `type Mode` inline as shown.

```bash
git add src/Profile src/locales/en.json src/locales/sv.json
git commit -m "feat(profile): name, theme, language and sign out on one page"
```

---

### Task 4: Sign in / sign up and post-login routing

**Files:**
- Modify: `src/components/auth/AuthPage.tsx` (replaced), `src/components/auth/AuthProvider.tsx`, `src/Auth/hooks/useAuth.ts`, `src/Auth/services/AuthService.ts`, `src/Auth/components/AuthLoadingState.tsx` (replaced)
- Modify: `src/locales/en.json`, `src/locales/sv.json` (`auth` section replaced)

**Interfaces:**
- Consumes: `validateAuthForm`, `authErrorKey`, `authErrorField`, `AuthMode`, `AuthErrorKey`, `AuthFormErrors`, `postLoginPath` (Task 1), `AccountShell`, `AccountHeading` (Task 2).
- Produces: `AuthService.setPendingInvitationToken(token)`; the `/auth` screen reads `?mode=signup`; after sign-in the person goes to `postLoginPath(AuthService.getPendingInvitationToken())`; `auth.signedOut` and `auth.sessionExpired` keys for `AuthProvider`.

- [ ] **Step 1: Locale keys.** Replace the `auth` section:

```bash
python3 -I - <<'EOF'
import json
def put(lang, section, value):
    p = f'src/locales/{lang}.json'
    d = json.load(open(p))
    d[section] = value
    open(p, 'w').write(json.dumps(d, indent=2, ensure_ascii=False) + '\n')

put('en', 'auth', {
  "titleSignIn": "Welcome back",
  "titleSignUp": "Create your account",
  "leadSignIn": "Sign in to see and share your wishlists.",
  "leadSignUp": "Make wishlists and share them with the people who want to give.",
  "modeLabel": "Sign in or create an account",
  "signIn": "Sign in",
  "signUp": "Create account",
  "email": "Email",
  "emailPlaceholder": "name@example.com",
  "password": "Password",
  "passwordHelp": "At least 6 characters.",
  "errors": {
    "emailRequired": "Enter your email address.",
    "emailInvalid": "That email address doesn't look right. Check it.",
    "passwordRequired": "Enter a password.",
    "passwordTooShort": "The password must be at least 6 characters.",
    "invalidCredentials": "The email or password is wrong. Check them and try again.",
    "alreadyRegistered": "An account with this address already exists. Sign in instead.",
    "emailNotConfirmed": "Confirm your email address first. We have sent you an email.",
    "generic": "Something went wrong. Try again."
  },
  "toast": {
    "welcomeBack": "Welcome back",
    "accountCreated": "Account created"
  },
  "signedOut": "You are signed out",
  "sessionExpired": "Your session expired. Sign in again.",
  "signOutFailed": "Couldn't sign you out. Try again."
})
put('sv', 'auth', {
  "titleSignIn": "Välkommen tillbaka",
  "titleSignUp": "Skapa ditt konto",
  "leadSignIn": "Logga in för att se och dela dina önskelistor.",
  "leadSignUp": "Gör önskelistor och dela dem med dem som vill ge.",
  "modeLabel": "Logga in eller skapa konto",
  "signIn": "Logga in",
  "signUp": "Skapa konto",
  "email": "E-post",
  "emailPlaceholder": "namn@exempel.se",
  "password": "Lösenord",
  "passwordHelp": "Minst 6 tecken.",
  "errors": {
    "emailRequired": "Fyll i din e-postadress.",
    "emailInvalid": "E-postadressen ser inte rätt ut. Kontrollera den.",
    "passwordRequired": "Fyll i ett lösenord.",
    "passwordTooShort": "Lösenordet måste vara minst 6 tecken.",
    "invalidCredentials": "E-postadressen eller lösenordet stämmer inte. Kontrollera dem och försök igen.",
    "alreadyRegistered": "Det finns redan ett konto med den här adressen. Logga in i stället.",
    "emailNotConfirmed": "Bekräfta din e-postadress först. Vi har skickat ett mejl till dig.",
    "generic": "Något gick fel. Försök igen."
  },
  "toast": {
    "welcomeBack": "Välkommen tillbaka",
    "accountCreated": "Kontot är skapat"
  },
  "signedOut": "Du är utloggad",
  "sessionExpired": "Sessionen gick ut. Logga in igen.",
  "signOutFailed": "Du kunde inte loggas ut. Försök igen."
})
EOF
```

- [ ] **Step 2: The screen** `src/components/auth/AuthPage.tsx` (replace the whole file)

```tsx
import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
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
```

`src/Auth/components/AuthLoadingState.tsx` (replace):
```tsx
import { Loader2 } from 'lucide-react';

export const AuthLoadingState = () => (
  <div className="flex min-h-screen items-center justify-center bg-gh-bg">
    <Loader2 className="h-8 w-8 animate-spin text-gh-primary-strong" aria-hidden="true" />
  </div>
);
```

- [ ] **Step 3: Post-login routing.**

`src/Auth/services/AuthService.ts`: add after `getPendingInvitationToken`:
```ts
  static setPendingInvitationToken(token: string): void {
    sessionStorage.setItem('pendingInvitationToken', token);
  }
```

`src/Auth/hooks/useAuth.ts`: in `handleAuthStateChange` replace the body of `if (session) { … }` so it no longer removes the token:
```ts
      if (session) {
        navigate(postLoginPath(AuthService.getPendingInvitationToken()));
      }
```
and add `import { postLoginPath } from '../lib/postLoginPath';`. Apply with:
```bash
python3 -I - <<'EOF'
def edit(path, pairs):
    s = open(path).read()
    for old, new in pairs:
        assert s.count(old) == 1, (path, old)
        s = s.replace(old, new)
    open(path, 'w').write(s)

edit('src/Auth/hooks/useAuth.ts', [
    ("""        // Check if there's a pending invitation token
        const pendingToken = AuthService.getPendingInvitationToken();
        if (pendingToken) {
          AuthService.removePendingInvitationToken();
          navigate(`/accept-invitation?token=${pendingToken}`);
        } else {
          navigate('/');
        }
""", """        navigate(postLoginPath(AuthService.getPendingInvitationToken()));
"""),
    ("import { AuthService } from '../services/AuthService';", "import { AuthService } from '../services/AuthService';\nimport { postLoginPath } from '../lib/postLoginPath';"),
])

edit('src/components/auth/AuthProvider.tsx', [
    ("import { OnboardingService } from '@/Auth/services';",
     "import i18n from '@/lib/i18n';\nimport { AuthService, OnboardingService } from '@/Auth/services';\nimport { postLoginPath } from '@/Auth/lib/postLoginPath';"),
    ("""        } else if (!needsOnboarding && location.pathname === '/auth') {
          navigate('/');
        }""", """        } else if (!needsOnboarding && location.pathname === '/auth') {
          navigate(postLoginPath(AuthService.getPendingInvitationToken()));
        }"""),
    ("""        if (location.pathname === '/auth') {
          navigate('/');
        }""", """        if (location.pathname === '/auth') {
          navigate(postLoginPath(AuthService.getPendingInvitationToken()));
        }"""),
    ("toast.success('Signed out successfully');", "toast.success(i18n.t('auth.signedOut'));"),
    ("toast.error('Error signing out');", "toast.error(i18n.t('auth.signOutFailed'));"),
    ("toast.info('Session expired. Please sign in again.');", "toast.info(i18n.t('auth.sessionExpired'));"),
])
EOF
```

- [ ] **Step 4: Check and commit**

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -E "error TS" | cut -c1-200; npm run lint 2>&1 | grep -E "src/(components/auth|Auth)|problems"; npm run build 2>&1 | tail -1`
Expected: tsc nothing; no new lint problem under those paths (total 10); build succeeds. If `AuthService` is not exported from `@/Auth/services` it is (`src/Auth/services/index.ts` exports `AuthService` and `OnboardingService`).

```bash
git add src/components/auth src/Auth src/locales/en.json src/locales/sv.json
git commit -m "feat(auth): restyled sign in / sign up with inline errors; post-login goes back to a pending invitation"
```

---

### Task 5: Onboarding

**Files:**
- Modify: `src/Auth/components/OnboardingStep.tsx` (replaced), `src/Onboarding/index.tsx`, `src/Auth/hooks/index.ts`
- Delete: `src/Auth/hooks/useOnboarding.ts` (not used anywhere; it still referenced old keys)
- Modify: `src/locales/en.json`, `src/locales/sv.json` (`onboarding` section replaced)

**Interfaces:**
- Consumes: `validateName`, `NameError` (Task 1), `AppHeader({ hideAvatar })`, `AccountHeading` (Task 2), `postLoginPath` (Task 1), `AuthService.getPendingInvitationToken` (existing).
- Produces: `/onboarding` restyled; after the name is saved the person goes to `postLoginPath(pending token)`.

- [ ] **Step 1: Locale keys**

```bash
python3 -I - <<'EOF'
import json
def put(lang, section, value):
    p = f'src/locales/{lang}.json'
    d = json.load(open(p))
    d[section] = value
    open(p, 'w').write(json.dumps(d, indent=2, ensure_ascii=False) + '\n')

put('en', 'onboarding', {
  "title": "Welcome to GiftHunt",
  "lead": "What's your name? The people you share lists with will see it.",
  "nameLabel": "Your name",
  "namePlaceholder": "First and last name",
  "continue": "Continue",
  "errors": {
    "required": "Enter your name.",
    "tooLong": "The name can be at most 100 characters."
  },
  "welcomeComplete": "Welcome!",
  "errorSaving": "Couldn't save your name. Try again."
})
put('sv', 'onboarding', {
  "title": "Välkommen till GiftHunt",
  "lead": "Vad heter du? Namnet ser de du delar listor med.",
  "nameLabel": "Ditt namn",
  "namePlaceholder": "För- och efternamn",
  "continue": "Fortsätt",
  "errors": {
    "required": "Fyll i ditt namn.",
    "tooLong": "Namnet får vara högst 100 tecken."
  },
  "welcomeComplete": "Välkommen!",
  "errorSaving": "Namnet kunde inte sparas. Försök igen."
})
EOF
```

- [ ] **Step 2: The step** `src/Auth/components/OnboardingStep.tsx` (replace)

```tsx
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { AccountHeading } from '@/components/AccountShell';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/gh/TextField';
import { validateName, type NameError } from '@/lib/personName';

interface OnboardingStepProps {
  onComplete: (name: string) => Promise<void>;
  loading: boolean;
}

export const OnboardingStep = ({ onComplete, loading }: OnboardingStepProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [error, setError] = useState<NameError | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;
    const invalid = validateName(name);
    setError(invalid);
    if (invalid) return;
    await onComplete(name.trim());
  };

  return (
    <div className="min-h-screen bg-gh-bg pb-safe text-gh-ink">
      <AppHeader hideAvatar />
      <main className="mx-auto flex w-full max-w-[440px] flex-col gap-8 px-4 pb-10 pt-10 md:pt-16">
        <AccountHeading title={t('onboarding.title')} lead={t('onboarding.lead')} />
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <TextField
            label={t('onboarding.nameLabel')}
            autoComplete="name"
            placeholder={t('onboarding.namePlaceholder')}
            value={name}
            error={error ? t(`onboarding.errors.${error}`) : undefined}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
          />
          <Button
            type="submit"
            disabled={loading}
            className="h-[52px] w-full gap-2 rounded-gh-md text-[17px] font-semibold">
            {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
            {t('onboarding.continue')}
          </Button>
        </form>
      </main>
    </div>
  );
};
```

- [ ] **Step 3: Routing after the name, and cleanup**

```bash
python3 -I - <<'EOF'
def edit(path, pairs):
    s = open(path).read()
    for old, new in pairs:
        assert s.count(old) == 1, (path, old)
        s = s.replace(old, new)
    open(path, 'w').write(s)

edit('src/Onboarding/index.tsx', [
    ("import { OnboardingService } from '@/Auth/services';",
     "import { AuthService, OnboardingService } from '@/Auth/services';\nimport { postLoginPath } from '@/Auth/lib/postLoginPath';"),
    ("""      if (!needs) {
        navigate('/');
        return;""", """      if (!needs) {
        navigate(postLoginPath(AuthService.getPendingInvitationToken()));
        return;"""),
    ("""        toast.success(t('onboarding.welcomeComplete'));
        navigate('/');""", """        toast.success(t('onboarding.welcomeComplete'));
        navigate(postLoginPath(AuthService.getPendingInvitationToken()));"""),
])
edit('src/Auth/hooks/index.ts', [("export { useOnboarding } from './useOnboarding';\n", "")])
EOF
git rm -q src/Auth/hooks/useOnboarding.ts
npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -E "error TS" | cut -c1-200; npm run lint 2>&1 | grep -E "src/(Onboarding|Auth)|problems"; npm run build 2>&1 | tail -1
```
Expected: tsc nothing; no new lint problem (total ≤ 10; removing `useOnboarding.ts` may drop a problem, that is fine); build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/Onboarding src/Auth src/locales/en.json src/locales/sv.json
git commit -m "feat(onboarding): restyled name step; continue to a pending invitation"
```

---

### Task 6: Accept invitation

**Files:**
- Modify: `src/AcceptInvitation/types.ts` (new contents, moved from `lib/invitation.ts`), `src/AcceptInvitation/index.tsx`, `src/AcceptInvitation/hooks/useAcceptInvitation.ts`, `src/AcceptInvitation/hooks/index.ts`, `src/AcceptInvitation/services/AcceptInvitationService.ts`, `src/AcceptInvitation/services/index.ts`, `src/AcceptInvitation/components/index.ts` (all replaced)
- Create: `src/AcceptInvitation/components/InviteShell.tsx`, `InvitePrompt.tsx`, `InviteProblem.tsx`, `InviteLoading.tsx`
- Delete: `src/AcceptInvitation/components/{SuccessState,ErrorState,LoadingState,WishlistInfo,InviterInfo,AdminPrivileges,SignInActions}.tsx`
- Modify: `src/locales/en.json`, `src/locales/sv.json` (`acceptInvitation` section replaced)

**Interfaces:**
- Consumes: `tokenProblem`, `acceptProblem`, `toInvitationData`, `InvitationProblem` (Task 1), `errorCode` (`@/Wishlist/lib/errorCode`), `AuthService.{get,set,remove}PendingInvitationToken`, `useAuth()` (`user`, `signOut`), RPCs `get_invitation_by_token(p_token)` and `accept_invitation(p_invitation_id)`, `AppHeader`, `AccountShell`, `AccountHeading`.
- Produces: `useAcceptInvitation(token)` returning `{ phase: 'loading' | 'prompt' | 'problem'; problem; invitation; goSignIn; goSignUp; goHome; leave; retry }`.

- [ ] **Step 1: Move the types.** Replace `src/AcceptInvitation/types.ts` with the `InvitationQueryResult` and `InvitationData` interfaces (exactly as defined in `src/AcceptInvitation/lib/invitation.ts`), delete them from `lib/invitation.ts` and add `import type { InvitationData, InvitationQueryResult } from '../types.ts';` there, and change `invitation.test.ts`'s import to `import type { InvitationQueryResult } from '../types.ts';`. Then `npm run test:unit 2>&1 | grep -E "ℹ (pass|fail)"` still shows 108 pass.

- [ ] **Step 2: Locale keys**

```bash
python3 -I - <<'EOF'
import json
def put(lang, section, value):
    p = f'src/locales/{lang}.json'
    d = json.load(open(p))
    d[section] = value
    open(p, 'w').write(json.dumps(d, indent=2, ensure_ascii=False) + '\n')

put('en', 'acceptInvitation', {
  "loading": "Checking the invitation",
  "titleNamed": "{{name}} wants you to share a list",
  "titleNoName": "You're invited to share a list",
  "lead": "As organizer you share the list with the people who want to give and keep track of who buys what.",
  "listLabel": "Wishlist",
  "note": "The invitation was sent to the email address you received it on. Sign in or create an account with that address and the invitation is accepted right away.",
  "signIn": "Sign in",
  "signUp": "Create account",
  "accepted": "You are now an organizer",
  "home": "Go to the start page",
  "gone": {
    "title": "This invitation is no longer valid",
    "text": "It may have been withdrawn, already accepted or expired. Ask whoever invited you for a new one."
  },
  "wrongAccount": {
    "title": "The invitation is for another address",
    "text": "You are signed in as {{email}}. The invitation was sent to another email address. Sign out and sign in with the address you received the invitation on.",
    "signOut": "Sign out"
  },
  "unconfirmed": {
    "title": "Confirm your email address",
    "text": "You need to confirm your email address before you can accept the invitation. We have sent you an email."
  },
  "failed": {
    "title": "The invitation couldn't be accepted",
    "text": "Something went wrong. Try again.",
    "retry": "Try again"
  }
})
put('sv', 'acceptInvitation', {
  "loading": "Kontrollerar inbjudan",
  "titleNamed": "{{name}} vill att du delar en lista",
  "titleNoName": "Du är inbjuden att dela en lista",
  "lead": "Som arrangör delar du listan med dem som vill ge och håller koll på vem som köper vad.",
  "listLabel": "Önskelista",
  "note": "Inbjudan är skickad till e-postadressen du fick den på. Logga in eller skapa ett konto med den adressen, så godtas inbjudan direkt.",
  "signIn": "Logga in",
  "signUp": "Skapa konto",
  "accepted": "Du är nu arrangör",
  "home": "Till startsidan",
  "gone": {
    "title": "Den här inbjudan gäller inte längre",
    "text": "Den kan ha dragits tillbaka, redan godtagits eller gått ut. Be den som bjöd in dig om en ny."
  },
  "wrongAccount": {
    "title": "Inbjudan är till en annan adress",
    "text": "Du är inloggad som {{email}}. Inbjudan skickades till en annan e-postadress. Logga ut och logga in med den adress du fick inbjudan på.",
    "signOut": "Logga ut"
  },
  "unconfirmed": {
    "title": "Bekräfta din e-postadress",
    "text": "Du måste bekräfta din e-postadress innan du kan godta inbjudan. Vi har skickat ett mejl till dig."
  },
  "failed": {
    "title": "Inbjudan kunde inte godtas",
    "text": "Något gick fel. Försök igen.",
    "retry": "Försök igen"
  }
})
EOF
```

- [ ] **Step 3: Service, hook, barrels**

`src/AcceptInvitation/services/AcceptInvitationService.ts` (replace):
```ts
import { supabase } from '@/integrations/supabase/client';
import type { InvitationQueryResult } from '../types';

export class AcceptInvitationService {
  /** The invitation behind a token, or null when no invitation has it. */
  static async getInvitationByToken(token: string): Promise<InvitationQueryResult | null> {
    const { data, error } = await supabase.rpc('get_invitation_by_token', { p_token: token });
    if (error) throw error;
    return (data as unknown as InvitationQueryResult | null) ?? null;
  }

  static async acceptInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase.rpc('accept_invitation', { p_invitation_id: invitationId });
    if (error) throw error;
  }
}
```

`src/AcceptInvitation/services/index.ts`: `export { AcceptInvitationService } from './AcceptInvitationService';`

`src/AcceptInvitation/hooks/index.ts`: `export { useAcceptInvitation } from './useAcceptInvitation';`

`src/AcceptInvitation/hooks/useAcceptInvitation.ts` (replace):
```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/useAuth';
import { AuthService } from '@/Auth/services';
import { errorCode } from '@/Wishlist/lib/errorCode';
import { AcceptInvitationService } from '../services/AcceptInvitationService';
import { acceptProblem, toInvitationData, tokenProblem, type InvitationProblem } from '../lib/invitation';
import type { InvitationData } from '../types';

type Phase = 'loading' | 'prompt' | 'problem';

interface FlowState {
  phase: Phase;
  problem: InvitationProblem | null;
  invitation: InvitationData | null;
}

const LOADING: FlowState = { phase: 'loading', problem: null, invitation: null };

/**
 * Opens an invitation link: shows who invited when signed out; accepts straight away when
 * signed in and opens the list. The pending token is kept until the invitation is accepted
 * or found no longer valid, so signing in (or switching account) comes back here.
 */
export const useAcceptInvitation = (token: string | null) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const userId = user?.id;
  const [state, setState] = useState<FlowState>(LOADING);
  // The effect runs twice under StrictMode and again when `t` changes; accept only once per key.
  const started = useRef<string | null>(null);

  const run = useCallback(async () => {
    if (!token) {
      AuthService.removePendingInvitationToken();
      setState({ phase: 'problem', problem: 'gone', invitation: null });
      return;
    }
    setState(LOADING);

    let raw;
    try {
      raw = await AcceptInvitationService.getInvitationByToken(token);
    } catch (error) {
      console.error('Error loading invitation:', error);
      setState({ phase: 'problem', problem: 'failed', invitation: null });
      return;
    }
    if (tokenProblem(raw, new Date()) || !raw) {
      AuthService.removePendingInvitationToken();
      setState({ phase: 'problem', problem: 'gone', invitation: null });
      return;
    }

    const invitation = toInvitationData(raw);
    if (!userId) {
      setState({ phase: 'prompt', problem: null, invitation });
      return;
    }

    try {
      await AcceptInvitationService.acceptInvitation(raw.id);
      AuthService.removePendingInvitationToken();
      toast.success(t('acceptInvitation.accepted'));
      navigate(`/wishlist/${raw.wishlist_id}`, { replace: true });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      const problem = acceptProblem(errorCode(error));
      if (problem === 'gone') AuthService.removePendingInvitationToken();
      setState({ phase: 'problem', problem, invitation });
    }
  }, [token, userId, t, navigate]);

  useEffect(() => {
    const key = `${token ?? ''}:${userId ?? ''}`;
    if (started.current === key) return;
    started.current = key;
    void run();
  }, [token, userId, run]);

  const retry = () => {
    started.current = null;
    void run();
  };

  const rememberToken = () => {
    if (token) AuthService.setPendingInvitationToken(token);
  };

  return {
    ...state,
    goSignIn: () => {
      rememberToken();
      navigate('/auth');
    },
    goSignUp: () => {
      rememberToken();
      navigate('/auth?mode=signup');
    },
    goHome: () => navigate('/'),
    /** Wrong account: sign out and come back to this invitation after signing in. */
    leave: async () => {
      rememberToken();
      await signOut();
    },
    retry,
  };
};
```
Note `tokenProblem(raw, …) || !raw` keeps TypeScript's narrowing of `raw` (non-null after the check).

- [ ] **Step 4: Components.** `src/AcceptInvitation/components/InviteShell.tsx`:

```tsx
import type { ReactNode } from 'react';
import AppHeader from '@/components/AppHeader';
import { AccountShell } from '@/components/AccountShell';

interface InviteShellProps {
  signedIn: boolean;
  children: ReactNode;
}

/** The wordmark column before sign-in, the app header once signed in. */
export const InviteShell = ({ signedIn, children }: InviteShellProps) =>
  signedIn ? (
    <div className="min-h-screen bg-gh-bg pb-safe text-gh-ink">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-[440px] flex-col gap-8 px-4 pb-10 pt-10 md:pt-16">
        {children}
      </main>
    </div>
  ) : (
    <AccountShell>{children}</AccountShell>
  );
```

`InviteLoading.tsx`:
```tsx
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';

export const InviteLoading = () => {
  const { t } = useTranslation();
  return (
    <div role="status" aria-label={t('acceptInvitation.loading')} className="flex flex-col gap-6">
      <Skeleton className="h-9 w-4/5 bg-gh-surface-300" />
      <Skeleton className="h-6 w-full bg-gh-surface-300" />
      <Skeleton className="h-[72px] w-full rounded-gh-lg bg-gh-surface-300" />
    </div>
  );
};
```

`InvitePrompt.tsx`:
```tsx
import { useTranslation } from 'react-i18next';
import { AccountHeading } from '@/components/AccountShell';
import { Button } from '@/components/ui/button';
import type { InvitationData } from '../types';

interface InvitePromptProps {
  invitation: InvitationData;
  onSignIn: () => void;
  onSignUp: () => void;
}

export const InvitePrompt = ({ invitation, onSignIn, onSignUp }: InvitePromptProps) => {
  const { t } = useTranslation();
  const name = invitation.inviterName;
  return (
    <>
      <AccountHeading
        title={name ? t('acceptInvitation.titleNamed', { name }) : t('acceptInvitation.titleNoName')}
        lead={t('acceptInvitation.lead')}
      />
      <article className="flex flex-col gap-1 rounded-gh-lg border border-gh-line bg-gh-surface-200 p-4">
        <span className="text-[13px] leading-[18px] text-gh-muted">{t('acceptInvitation.listLabel')}</span>
        <h2 className="text-[20px] font-semibold leading-[26px] text-gh-ink">{invitation.title}</h2>
      </article>
      <div className="flex flex-col gap-3">
        <p className="text-[14px] leading-5 text-gh-muted">{t('acceptInvitation.note')}</p>
        <Button type="button" onClick={onSignIn} className="h-[52px] w-full rounded-gh-md text-[17px] font-semibold">
          {t('acceptInvitation.signIn')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onSignUp}
          className="h-[52px] w-full rounded-gh-md text-[16px] font-semibold">
          {t('acceptInvitation.signUp')}
        </Button>
      </div>
    </>
  );
};
```

`InviteProblem.tsx`:
```tsx
import { useTranslation } from 'react-i18next';
import { Link2Off } from 'lucide-react';
import { AccountHeading } from '@/components/AccountShell';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/gh/EmptyState';
import type { InvitationProblem } from '../lib/invitation';

interface InviteProblemProps {
  problem: InvitationProblem;
  email?: string;
  onHome: () => void;
  onLeave: () => void;
  onRetry: () => void;
}

const wide = 'h-[52px] w-full rounded-gh-md text-[16px] font-semibold';

export const InviteProblem = ({ problem, email, onHome, onLeave, onRetry }: InviteProblemProps) => {
  const { t } = useTranslation();
  const home = (
    <Button type="button" variant="outline" onClick={onHome} className={wide}>
      {t('acceptInvitation.home')}
    </Button>
  );

  if (problem === 'gone') {
    return (
      <EmptyState
        icon={Link2Off}
        size="screen"
        headingAs="h1"
        title={t('acceptInvitation.gone.title')}
        text={t('acceptInvitation.gone.text')}
        action={home}
      />
    );
  }

  if (problem === 'wrongAccount') {
    return (
      <>
        <AccountHeading
          title={t('acceptInvitation.wrongAccount.title')}
          lead={t('acceptInvitation.wrongAccount.text', { email: email ?? '' })}
        />
        <div className="flex flex-col gap-3">
          <Button type="button" onClick={onLeave} className={`${wide} text-[17px]`}>
            {t('acceptInvitation.wrongAccount.signOut')}
          </Button>
          <Button type="button" variant="ghost" onClick={onHome} className={wide}>
            {t('acceptInvitation.home')}
          </Button>
        </div>
      </>
    );
  }

  if (problem === 'unconfirmed') {
    return (
      <>
        <AccountHeading
          title={t('acceptInvitation.unconfirmed.title')}
          lead={t('acceptInvitation.unconfirmed.text')}
        />
        {home}
      </>
    );
  }

  return (
    <>
      <AccountHeading title={t('acceptInvitation.failed.title')} lead={t('acceptInvitation.failed.text')} />
      <div className="flex flex-col gap-3">
        <Button type="button" onClick={onRetry} className={`${wide} text-[17px]`}>
          {t('acceptInvitation.failed.retry')}
        </Button>
        {home}
      </div>
    </>
  );
};
```

`components/index.ts`:
```ts
export { InviteShell } from './InviteShell';
export { InviteLoading } from './InviteLoading';
export { InvitePrompt } from './InvitePrompt';
export { InviteProblem } from './InviteProblem';
```

`src/AcceptInvitation/index.tsx` (replace):
```tsx
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/components/auth/useAuth';
import { InviteLoading, InviteProblem, InvitePrompt, InviteShell } from './components';
import { useAcceptInvitation } from './hooks';

const AcceptInvitation = () => {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const flow = useAcceptInvitation(params.get('token'));

  return (
    <InviteShell signedIn={Boolean(user)}>
      {flow.phase === 'loading' && <InviteLoading />}
      {flow.phase === 'prompt' && flow.invitation && (
        <InvitePrompt invitation={flow.invitation} onSignIn={flow.goSignIn} onSignUp={flow.goSignUp} />
      )}
      {flow.phase === 'problem' && flow.problem && (
        <InviteProblem
          problem={flow.problem}
          email={user?.email}
          onHome={flow.goHome}
          onLeave={() => void flow.leave()}
          onRetry={flow.retry}
        />
      )}
    </InviteShell>
  );
};

export default AcceptInvitation;
```

Delete the old components: `git rm -q src/AcceptInvitation/components/{SuccessState,ErrorState,LoadingState,WishlistInfo,InviterInfo,AdminPrivileges,SignInActions}.tsx`.

- [ ] **Step 5: Check and commit**

Run: `npm run test:unit 2>&1 | grep -E "ℹ (tests|pass|fail)"; npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -E "error TS" | cut -c1-200; npm run lint 2>&1 | grep -E "src/AcceptInvitation|problems"; npm run build 2>&1 | tail -1`
Expected: 108 pass; tsc nothing; no lint problem under `src/AcceptInvitation` (total ≤ 10); build succeeds. If `Link2Off` is missing from the installed lucide version, use `Link2` from the same package.

```bash
git add src/AcceptInvitation src/locales/en.json src/locales/sv.json
git commit -m "feat(accept-invitation): accept straight after sign-in and open the list"
```

---

### Task 7: Docs, verification and cleanup

**Files:**
- Modify: `CLAUDE.md`, `src/Auth/README.md`, `src/AcceptInvitation/README.md`, `src/Profile/README.md`
- Delete: `src/Auth/ONBOARDING.md`
- Modify: whatever defects the browser checks find.

- [ ] **Step 1: Locale key check.** Every key used under the four sections exists in both languages and no used key is missing:

```bash
python3 -I - <<'EOF'
import json, re, subprocess
files = subprocess.run(['git', 'ls-files', 'src'], capture_output=True, text=True).stdout.split()
used = set()
for f in files:
    if not f.endswith(('.ts', '.tsx')) or f.endswith('.test.ts'):
        continue
    text = open(f).read()
    for m in re.finditer(r"""t\(\s*[`'"]((?:auth|onboarding|acceptInvitation|profile)\.[^`'"]+)[`'"]""", text):
        used.add(m.group(1))
    for m in re.finditer(r"i18n\.t\(\s*['\"]((?:auth)\.[^'\"]+)['\"]", text):
        used.add(m.group(1))
def flat(d, p=''):
    out = set()
    for k, v in d.items():
        out |= flat(v, p + k + '.') if isinstance(v, dict) else {p + k}
    return out
en = flat(json.load(open('src/locales/en.json')))
sv = flat(json.load(open('src/locales/sv.json')))
dyn = {u for u in used if '${' in u}
static = used - dyn
print('missing en:', sorted(k for k in static if k not in en))
print('missing sv:', sorted(k for k in static if k not in sv))
for k in sorted(dyn):
    prefix = k.split('${')[0]
    print('dynamic', k, '->', sorted(x for x in en if x.startswith(prefix))[:4], '… in sv:', sorted(x for x in sv if x.startswith(prefix)) == sorted(x for x in en if x.startswith(prefix)))
sections = ('auth.', 'onboarding.', 'acceptInvitation.', 'profile.')
print('only in en:', sorted(k for k in en - sv if k.startswith(sections)))
print('only in sv:', sorted(k for k in sv - en if k.startswith(sections)))
unused = sorted(k for k in en if k.startswith(sections) and k not in static and not any(k.startswith(d.split('${')[0]) for d in dyn))
print('unused:', unused)
EOF
```
Expected: `missing en: []`, `missing sv: []`, no keys only in one language, `dynamic` lines ending `True`, and `unused:` empty (the dynamic `auth.errors.*`, `onboarding.errors.*`, `profile.errors.*` prefixes cover their keys). Fix any gap.

- [ ] **Step 2: Docs.**

`CLAUDE.md`: in the Features line replace `` `Auth`, `Onboarding`, `Profile`, `AcceptInvitation` `` text so it reads `Auth` (`/auth`: sign in / sign up), `Onboarding` (first-time name), `Profile` (`/profile`: name, theme, language, sign out), `AcceptInvitation` (`/accept-invitation?token=…`: accepts directly when signed in). Replace the "Auth flow" paragraph with:

```
`AuthProvider` (`src/components/auth/AuthProvider.tsx`) wraps the router and redirects unauthenticated users to `/auth`. Public routes: `/auth`, `/accept-invitation`, `/shared/*`. After sign-in, `OnboardingService.checkIfOnboardingNeeded()` gates first-time users to `/onboarding`. Where a signed-in person goes next is `postLoginPath(pendingToken)` (`src/Auth/lib/postLoginPath.ts`): back to `/accept-invitation?token=…` while an invitation token is pending in `sessionStorage` (`pendingInvitationToken`, removed only when the invitation is accepted or no longer valid), else Home. The header avatar opens `/profile`; theme, language and sign out live there.
```
Use a short Python `assert s.count(old) == 1` edit as in earlier phases; read the current lines first (`grep -n "Features:\|^\`AuthProvider\`" CLAUDE.md`).

Rewrite the three READMEs to short accurate descriptions (what the screen does, structure: `lib/` tests, hook, components) in the style of `src/Home/README.md`, and `git rm -q src/Auth/ONBOARDING.md`.

- [ ] **Step 3: Static checks and commit**

Run: `npm run test:unit 2>&1 | grep -E "ℹ (tests|pass|fail)"; npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"; npm run lint 2>&1 | grep problems; npm run build 2>&1 | tail -1`
Expected: 108 pass; tsc `0`; lint ≤ 10 problems; build succeeds.

```bash
git add CLAUDE.md src/Auth src/AcceptInvitation/README.md src/Profile/README.md
git commit -m "docs(account): account screens"
```

- [ ] **Step 4: Seed** (local DB; `npx supabase start` if down; check first: `docker exec supabase_db_pjiofxvhzcengexymoms psql -U postgres -Atc "select email from auth.users order by 1; select title from wishlists order by 1"`)

If `anna@e2e.se`, `erik@e2e.se`, `stranger@e2e.se`, `newbie@e2e.se` or the lists are missing (a `db reset` wipes them), create them as in the phase 5 plan Step 5 (auth admin API `curl` with `email_confirm: true`, password `Passw0rd!`, then the SQL that makes "Annas 35-årsdag" with Erik as organizer, "Eriks egen lista" and "Annas jul"). Give Erik and Anna names (`update profiles set full_name='Erik Berg' where email='erik@e2e.se'`, `'Anna Lind'` for Anna) and leave `newbie@e2e.se` without a name. Then create an invitation for the stranger:

```bash
docker exec supabase_db_pjiofxvhzcengexymoms psql -U postgres -Atc "delete from admin_invitations where email='stranger@e2e.se'; insert into admin_invitations (wishlist_id, email, invitation_token, invited_by, expires_at) select id, 'stranger@e2e.se', 'inv-acct-1', creator_id, now() + interval '7 days' from wishlists where title like 'Annas jul%'"
```

- [ ] **Step 5: Browser verification** (Chrome DevTools MCP, local Supabase, `npm run dev` in this worktree; one isolated context per person, password `Passw0rd!`; read each result; screenshots at 390×844 light, 390×844 dark and 1280×900 light for items 1 and 4, compared with the approved canvas)

1. **Sign in** (`/auth`): wordmark, "Välkommen tillbaka", segmented, two fields, one primary. Submit empty → "Fyll i din e-postadress." and "Fyll i ett lösenord." inline, no request to `auth/v1/token`. `erik@e2e.se` with a wrong password → "E-postadressen eller lösenordet stämmer inte…" under the password field. Correct → Home.
2. **Sign up** (switch the segmented): heading "Skapa ditt konto", password help "Minst 6 tecken."; password `12345` → "Lösenordet måste vara minst 6 tecken."; `erik@e2e.se` → "Det finns redan ett konto…" under e-mail; a new address `nina@e2e.se` → lands on `/onboarding` (header without avatar).
3. **Onboarding**: empty → "Fyll i ditt namn."; spaces only → same; "Nina Ny" → toast "Välkommen!", Home says "Hej Nina" and the avatar shows "NN".
4. **Profile**: avatar opens `/profile` (back arrow + "Profil"); name field shows the name, e-mail read-only; Spara disabled until the name changes; spaces only → "Fyll i ditt namn."; "Nina N. Ny" → toast "Namnet är sparat", button disabled again, avatar initials "NN" after going Home; theme Ljust/Mörkt/Följ enheten applies at once and survives a reload; language English/Svenska applies at once (labels, plural forms on Home) and survives a reload; "Medlem sedan …" correct in both languages; **Logga ut** → `/auth` and toast "Du är utloggad".
5. **Invitation, signed out**: open `/accept-invitation?token=inv-acct-1` → heading "Anna Lind vill att du delar en lista", card "Annas jul", note, "Logga in", "Skapa konto". "Logga in" → `/auth`; sign in as `stranger@e2e.se` → lands straight on `/wishlist/<id>` in organizer mode with toast "Du är nu arrangör"; `sessionStorage.pendingInvitationToken` is gone (check with `evaluate_script`); `admin_invitations.accepted = true`.
6. **Invitation, gone**: open the same link again (signed in) → "Den här inbjudan gäller inte längre" with "Till startsidan"; a made-up token → same; reload does not loop.
7. **Wrong account**: re-create the invitation (SQL in Step 4 with token `inv-acct-2`, after deleting stranger's admin row) and open `/accept-invitation?token=inv-acct-2` signed in as Erik → "Inbjudan är till en annan adress", "Du är inloggad som erik@e2e.se", the stranger's address is not shown; "Logga ut" → `/auth`; sign in as `stranger@e2e.se` → accepted and the list opens.
8. **New account via invitation**: re-create the invitation for `invitee2@e2e.se` (token `inv-acct-3`), open the link signed out → "Skapa konto" → `/auth?mode=signup` shows sign-up; create `invitee2@e2e.se` → onboarding → name → the organizer screen opens (token followed the whole trip).
9. **Accept once**: the accept in item 5 fires exactly one `accept_invitation` request (network panel), also under the dev server's StrictMode.
10. **English, dark, desktop, keyboard**: English has no raw `auth.…`/`profile.…` keys; dark theme matches the canvas; at 1280px the sign-in column is centred (max 440px) and Profile is a centred 720px column with theme and language side by side; Tab order is logical, Enter submits the forms, focus ring visible.
11. **Console and network**: no console errors; no 4xx except the deliberate bad sign-ins, the gone link and the wrong-account accept.

Record anything that does not match as a defect and fix it (TDD where it is in a `lib/` file) before moving on.

- [ ] **Step 6: Full checks and final commit**

```bash
npm run test:unit 2>&1 | grep -E "ℹ (tests|pass|fail)"
npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"
npm run lint 2>&1 | grep problems
npm run build 2>&1 | tail -1
```
Expected: 108 pass (plus any test a fix added); tsc `0`; lint ≤ 10 problems; build succeeds. The database is untouched, so `npm run test:db` is not part of this phase's gate (run it only if a migration appeared).

```bash
git add src
git commit -m "fix(account): defects found in browser verification"
```
(Skip when there were none.)
