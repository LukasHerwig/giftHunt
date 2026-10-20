import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ItemStatus = 'available' | 'taken' | 'pending';

const TONE: Record<ItemStatus, string> = {
  available: 'bg-gh-available-bg text-gh-available',
  taken: 'bg-gh-taken-bg text-gh-taken',
  pending: 'bg-gh-primary-tint text-gh-primary-strong',
};

interface StatusPillProps {
  status: ItemStatus;
  children: ReactNode;
  className?: string;
}

/** Item status is always a word plus a pill, never colour alone. */
export const StatusPill = ({ status, children, className }: StatusPillProps) => (
  <span
    className={cn(
      'inline-flex min-h-[24px] items-center gap-1 whitespace-nowrap rounded-gh-pill px-2 text-[12px] font-semibold leading-4 tracking-[0.2px]',
      TONE[status],
      className,
    )}>
    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-gh-pill bg-current" />
    {children}
  </span>
);
