# Rosetten lively: peeks, a runner and speech-bubble toasts – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the app feel alive: Rosetten sometimes peeks over the edge of a list card, now and then runs along the bottom of the screen, and **tells you what happened in a speech bubble** instead of a plain toast. A "Lekfull maskot" switch on Profile turns the mischief off.

**Architecture:** Pure rules (when mischief may happen: cooldowns, caps, chance, allowed routes; which pose and how long a bubble stays) are plain TypeScript with `node:test` tests. A small preference store (`localStorage`) and a reduced-motion hook decide whether anything moves. Three UI pieces: `RosettenBubble` (the toast; sonner stays as the stacking/timing engine through `toast.custom`), `Peek` (wraps a card list) and `RosettenRunner` (one instance in the app shell). `src/lib/toast.ts` keeps the existing `toast.success/error/info(message)` calls working, so the ten files that toast only change their import.

**Tech Stack:** React + TypeScript, Tailwind (`gh-*`), inline SVG + CSS keyframes, sonner (`toast.custom`), `node:test`.

**Design:** brand canvas https://claude.ai/artifact/Aihm5Q1LPi7j9Xri3fytHR, board **Rosetten: busig och pratbubbla** (three behaviours, the bubble in light and dark, the rules). Poses and the mark are already in `src/components/brand/` (PR #54).

## Decisions (agreed in chat)

- Mischief (peek, runner) only on **Home, Profile, sign-in, onboarding and the invitation page**: never on `/wishlist/*` or `/shared/*`, never beside items.
- The **speech bubble works on every screen** (it only says what you just did) and replaces all toasts.
- Sleeping, locked etc. poses and everything else from PR #54 stay as they are.
- Simplified from the first sketch: no peek behind the header, and on touch screens no runner (only the bubble and the scroll-in peek).

## Global Constraints

- **Reduced motion** (`prefers-reduced-motion: reduce`) or the Profile switch **off**: no peek, no runner, no hop; the bubble still shows, standing still.
- The runner and the peeking Rosetten are `aria-hidden`, `pointer-events: none`, never above a button or text you need, and never take focus.
- Frequency limits live in one place (`src/lib/mischief.ts`) and are unit tested: peek ≤ 1 per 20 s and 4 per session at 35 % chance; runner after 45 s on a page, ≤ 1 per 4 min and 2 per session.
- Bubble: success and info stay 4 s, errors 6 s, at most two visible, swipe to dismiss (sonner), message text is readable by screen readers as before.
- Only `gh-*` tokens plus the mascot's own palette in `palette.ts`; no hardcoded strings (new Profile strings go in both locales); touch targets ≥ 44 px.
- Baselines: unit tests 110, `tsc` 0 errors, lint 10 problems (3 errors, 7 warnings).

## Review Focus

- **Never on claim screens:** no peek or runner on `/wishlist/*` or `/shared/*`; the route allow-list is unit tested and the runner is mounted where it can read the route. (Task 1, Task 5)
- **Reduced motion and the switch** stop everything, including the bubble hop; nothing moves while hidden tabs are in the background (timers stop when the tab is hidden). (Task 2, Task 4, Task 5)
- **The bubble never hides what you need:** it does not cover the primary button of a sheet at 390 px, respects the iOS safe area, and a second toast does not push the first off-screen. (Task 3)
- **No click stealing:** peek and runner never receive pointer events or tab focus. (Task 4, Task 5)
- **Existing toast calls** still work: success, error and info with a string, including from non-React code (`AuthProvider`). (Task 3)
- **Performance:** timers and observers are cleaned up on unmount and route change; idle pages do no work when the preference is off. (Task 4, Task 5)

## File structure

| File | Responsibility |
|---|---|
| `src/lib/mischief.ts` (+test) | rules: gates, caps, route allow-list, session state |
| `src/lib/bubble.ts` (+test) | toast kind → pose, duration |
| `src/lib/playful.ts` | preference store + `usePlayful()` and `useCanPlay()` hooks |
| `src/lib/toast.ts` | `toast.success/error/info` → sonner `toast.custom` |
| `src/components/brand/RosettenBubble.tsx` | the speech-bubble toast |
| `src/components/brand/Peek.tsx`, `RosettenRunner.tsx` | the two mischief pieces |
| `src/components/ui/sonner.tsx`, `src/App.tsx` | Toaster setup, runner mounted |
| `src/Home/components/ListSection.tsx` | peeking behind the list card |
| `src/Profile/index.tsx`, `src/locales/*.json` | the "Lekfull maskot" switch |
| `src/index.css` | keyframes for peek, run, hop, nod, shake |
| the 10 files that import `toast` from `sonner` | import swapped to `@/lib/toast` |
| `CLAUDE.md`, design system README | rules |

---

### Task 1: The rules (pure, tested)

**Files:**
- Create: `src/lib/mischief.ts`, `src/lib/mischief.test.ts`, `src/lib/bubble.ts`, `src/lib/bubble.test.ts`

**Interfaces:**
- Produces: `PEEK`, `RUN` limits; `type MischiefState = { peeks: number; runs: number; lastPeekAt: number | null; lastRunAt: number | null }`; `emptyState()`; `mischiefRoute(pathname): boolean`; `canPeek(state, now, random): boolean`; `canRun(state, now, pageAgeMs): boolean`; `recordPeek(state, now)`; `recordRun(state, now)`; `loadState(storage)` / `saveState(storage, state)`; `type ToastKind = 'success' | 'error' | 'info'`; `bubbleFor(kind): { pose: 'happy' | 'sad' | 'hello'; durationMs: number }`.

- [ ] **Step 1: Write the failing tests**

`src/lib/mischief.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PEEK,
  RUN,
  canPeek,
  canRun,
  emptyState,
  loadState,
  mischiefRoute,
  recordPeek,
  recordRun,
  saveState,
} from './mischief.ts';

test('mischief is allowed on the calm screens only', () => {
  for (const path of ['/', '/profile', '/auth', '/onboarding', '/accept-invitation']) {
    assert.equal(mischiefRoute(path), true, path);
  }
  for (const path of ['/wishlist/abc', '/wishlist/abc/manage', '/shared/tok', '/shared/', '/nope']) {
    assert.equal(mischiefRoute(path), false, path);
  }
});

test('a peek needs luck, a cooldown and room under the cap', () => {
  const s = emptyState();
  assert.equal(canPeek(s, 1000, () => 0.1), true);
  assert.equal(canPeek(s, 1000, () => PEEK.chance + 0.01), false);
  const after = recordPeek(s, 1000);
  assert.equal(canPeek(after, 1000 + PEEK.cooldownMs - 1, () => 0), false);
  assert.equal(canPeek(after, 1000 + PEEK.cooldownMs, () => 0), true);
});

test('peeks stop at the session cap', () => {
  let s = emptyState();
  for (let i = 0; i < PEEK.cap; i += 1) s = recordPeek(s, i * PEEK.cooldownMs);
  assert.equal(canPeek(s, 10 * PEEK.cooldownMs, () => 0), false);
});

test('the runner waits for a page to be old enough, then for its cooldown and cap', () => {
  const s = emptyState();
  assert.equal(canRun(s, 0, RUN.minPageAgeMs - 1), false);
  assert.equal(canRun(s, 0, RUN.minPageAgeMs), true);
  const once = recordRun(s, 100);
  assert.equal(canRun(once, 100 + RUN.cooldownMs - 1, RUN.minPageAgeMs), false);
  assert.equal(canRun(once, 100 + RUN.cooldownMs, RUN.minPageAgeMs), true);
  const twice = recordRun(once, 100 + RUN.cooldownMs);
  assert.equal(canRun(twice, 100 + 10 * RUN.cooldownMs, RUN.minPageAgeMs), false);
});

test('state survives a reload through storage and ignores broken data', () => {
  const data = new Map<string, string>();
  const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
  assert.deepEqual(loadState(storage), emptyState());
  saveState(storage, recordRun(recordPeek(emptyState(), 5), 6));
  assert.deepEqual(loadState(storage), { peeks: 1, runs: 1, lastPeekAt: 5, lastRunAt: 6 });
  storage.setItem('gifthunt-mischief', '{not json');
  assert.deepEqual(loadState(storage), emptyState());
});
```

`src/lib/bubble.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bubbleFor } from './bubble.ts';

test('each kind of message has its pose, and errors stay longer', () => {
  assert.deepEqual(bubbleFor('success'), { pose: 'happy', durationMs: 4000 });
  assert.deepEqual(bubbleFor('info'), { pose: 'hello', durationMs: 4000 });
  assert.deepEqual(bubbleFor('error'), { pose: 'sad', durationMs: 6000 });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm run test:unit 2>&1 | grep -E "ℹ (tests|pass|fail)|Cannot find module" | head -4`
Expected: FAIL `Cannot find module './mischief.ts'` / `'./bubble.ts'`.

- [ ] **Step 3: Implement**

`src/lib/mischief.ts`:
```ts
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
```

`src/lib/bubble.ts`:
```ts
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
```

- [ ] **Step 4: Run to verify they pass, then commit**

Run: `npm run test:unit 2>&1 | grep -E "ℹ (tests|pass|fail)"; npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"`
Expected: 116 tests, 116 pass; tsc `0`. (110 + 5 mischief + 1 bubble.)

```bash
git add src/lib/mischief.ts src/lib/mischief.test.ts src/lib/bubble.ts src/lib/bubble.test.ts
git commit -m "feat(lively): the rules for when Rosetten may be naughty"
```

---

### Task 2: The preference and reduced motion

**Files:**
- Create: `src/lib/playful.ts`
- Modify: `src/Profile/index.tsx`, `src/locales/en.json`, `src/locales/sv.json`

**Interfaces:**
- Produces: `usePlayful(): [boolean, (on: boolean) => void]` (the stored preference, default on); `useCanPlay(): boolean` (preference on **and** no reduced motion **and** tab visible); `getPlayful(): boolean`.

- [ ] **Step 1: The store and hooks** `src/lib/playful.ts`

```ts
import { useEffect, useState, useSyncExternalStore } from 'react';

const KEY = 'gifthunt-playful';
const listeners = new Set<() => void>();

export const getPlayful = (): boolean => {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
};

const setPlayful = (on: boolean) => {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* blocked storage: the switch then only lasts for this page */
  }
  listeners.forEach((notify) => notify());
};

const subscribe = (notify: () => void) => {
  listeners.add(notify);
  return () => void listeners.delete(notify);
};

/** The "Lekfull maskot" preference, on by default. */
export const usePlayful = (): [boolean, (on: boolean) => void] => [
  useSyncExternalStore(subscribe, getPlayful, () => true),
  setPlayful,
];

const useMedia = (query: string): boolean => {
  const [matches, setMatches] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false));
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);
  return matches;
};

const useTabVisible = (): boolean => {
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible');
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return visible;
};

/** Anything that moves for fun asks this first. */
export const useCanPlay = (): boolean => {
  const [playful] = usePlayful();
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const visible = useTabVisible();
  return playful && !reduced && visible;
};
```

- [ ] **Step 2: Locale keys.** Add to both files, in the `profile` section, `playful` and `playfulHelp`:

```bash
python3 -I - <<'EOF'
import json
text = {
    'en': ('Playful mascot', 'Rosetten peeks out and runs by now and then.'),
    'sv': ('Lekfull maskot', 'Rosetten tittar fram och springer förbi då och då.'),
}
for lang, (label, help_) in text.items():
    p = f'src/locales/{lang}.json'
    d = json.load(open(p))
    d['profile']['playful'] = label
    d['profile']['playfulHelp'] = help_
    open(p, 'w').write(json.dumps(d, indent=2, ensure_ascii=False) + '\n')
EOF
```

- [ ] **Step 3: The switch on Profile.** In `src/Profile/index.tsx` add `import { SwitchRow } from '@/components/gh/SwitchRow';` and `import { usePlayful } from '@/lib/playful';`, `const [playful, setPlayful] = usePlayful();` next to the other hooks, and insert, directly after the `div.grid` of theme and language (before the member-since row):

```tsx
          <div className="overflow-hidden rounded-gh-lg border border-gh-line bg-gh-surface-200">
            <SwitchRow
              label={t('profile.playful')}
              description={t('profile.playfulHelp')}
              checked={playful}
              onChange={setPlayful}
            />
          </div>
```

- [ ] **Step 4: Check and commit**

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"; npm run lint 2>&1 | grep -E "src/lib/playful|src/Profile|problems"; npm run build 2>&1 | tail -1`
Expected: `0`; no new lint problem (total 10); build succeeds.

```bash
git add src/lib/playful.ts src/Profile/index.tsx src/locales/en.json src/locales/sv.json
git commit -m "feat(lively): a Lekfull maskot switch on Profile; reduced motion and hidden tabs stop the play"
```

---

### Task 3: Speech-bubble toasts

**Files:**
- Create: `src/lib/toast.ts`, `src/components/brand/RosettenBubble.tsx`
- Modify: `src/components/brand/index.ts`, `src/components/ui/sonner.tsx`, `src/index.css`, and the import line of the 10 files that toast (`src/Home/hooks/useHome.ts`, `src/AcceptInvitation/hooks/useAcceptInvitation.ts`, `src/components/AuthTester.tsx`, `src/components/auth/AuthPage.tsx`, `src/Profile/hooks/useProfile.ts`, `src/components/auth/AuthProvider.tsx`, `src/Onboarding/index.tsx`, `src/PublicWishlist/hooks/usePublicWishlist.ts`, `src/Wishlist/hooks/useOrganizerWishlist.ts`, `src/Wishlist/hooks/useOwnerWishlist.ts`)

**Interfaces:**
- Consumes: `bubbleFor` (Task 1), `Rosetten` (PR #54), `getPlayful` (Task 2).
- Produces: `toast.success(message)`, `toast.error(message)`, `toast.info(message)` (same call shape as today).

- [ ] **Step 1: The bubble** `src/components/brand/RosettenBubble.tsx`

```tsx
import { cn } from '@/lib/utils';
import type { ToastKind } from '@/lib/bubble';
import { bubbleFor } from '@/lib/bubble';
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
        role={kind === 'error' ? 'alert' : 'status'}
        className="relative min-w-0 flex-1 rounded-gh-lg border border-gh-line bg-gh-surface-200 px-3.5 py-3 text-[15px] font-semibold leading-5 text-gh-ink shadow-gh-menu before:absolute before:-left-[7px] before:bottom-4 before:h-3 before:w-3 before:rotate-45 before:border-b before:border-l before:border-gh-line before:bg-gh-surface-200 before:content-['']">
        {message}
      </div>
    </div>
  );
};
```
Export it from `src/components/brand/index.ts`: `export { RosettenBubble } from './RosettenBubble';`

- [ ] **Step 2: The toast API** `src/lib/toast.ts`

```tsx
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
```
(The file is `.ts` in the plan text for brevity: it contains JSX, so create it as `src/lib/toast.tsx`.)

- [ ] **Step 3: Swap the imports** in the ten files: `import { toast } from 'sonner';` → `import { toast } from '@/lib/toast';`

```bash
for f in src/Home/hooks/useHome.ts src/AcceptInvitation/hooks/useAcceptInvitation.ts src/components/AuthTester.tsx src/components/auth/AuthPage.tsx src/Profile/hooks/useProfile.ts src/components/auth/AuthProvider.tsx src/Onboarding/index.tsx src/PublicWishlist/hooks/usePublicWishlist.ts src/Wishlist/hooks/useOrganizerWishlist.ts src/Wishlist/hooks/useOwnerWishlist.ts; do
  grep -c "import { toast } from 'sonner';" $f | grep -q '^1$' || echo "CHECK $f"
  sed -i '' "s#import { toast } from 'sonner';#import { toast } from '@/lib/toast';#" $f
done
grep -rn "from 'sonner'" src | grep -v "src/lib/toast.tsx\|src/components/ui/sonner.tsx"
```
Expected: no `CHECK` lines and the final `grep` prints nothing. (`AuthTester.tsx` may call other sonner methods: if tsc complains there, give that file its own `toast.info` instead.)

- [ ] **Step 4: The Toaster.** In `src/components/ui/sonner.tsx` replace the `toastOptions` block so the custom bubble is not wrapped in sonner's own card, and limit to two:

```tsx
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      visibleToasts={2}
      offset={{ bottom: 'calc(16px + env(safe-area-inset-bottom))', right: 16 }}
      mobileOffset={{ bottom: 'calc(16px + env(safe-area-inset-bottom))', left: 16, right: 16 }}
      toastOptions={{ unstyled: true }}
      {...props}
    />
```
(The `Sonner` version in use must support `offset`/`mobileOffset` objects: if tsc rejects them, use numeric `offset={16}` and add `style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}` on the Toaster.)

- [ ] **Step 5: Motion.** Append to `src/index.css`:

```css
@keyframes rs-hop {
  0%, 100% { transform: translateY(0); }
  35% { transform: translateY(-14px); }
  60% { transform: translateY(0); }
  75% { transform: translateY(-5px); }
}
@keyframes rs-nod {
  0%, 100% { transform: rotate(0); }
  40% { transform: rotate(-6deg); }
  70% { transform: rotate(4deg); }
}
@keyframes rs-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-5px); }
  45% { transform: translateX(5px); }
  70% { transform: translateX(-3px); }
}
.rs-hop { animation: rs-hop 0.6s ease-out 1; }
.rs-nod { animation: rs-nod 0.6s ease-in-out 1; }
.rs-shake { animation: rs-shake 0.5s ease-in-out 1; }
@media (prefers-reduced-motion: reduce) {
  .rs-hop, .rs-nod, .rs-shake { animation: none; }
}
```

- [ ] **Step 6: Check and commit**

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep "error TS" | cut -c1-200; npm run lint 2>&1 | grep problems; npm run build 2>&1 | tail -1; npm run test:unit 2>&1 | grep -E "ℹ (pass|fail)"`
Expected: no tsc errors; lint ≤ 10; build succeeds; 116 pass.

```bash
git add src
git commit -m "feat(lively): Rosetten says it in a speech bubble instead of a toast"
```

---

### Task 4: Peeking over the list card

**Files:**
- Create: `src/components/brand/Peek.tsx`
- Modify: `src/components/brand/Rosetten.tsx` (export `RosettenPeek`), `src/components/brand/index.ts`, `src/Home/components/ListSection.tsx`, `src/index.css`

**Interfaces:**
- Consumes: `canPeek`, `recordPeek`, `loadState`, `saveState`, `mischiefRoute` (Task 1), `useCanPlay` (Task 2).
- Produces: `<Peek>{card}</Peek>`: wraps a card; on hover (fine pointer) or when the card scrolls into view (touch) Rosetten sometimes peeks over its top edge.

- [ ] **Step 1: The peeking figure.** Append to `src/components/brand/Rosetten.tsx` a small component that draws only the bow, lid and eyes (the body stays behind the card). It sits in a 200×84 box whose bottom edge is the card's top edge:

```tsx
/** Rosetten from the lid up, to peek over a card's edge. Look direction is -1..1. */
export const RosettenPeek = ({ look = 0, className }: { look?: number; className?: string }) => (
  <svg viewBox="0 0 200 84" width={120} height={50} aria-hidden="true" className={cn('text-gh-ink', className)}>
    <g {...STROKE}>
      <path d="M100 52C78 6 38 22 62 50C72 58 92 56 100 52Z" fill={ROSETT.pink} />
      <path d="M100 52C122 6 162 22 138 50C128 58 108 56 100 52Z" fill={ROSETT.pink} />
      <rect x="40" y="52" width="120" height="40" rx="12" fill={ROSETT.deep} />
      <rect x="90" y="52" width="20" height="40" fill={ROSETT.cream} />
      <rect x="90" y="40" width="20" height="18" rx="7" fill={ROSETT.cream} />
    </g>
    <g fill={ROSETT.ink}>
      <ellipse cx={66 + look * 6} cy={74} rx={5} ry={6} />
      <ellipse cx={134 + look * 6} cy={74} rx={5} ry={6} />
    </g>
  </svg>
);
```
Export from `index.ts`: `RosettenPeek`.

- [ ] **Step 2: Keyframes.** Append to `src/index.css`:

```css
@keyframes rs-peek {
  0% { transform: translateY(100%); }
  14% { transform: translateY(0); }
  86% { transform: translateY(0); }
  100% { transform: translateY(100%); }
}
.rs-peek { animation: rs-peek 1.4s ease-out 1 both; }
@media (prefers-reduced-motion: reduce) {
  .rs-peek { animation: none; }
}
```

- [ ] **Step 3: The wrapper** `src/components/brand/Peek.tsx`

```tsx
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { canPeek, loadState, mischiefRoute, recordPeek, saveState } from '@/lib/mischief';
import { useCanPlay } from '@/lib/playful';
import { RosettenPeek } from './Rosetten';

/**
 * Wraps a card. Now and then Rosetten peeks over its top edge, behind the card, never taking a click.
 * Mouse: when the pointer enters the card. Touch: when the card scrolls into view.
 */
export const Peek = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const allowed = useCanPlay() && mischiefRoute(pathname);
  const wrapper = useRef<HTMLDivElement>(null);
  const [showing, setShowing] = useState<{ left: number; look: number } | null>(null);
  const timer = useRef<number>();

  const tryPeek = useCallback(() => {
    if (!allowed || showing) return;
    const now = Date.now();
    const state = loadState(sessionStorage);
    if (!canPeek(state, now, Math.random)) return;
    saveState(sessionStorage, recordPeek(state, now));
    setShowing({ left: 40 + Math.random() * 50, look: Math.random() * 2 - 1 });
    timer.current = window.setTimeout(() => setShowing(null), 1400);
  }, [allowed, showing]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    const el = wrapper.current;
    if (!allowed || !el || !window.matchMedia('(hover: none)').matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) tryPeek();
      },
      { threshold: 0.9 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [allowed, tryPeek]);

  return (
    <div ref={wrapper} className="relative" onPointerEnter={(event) => event.pointerType === 'mouse' && tryPeek()}>
      {showing && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-full z-0 overflow-hidden"
          style={{ left: `${showing.left}%`, width: 120, height: 50, marginBottom: -1 }}>
          <div className="rs-peek">
            <RosettenPeek look={showing.look} />
          </div>
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
```

- [ ] **Step 4: Use it on Home.** In `src/Home/components/ListSection.tsx` wrap the `ul` in `<Peek>`:

```tsx
import { Peek } from '@/components/brand/Peek';
…
    <SectionHeader title={title} count={count} />
    <Peek>
      <ul className="…unchanged…">
        {children}
      </ul>
    </Peek>
```
(The Profile page's cards are single forms, so Peek is used only on Home's list sections in this first version.)

- [ ] **Step 5: Check and commit**

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep "error TS" | cut -c1-200; npm run lint 2>&1 | grep -E "src/components/brand|ListSection|problems"; npm run build 2>&1 | tail -1`
Expected: no tsc errors; no new lint problem (total 10); build succeeds. (Lint's `react-hooks/exhaustive-deps` may ask for `showing` in an effect: keep the dependency list as written.)

```bash
git add src
git commit -m "feat(lively): Rosetten sometimes peeks over the list cards on Home"
```

---

### Task 5: The runner

**Files:**
- Create: `src/components/brand/RosettenRunner.tsx`
- Modify: `src/components/brand/Rosetten.tsx` (export `RosettenRun`), `src/components/brand/index.ts`, `src/App.tsx`, `src/index.css`

**Interfaces:**
- Consumes: `canRun`, `recordRun`, `loadState`, `saveState`, `mischiefRoute` (Task 1), `useCanPlay` (Task 2).

- [ ] **Step 1: The running figure.** Append to `Rosetten.tsx` a tilted figure with two leg positions that swap with CSS (`rs-step`):

```tsx
/** Rosetten in mid-run, seen from the front, leaning forward. Two leg positions swap via CSS. */
export const RosettenRun = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 200" width={84} height={84} aria-hidden="true" className={cn('text-gh-ink', className)}>
    <g transform="rotate(8 100 190)">
      <ellipse cx="100" cy="194" rx="46" ry="5" fill="currentColor" opacity=".1" />
      <g {...STROKE}>
        <path d="M48 130C30 140 24 118 34 108" fill="none" />
        <path d="M152 130C170 120 176 142 166 152" fill="none" />
        <g className="rs-step-a">
          <rect x="56" y="172" width="24" height="14" rx="7" fill={ROSETT.deep} transform="rotate(-18 68 179)" />
          <rect x="118" y="178" width="24" height="14" rx="7" fill={ROSETT.deep} transform="rotate(14 130 185)" />
        </g>
        <g className="rs-step-b">
          <rect x="62" y="178" width="24" height="14" rx="7" fill={ROSETT.deep} transform="rotate(14 74 185)" />
          <rect x="112" y="172" width="24" height="14" rx="7" fill={ROSETT.deep} transform="rotate(-18 124 179)" />
        </g>
        <rect x="48" y="98" width="104" height="82" rx="16" fill={ROSETT.pink} />
        <rect x="40" y="76" width="120" height="32" rx="12" fill={ROSETT.deep} />
        <rect x="90" y="76" width="20" height="32" fill={ROSETT.cream} />
        <path d="M100 76C80 40 44 56 64 78C74 86 92 82 100 76Z" fill={ROSETT.pink} />
        <path d="M100 76C120 40 156 56 136 78C126 86 108 82 100 76Z" fill={ROSETT.pink} />
        <rect x="90" y="64" width="20" height="18" rx="7" fill={ROSETT.cream} />
      </g>
      <g fill={ROSETT.ink}>
        <ellipse cx="86" cy="130" rx="6" ry="7" />
        <ellipse cx="122" cy="130" rx="6" ry="7" />
      </g>
      <path d="M94 148Q104 158 114 148" fill="none" stroke={ROSETT.ink} strokeWidth={4} strokeLinecap="round" />
    </g>
  </svg>
);
```
Export from `index.ts`. (`rs-step-a` and `rs-step-b` need `cn` imported in the file, already imported in PR #54.)

- [ ] **Step 2: Keyframes.** Append to `src/index.css`:

```css
@keyframes rs-run {
  from { transform: translateX(-120px); }
  to { transform: translateX(calc(100vw + 120px)); }
}
@keyframes rs-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
@keyframes rs-step-a { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
@keyframes rs-step-b { 0%, 49% { opacity: 0; } 50%, 100% { opacity: 1; } }
.rs-runner { animation: rs-run 6s linear 1 both; }
.rs-runner > svg { animation: rs-bounce 0.5s ease-in-out infinite; }
.rs-step-a { animation: rs-step-a 0.5s steps(1) infinite; }
.rs-step-b { animation: rs-step-b 0.5s steps(1) infinite; }
@media (prefers-reduced-motion: reduce) {
  .rs-runner, .rs-runner > svg, .rs-step-a, .rs-step-b { animation: none; }
}
```

- [ ] **Step 3: The runner** `src/components/brand/RosettenRunner.tsx`

```tsx
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { canRun, loadState, mischiefRoute, recordRun, saveState } from '@/lib/mischief';
import { useCanPlay } from '@/lib/playful';
import { RosettenRun } from './Rosetten';

const RUN_MS = 6000;
const CHECK_MS = 15_000;

/** One instance in the app shell: now and then a small Rosetten runs along the bottom on the calm screens. */
export const RosettenRunner = () => {
  const { pathname } = useLocation();
  const canPlay = useCanPlay();
  const [run, setRun] = useState<{ id: number; flip: boolean } | null>(null);
  const arrivedAt = useRef(Date.now());

  useEffect(() => {
    arrivedAt.current = Date.now();
    setRun(null);
  }, [pathname]);

  useEffect(() => {
    if (!canPlay || !mischiefRoute(pathname) || window.matchMedia('(hover: none)').matches) return;
    let clear: number | undefined;
    const check = window.setInterval(() => {
      const now = Date.now();
      const state = loadState(sessionStorage);
      if (!canRun(state, now, now - arrivedAt.current) || Math.random() > 0.5) return;
      saveState(sessionStorage, recordRun(state, now));
      setRun({ id: now, flip: Math.random() < 0.5 });
      clear = window.setTimeout(() => setRun(null), RUN_MS);
    }, CHECK_MS);
    return () => {
      window.clearInterval(check);
      window.clearTimeout(clear);
    };
  }, [canPlay, pathname]);

  if (!run) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 z-40 overflow-hidden"
      style={{ bottom: 'calc(6px + env(safe-area-inset-bottom))', height: 96, transform: run.flip ? 'scaleX(-1)' : undefined }}>
      <div key={run.id} className="rs-runner absolute bottom-0 left-0">
        <RosettenRun />
      </div>
    </div>
  );
};
```
(Mirrored with `scaleX(-1)` so he can run right to left; the face is symmetrical.)

- [ ] **Step 4: Mount it** in `src/App.tsx`, inside `<AuthProvider>` after `</Routes>`, next to the commented-out tester: add `import { RosettenRunner } from '@/components/brand';` at the top and `<RosettenRunner />` after `</Routes>`.

- [ ] **Step 5: Check and commit**

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep "error TS" | cut -c1-200; npm run lint 2>&1 | grep problems; npm run build 2>&1 | tail -1; npm run test:unit 2>&1 | grep -E "ℹ (pass|fail)"`
Expected: no tsc errors; lint ≤ 10; build succeeds; 116 pass.

```bash
git add src
git commit -m "feat(lively): Rosetten now and then runs along the bottom on the calm screens"
```

---

### Task 6: Browser verification, docs, final checks

(Chrome DevTools MCP, local Supabase, `npm run dev` in this worktree; seed as before: Erik with lists, newbie, Anna.)

- [ ] **Step 1: Speech bubble.** At 390×844 and 1280×900, light and dark: create a list (success: happy, hop), save a wrong password (error: sad, shake, stays about 6 s), trigger an info toast; the bubble sits bottom-right on desktop and full width at the bottom on mobile above the home indicator; two toasts at once stack, a third drops the oldest; swipe-to-dismiss works; text is announced (`role` status/alert). On a bottom sheet (new list) the bubble does not cover the primary button.
- [ ] **Step 2: Peek.** On Home (desktop) hover the list cards repeatedly (to beat the 35 %): Rosetten pops up behind the top edge, looks sideways, ducks; not more than once per 20 s, at most four per session (check `sessionStorage['gifthunt-mischief']`); clicking the card still works; nothing happens on `/wishlist/…`, `/shared/…`; on a touch emulation it peeks when a card scrolls into view.
- [ ] **Step 3: Runner.** To avoid waiting, in the console run `sessionStorage.clear()` and temporarily test by calling the interval path with a short `RUN`/`CHECK_MS` through a local edit that is **not committed** (45 s page age and 15 s checks make a natural run take a minute or more): Rosetten crosses the bottom in about 6 s with bouncing legs, can run in both directions, does not block clicks on buttons beneath him, and does not appear on `/wishlist/…` or on touch emulation.
- [ ] **Step 4: Off.** Profile: the "Lekfull maskot" switch off (persisted across reload); no peek, no runner, bubble stands still. Emulate `prefers-reduced-motion: reduce`: same. Switch the tab away while a run is scheduled: no run happens in the background.
- [ ] **Step 5:** Console has no errors; no horizontal scroll at 390 px; Profile layout with the new switch looks right at 390 and 1280.

Record anything that does not match as a defect and fix it before Step 6.

- [ ] **Step 6: Docs.** `CLAUDE.md`, in the **Brand** bullet, append: "Mischief: the `Peek` wrapper (Home list cards) and `RosettenRunner` (app shell) are allowed only on the calm routes in `mischiefRoute` (never `/wishlist/*`, `/shared/*`); limits are in `src/lib/mischief.ts`. All toasts go through `@/lib/toast` (Rosetten's speech bubble): import `toast` from there, never from `sonner`. The Profile switch `Lekfull maskot` and reduced motion stop everything that moves." Add the same two sentences to the design system README brand bullet (read the live file, edit, publish it, as in PR #54).
- [ ] **Step 7: Final checks and commit**

Run: `npm run test:unit 2>&1 | grep -E "ℹ (pass|fail)"; npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"; npm run lint 2>&1 | grep problems; npm run build 2>&1 | tail -1`
Expected: 116 pass; tsc `0`; lint ≤ 10; build succeeds. No database change.

```bash
git add CLAUDE.md docs/superpowers/plans/2026-10-22-rosetten-lively.md
git commit -m "docs(lively): Rosetten's mischief and the speech bubble"
```
