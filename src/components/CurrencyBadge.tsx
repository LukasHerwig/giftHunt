import { cn } from '@/lib/utils';

interface CurrencyBadgeProps {
  amount: string;
  currency?: string;
  className?: string;
}

export const CurrencyBadge = ({
  amount,
  currency = 'SEK',
  className,
}: CurrencyBadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-[12px] bg-ios-blue/10 text-ios-blue rounded-full font-medium',
        className
      )}>
      <span className="opacity-70">{currency}</span>
      {amount}
    </span>
  );
};
