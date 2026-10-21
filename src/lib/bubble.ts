export type ToastKind = 'success' | 'error' | 'info';

export const bubbleFor = (kind: ToastKind): { pose: 'happy' | 'sad' | 'hello'; durationMs: number } => {
  switch (kind) {
    case 'success':
      return { pose: 'happy', durationMs: 4000 };
    case 'error':
      return { pose: 'sad', durationMs: 6000 };
    default:
      return { pose: 'hello', durationMs: 4000 };
  }
};
