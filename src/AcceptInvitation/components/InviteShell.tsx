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
