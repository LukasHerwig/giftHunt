# Rosetten moods in the speech bubble – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The speech-bubble Rosetten shows a face that fits what happened (created: glad, saved: a wink, welcome: heart eyes, deleted: tearful, errors: startled, link turned off: asleep …) and blinks on his own, so he feels alive.

**Architecture:** Four new poses (`wink`, `love`, `teary`, `oops`) join the existing ones in `Rosetten.tsx`. `toast.success/error/info(message, pose?)` takes an optional pose; without one the kind decides (success glad, info hello, error startled). A pure `bubbleFor(kind, pose?)` returns pose, motion and duration; each call site passes its pose from the table below. Blinking is a CSS animation that only runs inside `.rs-alive` (the bubble, when lively), so static uses (empty states, the 404) never blink.

**Tech Stack:** React + TypeScript, inline SVG + CSS keyframes, `node:test`.

**Design:** brand canvas https://claude.ai/artifact/Aihm5Q1LPi7j9Xri3fytHR, board **Rosetten: miner i pratbubblan** (four new faces and which message gets which). Builds on the branch `rosetten-lively` (speech bubble, peek, runner).

## Global Constraints

- All moods stay inside the same rules as the bubble: reduced motion or "Lekfull maskot" off means no movement and no blinking (the face still changes).
- Poses are decorative (`aria-hidden`); the message text is what is announced.
- The moods never say more than the message: nothing that hints at what is taken.
- Mascot fills come from `palette.ts` only; outline follows the theme (`text-gh-ink`), faces stay dark on the pink body.
- Existing poses and uses (empty states, 404, loader) are unchanged; only the bubble gains the new poses and the blink.
- Baselines: unit tests 117, `tsc` 0 errors, lint 10 problems (3 errors, 7 warnings).

## Review Focus

- **Every toast call has a deliberate pose:** the table below is the source; no call is left on a mismatched default (e.g. a deletion showing a cheering Rosetten). (Task 3)
- **Calm when asked:** with the switch off or reduced motion, no mood moves or blinks. (Task 2, Task 4)
- **Readability on dark:** the new faces (heart eyes, tears, startled eyes) read on both themes. (Task 4)
- **No layout shift:** the bubble keeps its size whichever pose is used. (Task 4)

## File structure

| File | Responsibility |
|---|---|
| `src/lib/bubble.ts` (+test) | `bubbleFor(kind, pose?)` → pose, motion, duration |
| `src/components/brand/palette.ts` | `heart` fill |
| `src/components/brand/Rosetten.tsx` | poses `wink`, `love`, `teary`, `oops`; blink class on eyes |
| `src/components/brand/RosettenBubble.tsx` | motion class from `bubbleFor`, `rs-alive` |
| `src/lib/toast.tsx` | optional `pose` argument |
| `src/index.css` | keyframes `rs-pulse`, `rs-sway`, `rs-breathe`, `rs-blink` |
| the files that toast | pose per call (table in Task 3) |

---

### Task 1: Pose and motion rules (pure, tested)

**Files:** Modify `src/lib/bubble.ts`, `src/lib/bubble.test.ts`

**Interfaces:**
- Produces: `type BubblePose = 'hello' | 'happy' | 'sleep' | 'lost' | 'sad' | 'locked' | 'wink' | 'love' | 'teary' | 'oops'`; `type BubbleMotion = 'hop' | 'nod' | 'pulse' | 'sway' | 'breathe' | 'shake'`; `bubbleFor(kind: ToastKind, pose?: BubblePose): { pose: BubblePose; motion: BubbleMotion; durationMs: number }`.

- [ ] **Step 1: Replace `src/lib/bubble.test.ts`** (the old test describes the old return shape):

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bubbleFor } from './bubble.ts';

test('without a pose the kind decides: glad, hello, startled; errors stay longer', () => {
  assert.deepEqual(bubbleFor('success'), { pose: 'happy', motion: 'hop', durationMs: 4000 });
  assert.deepEqual(bubbleFor('info'), { pose: 'hello', motion: 'nod', durationMs: 4000 });
  assert.deepEqual(bubbleFor('error'), { pose: 'oops', motion: 'shake', durationMs: 6000 });
});

test('a given pose wins, with the motion that fits it', () => {
  assert.deepEqual(bubbleFor('success', 'wink'), { pose: 'wink', motion: 'nod', durationMs: 4000 });
  assert.deepEqual(bubbleFor('success', 'love'), { pose: 'love', motion: 'pulse', durationMs: 4000 });
  assert.deepEqual(bubbleFor('success', 'teary'), { pose: 'teary', motion: 'sway', durationMs: 4000 });
  assert.deepEqual(bubbleFor('success', 'sleep'), { pose: 'sleep', motion: 'breathe', durationMs: 4000 });
  assert.deepEqual(bubbleFor('error', 'lost'), { pose: 'lost', motion: 'sway', durationMs: 6000 });
});

test('every pose has a motion', () => {
  for (const pose of ['hello', 'happy', 'sleep', 'lost', 'sad', 'locked', 'wink', 'love', 'teary', 'oops'] as const) {
    assert.ok(bubbleFor('info', pose).motion, pose);
  }
});
```

- [ ] **Step 2: Run to verify it fails.** Run: `npm run test:unit 2>&1 | grep -E "ℹ (tests|pass|fail)|not ok" | head`. Expected: FAIL (old shape, unknown poses).

- [ ] **Step 3: Implement** `src/lib/bubble.ts`:

```ts
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
```

- [ ] **Step 4: Run to verify it passes.** Run: `npm run test:unit 2>&1 | grep -E "ℹ (tests|pass|fail)"`. Expected: 119 pass (117 − 1 old + 3 new). `tsc` will report errors in `RosettenBubble.tsx` and `toast.tsx` until Task 3 (they use the old shape): fix them in Task 3; commit Tasks 1–3 as separate commits only when `tsc` is clean, so hold this commit until Step 3 of Task 3 (or commit with `--no-verify`: no hooks run here, so a red `tsc` between commits is acceptable but note it in the ledger).

---

### Task 2: The new faces and the blink

**Files:** Modify `src/components/brand/palette.ts`, `src/components/brand/Rosetten.tsx`, `src/index.css`

**Interfaces:**
- Produces: `RosettenPose` gains `'wink' | 'love' | 'teary' | 'oops'`.

- [ ] **Step 1: Palette.** Add `heart: '#E5707A',` to `ROSETT` in `palette.ts`.

- [ ] **Step 2: Poses.** In `Rosetten.tsx`: extend the union
`export type RosettenPose = 'hello' | 'happy' | 'sleep' | 'lost' | 'sad' | 'locked' | 'wink' | 'love' | 'teary' | 'oops';`
add the class `rs-blink` to the eye `<g>` of `RoundEyes` (`<g fill={ROSETT.ink} className="rs-blink">`), and add four entries to `POSES` (after `locked`):

```tsx
  wink: () => (
    <Figure
      leftArm={ARM_DOWN_LEFT}
      rightArm="M152 132C172 126 176 108 164 98"
      extras={<path d="M146 84L150 92L158 96L150 100L146 108L142 100L134 96L142 92Z" fill={ROSETT.gold} strokeWidth={2.5} />}
      face={
        <>
          <g fill={ROSETT.ink} className="rs-blink">
            <ellipse cx="82" cy="130" rx="6" ry="7" />
          </g>
          <circle cx="84" cy="127" r="2.2" fill={ROSETT.highlight} />
          <path d="M110 132Q118 122 126 132" {...line} />
          <path d="M90 146Q100 158 110 146" {...line} />
        </>
      }
    />
  ),
  love: () => (
    <Figure
      leftArm="M48 134C32 128 34 112 50 112"
      rightArm="M152 134C168 128 166 112 150 112"
      extras={
        <>
          <path d="M164 60C156 54 156 46 161 46C163 46 164 47 164 49C164 47 165 46 167 46C172 46 172 54 164 60Z" fill={ROSETT.heart} strokeWidth={2.5} />
          <path d="M180 38C176 35 176 31 178 31C180 31 180 32 180 33C180 32 181 31 182 31C185 31 185 35 180 38Z" fill={ROSETT.heart} strokeWidth={2.5} />
        </>
      }
      face={
        <>
          <ellipse cx="68" cy="148" rx="10" ry="6" fill={ROSETT.heart} opacity=".55" />
          <ellipse cx="132" cy="148" rx="10" ry="6" fill={ROSETT.heart} opacity=".55" />
          <g fill={ROSETT.heart} stroke={ROSETT.ink} strokeWidth={3} strokeLinejoin="round">
            <path d="M82 140C68 130 68 118 77 118C80 118 82 120 82 123C82 120 84 118 87 118C96 118 96 130 82 140Z" />
            <path d="M118 140C104 130 104 118 113 118C116 118 118 120 118 123C118 120 120 118 123 118C132 118 132 130 118 140Z" />
          </g>
          <path d="M90 150Q100 162 110 150" {...line} />
        </>
      }
    />
  ),
  teary: () => (
    <Figure
      leftArm={ARM_DOWN_LEFT}
      rightArm={ARM_DOWN_RIGHT}
      droop
      overlay={
        <g fill={ROSETT.tear} stroke={ROSETT.ink} strokeWidth={2}>
          <path d="M72 142C67 152 77 152 72 142Z" />
          <path d="M128 142C123 152 133 152 128 142Z" />
        </g>
      }
      face={
        <>
          <g fill={ROSETT.ink} className="rs-blink">
            <ellipse cx="82" cy="130" rx="8" ry="9" />
            <ellipse cx="118" cy="130" rx="8" ry="9" />
          </g>
          <g fill={ROSETT.highlight}>
            <circle cx="85" cy="126" r="3.4" />
            <circle cx="121" cy="126" r="3.4" />
            <circle cx="80" cy="134" r="1.6" />
            <circle cx="116" cy="134" r="1.6" />
          </g>
          <path d="M72 120L90 112M128 120L110 112" {...line} />
          <path d="M92 154Q100 147 108 154" {...line} />
        </>
      }
    />
  ),
  oops: () => (
    <Figure
      leftArm="M48 134C32 126 38 110 56 114"
      rightArm="M152 134C168 126 162 110 144 114"
      overlay={<path d="M158 92C152 102 162 102 158 92Z" fill={ROSETT.tear} stroke={ROSETT.ink} strokeWidth={2} />}
      face={
        <>
          <g fill={ROSETT.highlight} stroke={ROSETT.ink} strokeWidth={3}>
            <circle cx="82" cy="130" r="10" />
            <circle cx="118" cy="130" r="10" />
          </g>
          <g fill={ROSETT.ink} className="rs-blink">
            <circle cx="82" cy="131" r="3.6" />
            <circle cx="118" cy="131" r="3.6" />
          </g>
          <ellipse cx="100" cy="154" rx="6" ry="8" fill={ROSETT.ink} />
        </>
      }
    />
  ),
```

- [ ] **Step 3: Keyframes.** Append to `src/index.css`:

```css
@keyframes rs-pulse {
  0%, 100% { transform: scale(1); }
  40% { transform: scale(1.08); }
  70% { transform: scale(0.98); }
}
@keyframes rs-sway {
  0%, 100% { transform: rotate(0); }
  35% { transform: rotate(-4deg); }
  70% { transform: rotate(3deg); }
}
@keyframes rs-breathe {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.03); }
}
@keyframes rs-blink {
  0%, 92%, 100% { transform: scaleY(1); }
  96% { transform: scaleY(0.1); }
}
.rs-pulse { animation: rs-pulse 0.7s ease-in-out 1; }
.rs-sway { animation: rs-sway 1.2s ease-in-out 1; }
.rs-breathe { transform-origin: 50% 100%; animation: rs-breathe 2.4s ease-in-out infinite; }
.rs-alive .rs-blink { transform-box: fill-box; transform-origin: center; animation: rs-blink 3.6s infinite; }
@media (prefers-reduced-motion: reduce) {
  .rs-pulse, .rs-sway, .rs-breathe, .rs-alive .rs-blink { animation: none; }
}
```

- [ ] **Step 4: Check.** Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep "error TS" | cut -c1-160` (only the Task 1 shape errors in `RosettenBubble.tsx`/`toast.tsx` may remain), `npm run lint 2>&1 | grep problems`.

---

### Task 3: The pose argument and the call sites

**Files:** Modify `src/components/brand/RosettenBubble.tsx`, `src/lib/toast.tsx`, and the files below.

**Interfaces:**
- Consumes: `bubbleFor`, `BubblePose` (Task 1), poses (Task 2).
- Produces: `toast.success(message, pose?)`, `toast.error(message, pose?)`, `toast.info(message, pose?)`.

- [ ] **Step 1: Bubble.** In `RosettenBubble.tsx` replace the import of `bubbleFor, ToastKind` and the component head/figure so the pose and motion come from `bubbleFor(kind, pose)`:

```tsx
import { cn } from '@/lib/utils';
import { bubbleFor, type BubblePose, type ToastKind } from '@/lib/bubble';
import { Rosetten } from './Rosetten';

interface RosettenBubbleProps {
  kind: ToastKind;
  message: string;
  pose?: BubblePose;
  /** False when the person turned the mascot off or asked for less motion: he stands still. */
  lively: boolean;
}

/** Rosetten says it himself, from the corner. The text is the live message; the figure is decoration. */
export const RosettenBubble = ({ kind, message, pose, lively }: RosettenBubbleProps) => {
  const look = bubbleFor(kind, pose);
  return (
    <div className="flex w-[min(360px,calc(100vw-32px))] items-end gap-1.5">
      <Rosetten
        pose={look.pose}
        size={72}
        className={cn('flex-none', lively && `rs-alive rs-${look.motion}`)}
      />
      <div className="relative min-w-0 flex-1 …unchanged classes…">{message}</div>
    </div>
  );
};
```
(Keep the bubble `div`'s class string exactly as it is now.) `Rosetten`'s `pose` prop type is `RosettenPose`, which now includes every `BubblePose`: if tsc complains, import `RosettenPose` and make `BubblePose` equal to it by re-exporting (`export type BubblePose = RosettenPose` is not possible in the pure module: keep the two unions identical).

- [ ] **Step 2: toast.tsx.** Replace `say` and `toast`:

```tsx
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
```
with `import { bubbleFor, type BubblePose, type ToastKind } from '@/lib/bubble';`.

- [ ] **Step 3: The call sites.** Apply this table: pose = the second argument to add (default for `success` is glad (`happy`), for `error` startled (`oops`), for `info` `hello`: calls with the default get no argument).

| Message key (toast call) | Pose |
|---|---|
| `home.toast.created`, `wishlist.toast.added`, `wishlist.org.toast.linkOn` (see ternary) | default (glad) |
| `auth.toast.welcomeBack`, `auth.toast.accountCreated`, `home.toast.accepted`, `acceptInvitation.accepted`, `onboarding.welcomeComplete` | `'love'` |
| `profile.toast.saved`, `wishlist.toast.saved`, `wishlist.toast.settingsSaved`, `wishlist.toast.requestSent`, `wishlist.toast.requestRemoveSent`, `wishlist.org.toast.madeFree`, `wishlist.org.toast.linkCopied`, `wishlist.org.toast.approved`, `wishlist.org.toast.kept` | `'wink'` |
| `wishlist.toast.removed`, `wishlist.toast.listDeleted`, `home.toast.declined`, `wishlist.org.toast.claimRemoved`, `wishlist.toast.organizerRemoved`, `wishlist.toast.inviteRevoked`, `wishlist.toast.requestWithdrawn` | `'teary'` |
| `auth.signedOut`, `auth.sessionExpired`, `wishlist.org.toast.linkOff` (see ternary) | `'sleep'` |
| errors that say something is gone: `home.toast.invitationGone`, `wishlist.toast.itemGone`, `wishlist.org.toast.itemGone`, `wishlist.org.toast.claimGone`, `wishlist.org.toast.linkGone`, `wishlist.org.toast.requestAnswered`, `wishlist.toast.listChanged` | `'lost'` |
| all other errors | default (startled) |
| info toasts (`AuthTester`) | default |

Three calls choose by a condition; edit them by hand:
- `toast.success(t(shared ? 'wishlist.toast.requestRemoveSent' : 'wishlist.toast.removed'))` → add `, shared ? 'wink' : 'teary'`
- `toast.success(t(approve ? 'wishlist.org.toast.approved' : 'wishlist.org.toast.kept'))` → add `, 'wink'`
- `toast.success(t(active ? 'wishlist.org.toast.linkOn' : 'wishlist.org.toast.linkOff'))` → add `, active ? 'happy' : 'sleep'`

Script the plain ones:

```bash
python3 -I - <<'EOF'
import re, subprocess
POSE = {}
for key in ['auth.toast.welcomeBack','auth.toast.accountCreated','home.toast.accepted','acceptInvitation.accepted','onboarding.welcomeComplete']: POSE[key] = 'love'
for key in ['profile.toast.saved','wishlist.toast.saved','wishlist.toast.settingsSaved','wishlist.toast.requestSent','wishlist.org.toast.madeFree','wishlist.org.toast.linkCopied']: POSE[key] = 'wink'
for key in ['wishlist.toast.listDeleted','home.toast.declined','wishlist.org.toast.claimRemoved','wishlist.toast.organizerRemoved','wishlist.toast.inviteRevoked','wishlist.toast.requestWithdrawn']: POSE[key] = 'teary'
for key in ['auth.signedOut','auth.sessionExpired']: POSE[key] = 'sleep'
for key in ['home.toast.invitationGone','wishlist.toast.itemGone','wishlist.org.toast.itemGone','wishlist.org.toast.claimGone','wishlist.org.toast.linkGone','wishlist.org.toast.requestAnswered','wishlist.toast.listChanged']: POSE[key] = 'lost'
pattern = re.compile(r"(toast\.(?:success|error|info)\(\s*(?:i18n\.)?t\('([^']+)'\))\s*\)")
files = subprocess.run(['git', 'ls-files', 'src'], capture_output=True, text=True).stdout.split()
total = 0
for path in files:
    if not path.endswith(('.ts', '.tsx')) or path.endswith('toast.tsx'):
        continue
    s = open(path).read()
    def sub(m):
        global total
        pose = POSE.get(m.group(2))
        if not pose:
            return m.group(0)
        total += 1
        return f"{m.group(1)}, '{pose}')"
    new = pattern.sub(sub, s)
    if new != s:
        open(path, 'w').write(new)
print('changed calls:', total)
EOF
grep -rn "toast\.\(success\|error\|info\)(" src --include='*.ts' --include='*.tsx' | grep "removed'\|approve\|active ?" | cut -c1-170
```
Expected: `changed calls: 21` or close (every plain-key row in the table, counting each call site once; `wishlist.toast.removed` and the three conditional calls are not in the script). Then apply the three conditional edits by hand and the plain `wishlist.toast.removed` / `requestRemoveSent` ones (`wishlist.toast.removed` appears twice, in the owner and organizer hooks: `'teary'`).

- [ ] **Step 4: Check and commit.** Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"; npm run lint 2>&1 | grep problems; npm run build 2>&1 | tail -1; npm run test:unit 2>&1 | grep -E "ℹ (pass|fail)"`. Expected: `0`; lint ≤ 10; build succeeds; 119 pass.

```bash
git add src docs
git commit -m "feat(moods): Rosetten's face in the bubble fits what happened, and he blinks"
```

---

### Task 4: Browser verification and docs

(Chrome DevTools MCP, local Supabase, `npm run dev` in this worktree.)

- [ ] **Step 1: Every face.** In the console of a signed-in page, import the toast module (Vite serves it as one shared module) and fire each pose: `const { toast } = await import('/src/lib/toast.tsx'); for (const pose of ['happy','wink','love','teary','sleep','lost','oops','hello']) toast.info(pose, pose)`. Screenshot at 390 px, light and dark: each face reads, the bubble keeps its size, outline and eyes are visible on dark.
- [ ] **Step 2: Real actions.** Create a list (glad), save the name on Profile (wink), delete a list or remove a wish (tearful), turn the share link off (asleep), sign in (heart eyes), wrong password (startled), open a gone invitation (lost).
- [ ] **Step 3: Calm.** With "Lekfull maskot" off, and with reduced motion emulated: faces change but nothing moves or blinks (`getComputedStyle(...).animationName` is `none` on the figure and its eyes).
- [ ] **Step 4: Docs.** `CLAUDE.md`: in the Brand bullet's toast sentence add "Pass a pose as the second argument when the message has a clear mood: `toast.success(msg, 'wink')` (poses: happy default for success, hello for info, oops for errors; wink saved, love welcome, teary removed, sleep turned off, lost gone)." and the same sentence in the design system README (read the live file, edit, publish).
- [ ] **Step 5: Final checks and commit.** `npm run test:unit` (119), `tsc` 0, lint ≤ 10, build.

```bash
git add CLAUDE.md docs/superpowers/plans/2026-10-22-rosetten-moods.md
git commit -m "docs(moods): Rosetten's faces in the bubble"
```
