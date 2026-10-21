import { toast as sonner } from 'sonner';
import { RosettenBubble } from '@/components/brand';
import { bubbleFor, type BubblePose, type ToastKind } from '@/lib/bubble';
import { getPlayful } from '@/lib/playful';

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const say = (kind: ToastKind, message: string, pose?: BubblePose) =>
  sonner.custom(() => <RosettenBubble kind={kind} message={message} pose={pose} lively={getPlayful() && !reducedMotion()} />, {
    duration: bubbleFor(kind, pose).durationMs,
  });

/** Same calls as sonner's, but Rosetten says it, with the face that fits. */
export const toast = {
  success: (message: string, pose?: BubblePose) => say('success', message, pose),
  error: (message: string, pose?: BubblePose) => say('error', message, pose),
  info: (message: string, pose?: BubblePose) => say('info', message, pose),
};
