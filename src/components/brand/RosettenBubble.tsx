import { cn } from '@/lib/utils';
import { bubbleFor, type ToastKind } from '@/lib/bubble';
import { Rosetten } from './Rosetten';

interface RosettenBubbleProps {
  kind: ToastKind;
  message: string;
  /** False when the person turned the mascot off or asked for less motion: he stands still. */
  lively: boolean;
}

/** Rosetten says it himself, from the corner. The text is the live message; the figure is decoration. */
export const RosettenBubble = ({ kind, message, lively }: RosettenBubbleProps) => {
  const { pose } = bubbleFor(kind);
  return (
    <div className="flex w-[min(360px,calc(100vw-32px))] items-end gap-1.5">
      <Rosetten
        pose={pose}
        size={72}
        className={cn('flex-none', lively && (kind === 'error' ? 'rs-shake' : kind === 'success' ? 'rs-hop' : 'rs-nod'))}
      />
      <div
        className="relative min-w-0 flex-1 rounded-gh-lg border border-gh-line bg-gh-surface-200 px-3.5 py-3 text-[15px] font-semibold leading-5 text-gh-ink shadow-gh-menu before:absolute before:-left-[7px] before:bottom-4 before:h-3 before:w-3 before:rotate-45 before:border-b before:border-l before:border-gh-line before:bg-gh-surface-200 before:content-['']">
        {message}
      </div>
    </div>
  );
};
