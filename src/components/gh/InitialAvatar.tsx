import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { initials } from '@/lib/initials';

interface InitialAvatarProps {
  name: string;
  /** sm sits in a stack beside a button label. */
  size?: 'md' | 'sm';
  className?: string;
}

/** A person's initials on a calm surface. Decorative: the name is always written beside it. */
export const InitialAvatar = ({ name, size = 'md', className }: InitialAvatarProps) => (
  <Avatar aria-hidden="true" className={cn(size === 'md' ? 'h-10 w-10' : 'h-6 w-6', className)}>
    <AvatarFallback
      className={cn(
        'bg-gh-surface-300 font-semibold text-gh-ink',
        size === 'md' ? 'text-[15px]' : 'text-[12px] tracking-tight',
      )}>
      {initials(name)}
    </AvatarFallback>
  </Avatar>
);
