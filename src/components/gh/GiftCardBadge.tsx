import { Users } from 'lucide-react';

export const GiftCardBadge = ({ label }: { label: string }) => (
  <span className="inline-flex min-h-[24px] items-center gap-1 whitespace-nowrap rounded-gh-pill border border-gh-line-strong px-2 text-[12px] font-semibold leading-4 tracking-[0.2px] text-gh-ink-2">
    <Users className="h-3.5 w-3.5" aria-hidden="true" />
    {label}
  </span>
);
