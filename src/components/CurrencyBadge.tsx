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
        'inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full',
        className
      )}>
      <span className="text-xs font-medium">{currency}</span>
      {amount}
    </span>
  );
};
