import { cn } from '@/lib/utils';

interface ClaimProgressProps {
  count: number;
  /** The gift card's claim_cap; null = unlimited (label only, no meter). */
  cap: number | null;
  label: string;
  className?: string;
}

export const ClaimProgress = ({ count, cap, label, className }: ClaimProgressProps) => {
  const limited = cap != null && cap > 0;
  const shown = limited ? Math.min(count, cap) : 0;
  const full = limited && count >= cap;
  const fill = full ? 'bg-gh-taken' : 'bg-gh-primary-strong';

  return (
    <span className={cn('inline-flex min-w-[120px] flex-col gap-1', className)}>
      <span className="text-[13px] leading-[18px] text-gh-muted">{label}</span>
      {limited && cap <= 10 && (
        <span
          role="meter"
          aria-valuemin={0}
          aria-valuemax={cap}
          aria-valuenow={shown}
          aria-label={label}
          className="flex h-1.5 w-full max-w-[160px] gap-1">
          {Array.from({ length: cap }, (_, i) => (
            <span
              key={i}
              className={cn('flex-1 rounded-gh-pill bg-gh-surface-400', i < shown && fill)}
            />
          ))}
        </span>
      )}
      {limited && cap > 10 && (
        <span
          role="meter"
          aria-valuemin={0}
          aria-valuemax={cap}
          aria-valuenow={shown}
          aria-label={label}
          className="block h-1.5 w-full max-w-[160px] overflow-hidden rounded-gh-pill bg-gh-surface-400">
          <span
            className={cn('block h-full rounded-gh-pill', fill)}
            style={{ width: `${(shown / cap) * 100}%` }}
          />
        </span>
      )}
    </span>
  );
};
