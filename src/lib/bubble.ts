export type ToastKind = 'success' | 'error' | 'info';

export type BubblePose =
  | 'hello'
  | 'happy'
  | 'sleep'
  | 'lost'
  | 'sad'
  | 'locked'
  | 'wink'
  | 'love'
  | 'teary'
  | 'oops';

export type BubbleMotion = 'hop' | 'nod' | 'pulse' | 'sway' | 'breathe' | 'shake';

const MOTION: Record<BubblePose, BubbleMotion> = {
  happy: 'hop',
  wink: 'nod',
  hello: 'nod',
  locked: 'nod',
  love: 'pulse',
  teary: 'sway',
  lost: 'sway',
  sad: 'sway',
  sleep: 'breathe',
  oops: 'shake',
};

const DEFAULT_POSE: Record<ToastKind, BubblePose> = { success: 'happy', info: 'hello', error: 'oops' };

export const bubbleFor = (
  kind: ToastKind,
  pose?: BubblePose,
): { pose: BubblePose; motion: BubbleMotion; durationMs: number } => {
  const chosen = pose ?? DEFAULT_POSE[kind];
  return { pose: chosen, motion: MOTION[chosen], durationMs: kind === 'error' ? 6000 : 4000 };
};
