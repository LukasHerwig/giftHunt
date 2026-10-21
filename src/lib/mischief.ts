/** How often Rosetten may be naughty. All limits live here so they are easy to tune and to test. */
export const PEEK = { cooldownMs: 20_000, cap: 4, chance: 0.35 } as const;
export const RUN = { minPageAgeMs: 45_000, cooldownMs: 240_000, cap: 2 } as const;

export interface MischiefState {
  peeks: number;
  runs: number;
  lastPeekAt: number | null;
  lastRunAt: number | null;
}

export const emptyState = (): MischiefState => ({ peeks: 0, runs: 0, lastPeekAt: null, lastRunAt: null });

/** Only the calm screens: never a wishlist or a shared list, where items and claims are. */
export const mischiefRoute = (pathname: string): boolean =>
  ['/', '/profile', '/auth', '/onboarding', '/accept-invitation'].includes(pathname);

export const canPeek = (state: MischiefState, now: number, random: () => number): boolean => {
  if (state.peeks >= PEEK.cap) return false;
  if (state.lastPeekAt !== null && now - state.lastPeekAt < PEEK.cooldownMs) return false;
  return random() < PEEK.chance;
};

export const canRun = (state: MischiefState, now: number, pageAgeMs: number): boolean => {
  if (state.runs >= RUN.cap) return false;
  if (pageAgeMs < RUN.minPageAgeMs) return false;
  if (state.lastRunAt !== null && now - state.lastRunAt < RUN.cooldownMs) return false;
  return true;
};

export const recordPeek = (state: MischiefState, now: number): MischiefState => ({
  ...state,
  peeks: state.peeks + 1,
  lastPeekAt: now,
});

export const recordRun = (state: MischiefState, now: number): MischiefState => ({
  ...state,
  runs: state.runs + 1,
  lastRunAt: now,
});

const KEY = 'gifthunt-mischief';
interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const loadState = (storage: StorageLike): MischiefState => {
  try {
    const parsed = JSON.parse(storage.getItem(KEY) ?? 'null');
    if (
      parsed &&
      typeof parsed.peeks === 'number' &&
      typeof parsed.runs === 'number' &&
      (parsed.lastPeekAt === null || typeof parsed.lastPeekAt === 'number') &&
      (parsed.lastRunAt === null || typeof parsed.lastRunAt === 'number')
    ) {
      return parsed as MischiefState;
    }
  } catch {
    /* broken or blocked storage: start fresh */
  }
  return emptyState();
};

export const saveState = (storage: StorageLike, state: MischiefState): void => {
  try {
    storage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage blocked: the limits then only hold for this page */
  }
};
