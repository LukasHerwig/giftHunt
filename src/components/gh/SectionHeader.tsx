import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  count?: number;
  description?: string;
  className?: string;
}

export const SectionHeader = ({ title, count, description, className }: SectionHeaderProps) => (
  <div className={cn('flex flex-col gap-1', className)}>
    <div className="flex items-baseline gap-2">
      <h2 className="text-[18px] font-bold leading-6 text-gh-ink">{title}</h2>
      {count != null && <span className="text-[13px] leading-[18px] text-gh-muted">{count}</span>}
    </div>
    {description && <p className="text-[13px] leading-[18px] text-gh-muted">{description}</p>}
  </div>
);
