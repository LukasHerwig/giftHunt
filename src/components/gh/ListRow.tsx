import type { ReactNode } from 'react';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ListRowProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  /** A pill or short text at the end of the row. */
  trailing?: ReactNode;
  chevron?: boolean;
  /** The "Ny önskelista" row at the end of a list: accent title, no chevron. */
  add?: boolean;
  /** Quieter title, for rows that are no longer live. */
  muted?: boolean;
  /** Let the subtitle wrap to a second line instead of truncating. */
  wrapSubtitle?: boolean;
  onClick: () => void;
}

/** The base row of every list: leading icon, title, one line of context and a trailing slot. */
export const ListRow = ({ title, subtitle, icon: Icon, trailing, chevron, add, muted, wrapSubtitle, onClick }: ListRowProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left',
      'transition-colors hover:bg-gh-surface-100 active:bg-gh-surface-300 motion-reduce:transition-none',
    )}>
    <Icon
      className={cn('h-5 w-5 flex-none', add ? 'text-gh-primary-strong' : 'text-gh-muted')}
      aria-hidden="true"
    />
    <span className="flex min-w-0 flex-1 flex-col">
      <span
        className={cn(
          'truncate text-[17px] font-semibold leading-[22px]',
          add ? 'text-gh-primary-strong' : muted ? 'text-gh-ink-2' : 'text-gh-ink',
        )}>
        {title}
      </span>
      {subtitle && (
        <span className={cn('text-[13px] leading-[18px] text-gh-muted', !wrapSubtitle && 'truncate')}>{subtitle}</span>
      )}
    </span>
    {trailing}
    {chevron && <ChevronRight className="h-5 w-5 flex-none text-gh-muted" aria-hidden="true" />}
  </button>
);
