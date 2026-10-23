import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClaimProgress } from './ClaimProgress';
import { GiftCardBadge } from './GiftCardBadge';
import { ItemImage } from './ItemImage';
import { StatusPill, type ItemStatus } from './StatusPill';

interface ItemRowProps {
  title: string;
  image?: string | null;
  /** "ca 400 kr · Prio hög" */
  meta?: string;
  status?: { kind: ItemStatus; label: string };
  giftCardLabel?: string;
  claim?: { count: number; cap: number | null; label: string };
  /** Muted ground for items that can no longer be taken. */
  taken?: boolean;
  /** Without it the row is read-only (an archived list). */
  onClick?: () => void;
}

export const ItemRow = ({ title, image, meta, status, giftCardLabel, claim, taken, onClick }: ItemRowProps) => {
  const Root = onClick ? 'button' : 'div';
  return (
  <Root
    {...(onClick ? { type: 'button' as const, onClick } : {})}
    className={cn(
      'relative flex min-h-[80px] w-full items-center gap-3 rounded-gh-lg border p-3 text-left text-gh-ink',
      onClick &&
        'transition-[transform,background-color] duration-[120ms] active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100',
      taken
        ? 'border-transparent bg-gh-taken-bg'
        : cn('border-gh-line bg-gh-surface-200', onClick && 'hover:border-gh-line-strong hover:bg-gh-surface-100'),
    )}>
    <ItemImage
      src={image}
      className={cn('h-14 w-14 rounded-gh-sm', taken && 'opacity-60')}
    />
    <span className="flex min-w-0 flex-1 flex-col gap-1">
      <span
        className={cn(
          'line-clamp-2 text-[17px] font-semibold leading-[22px]',
          taken ? 'text-gh-ink-2' : 'text-gh-ink',
        )}>
        {title}
      </span>
      {meta && <span className="text-[13px] leading-[18px] text-gh-muted">{meta}</span>}
      {(status || giftCardLabel || claim) && (
        <span className="mt-1 flex flex-wrap items-center gap-2">
          {status && (
            <StatusPill
              status={status.kind}
              className={taken && status.kind === 'taken' ? 'bg-gh-surface-200' : undefined}>
              {status.label}
            </StatusPill>
          )}
          {giftCardLabel && <GiftCardBadge label={giftCardLabel} />}
          {claim && <ClaimProgress count={claim.count} cap={claim.cap} label={claim.label} />}
        </span>
      )}
    </span>
    {onClick && <ChevronRight className="h-5 w-5 flex-none text-gh-muted" aria-hidden="true" />}
  </Root>
  );
};
