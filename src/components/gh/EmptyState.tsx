import type { ReactNode } from 'react';
import { Rosetten, type RosettenPose } from '@/components/brand';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** Left out where the mascot would sit next to what is taken. */
  pose?: RosettenPose;
  title: string;
  text?: string;
  action?: ReactNode;
  size?: 'inline' | 'screen';
  headingAs?: 'h1' | 'h2';
}

/** Heading, one line, one action. Never just a grey line. */
export const EmptyState = ({
  pose,
  title,
  text,
  action,
  size = 'inline',
  headingAs: Heading = 'h2',
}: EmptyStateProps) => (
  <div
    className={cn(
      'flex flex-col items-center gap-2 px-4 text-center',
      size === 'screen' ? 'py-10' : 'py-8',
    )}>
    {pose && <Rosetten pose={pose} size={size === 'screen' ? 144 : 104} />}
    <Heading
      className={cn(
        'mt-3 font-bold text-gh-ink',
        size === 'screen' ? 'text-[22px] leading-7' : 'text-[18px] leading-6',
      )}>
      {title}
    </Heading>
    {text && <p className="max-w-[340px] text-[16px] leading-6 text-gh-ink-2">{text}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
