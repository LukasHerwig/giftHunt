import { toast as sonner } from 'sonner';
import { RosettenBubble } from '@/components/brand';
import { bubbleFor, type ToastKind } from '@/lib/bubble';
import { getPlayful } from '@/lib/playful';

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const say = (kind: ToastKind, message: string) =>
  sonner.custom(() => <RosettenBubble kind={kind} message={message} lively={getPlayful() && !reducedMotion()} />, {
    duration: bubbleFor(kind).durationMs,
  });

/** Same calls as sonner's, but Rosetten says it. */
export const toast = {
  success: (message: string) => say('success', message),
  error: (message: string) => say('error', message),
  info: (message: string) => say('info', message),
};
