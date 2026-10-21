import type { ReactNode } from 'react';
import { RosettMark } from '@/components/brand';

/** The frame for screens before sign-in: the wordmark and one centred column. */
export const AccountShell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-gh-bg pb-safe text-gh-ink">
    <div className="mx-auto flex w-full max-w-[440px] flex-col gap-8 px-4 pb-10 pt-12 md:pt-24">
      <div className="flex items-center gap-2 font-brand text-[32px] font-semibold leading-9">
        <RosettMark size={36} />
        GiftHunt
      </div>
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
