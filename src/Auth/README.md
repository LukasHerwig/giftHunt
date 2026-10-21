# Auth and Onboarding

Sign in / sign up at `/auth` and the first-time name step at `/onboarding` (canvas: https://claude.ai/artifact/55y11MkuWVCCyYvWMHBTEb).

## What it does
- One page with a segmented switch between **Logga in** and **Skapa konto** (`/auth?mode=signup` opens sign-up). Fields are validated inline (`lib/authForm.ts`); Supabase errors are mapped to a message under the right field.
- After a successful sign-in `AuthProvider` decides where to go (`lib/postLoginPath.ts`): back to a pending invitation, else Home. A person without a name goes to `/onboarding` first, then on to the same place.
- Onboarding asks only for the name (`lib/personName.ts` validates it) and stores it in `profiles.full_name`.

## Structure
- `lib/` – pure logic with unit tests (`npm run test:unit`)
- `services/` – `AuthService` (session, pending invitation token), `OnboardingService`
- `hooks/useAuth.ts` – redirects a signed-in visitor of `/auth`
- `components/OnboardingStep.tsx`, `AuthLoadingState.tsx`; the sign-in page itself is `src/components/auth/AuthPage.tsx`
