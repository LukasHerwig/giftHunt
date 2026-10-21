# Rosetten: mascot and app icon in the app – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the chosen brand into the app: the **Rosetten** mascot (seven poses) in empty states, errors, the 404 page and loading, and the **bow icon** as the app icon, favicon and mark next to the wordmark in the header.

**Architecture:** One React component `Rosetten` with seven poses (inline SVG so the loading pose can animate and every part uses the same drawing) and one `RosettMark` (the bow icon). `EmptyState` takes a `pose` instead of a lucide icon. Static icon files in `public/` are regenerated from two SVG sources kept in `docs/brand/`. No logic, data or database change.

**Tech Stack:** React + TypeScript, Tailwind (`gh-*`), inline SVG, macOS `qlmanage`/`sips` for PNGs (one-off).

**Spec / design:** `docs/superpowers/specs/2026-10-20-ui-redesign-design.md` (brand section of the design system). Approved so far: Rosetten leads, the icon is the bow from the first proposal, the name stays GiftHunt. Design: brand canvas https://claude.ai/artifact/Aihm5Q1LPi7j9Xri3fytHR, board **Rosetten: uttryck och ikon** (seven poses and the app icon in the header on light and dark).

## Global Constraints

- Mascot rules (from the design system): one Rosett per view; always with a heading and, when something can be done, an action; never next to anything that is taken or claimed (the owner must not learn what is taken); `Skeleton` stays first for lists, cards and detail pages, the Rosett loader is only for full-screen waits.
- The mascot art has its own fixed palette (ink outline on the pink/cream body) so it reads on light and dark; those hex values live only in `src/components/brand/palette.ts`. Everything else uses `gh-*` tokens only.
- Decorative art is `aria-hidden`; the heading carries the meaning. The loader has `role="status"` and a label from `common.loading`.
- Motion: only the loader moves (float 2 s, bow wiggle 1.2 s, nothing bounces); under `prefers-reduced-motion` it stands still.
- Touch targets ≥ 44 px, text ≥ 12 px unchanged; no new colours in CSS.
- No hardcoded user-facing strings; no change to wording except the 404 page, which moves to i18n keys that already exist (`notFound.*`).
- Baselines: unit tests 110, `tsc` 0 errors, lint 10 problems (3 errors, 7 warnings).

## Review Focus

- **Dark theme:** the dark ink outline on a dark ground: the pink body and cream knot must still read; the header mark and every pose are checked on dark. (Task 5)
- **Reduced motion:** with `prefers-reduced-motion` the loader stands still. (Task 5)
- **Never beside claim data:** no pose is placed on a screen that shows what is taken (owner wishlist list, organizer taken tab). The owner's empty list and the load-failed states are the only wishlist-screen uses. (Task 3)
- **Icons:** `public/` PNGs are not blurry or on transparent backgrounds where iOS needs opaque; the maskable icon keeps the bow inside the safe zone; the favicon is legible at 16 px. (Task 2, Task 5)
- **Nothing still imports** the old `GiftHuntIcon` or the lucide icon props removed from `EmptyState`. (Task 3, Task 4)

## File structure

| File | Responsibility |
|---|---|
| `src/components/brand/palette.ts` | The mascot's fixed colours |
| `src/components/brand/Rosetten.tsx` | `Rosetten` (7 poses) and `RosettenLoader` |
| `src/components/brand/RosettMark.tsx` | The bow icon (header, auth shell) |
| `src/components/brand/index.ts` | Barrel |
| `src/index.css` | `rs-float` / `rs-wiggle` keyframes with reduced-motion guard |
| `src/components/gh/EmptyState.tsx` | `pose` prop instead of `icon` |
| `src/components/AppHeader.tsx`, `AccountShell.tsx` | the mark next to the wordmark |
| `src/pages/NotFound.tsx`, `src/Auth/components/AuthLoadingState.tsx`, `AuthProvider.tsx` | pose and loader |
| `docs/brand/icon.svg`, `icon-square.svg` | SVG sources for the icons |
| `public/icon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `favicon-*.png`, `icon.ico`, `manifest.json`, `index.html` | the app icon files |
| `CLAUDE.md`, design system README | brand rules |

---

### Task 1: The mascot components

**Files:**
- Create: `src/components/brand/palette.ts`, `Rosetten.tsx`, `RosettMark.tsx`, `index.ts`
- Modify: `src/index.css`

**Interfaces:**
- Produces: `type RosettenPose = 'hello' | 'happy' | 'sleep' | 'lost' | 'sad' | 'locked'`; `Rosetten({ pose, size?, className? })`; `RosettenLoader({ label, size?, className? })`; `RosettMark({ size?, className? })`.

- [ ] **Step 1: The palette** `src/components/brand/palette.ts`

```ts
/** The mascot's own palette: a dark outline on a pink body, so it reads on light and dark grounds. */
export const ROSETT = {
  ink: '#1C1719',
  pink: '#F59EA0',
  deep: '#EC8E91',
  cream: '#FFF6F0',
  highlight: '#FFFFFF',
  gold: '#F0C27E',
  tear: '#BFD7EA',
} as const;
```

- [ ] **Step 2: The mark** `src/components/brand/RosettMark.tsx` (the bow, drawn in a 64 px box)

```tsx
import { ROSETT } from './palette';

interface RosettMarkProps {
  size?: number;
  className?: string;
}

/** The app mark: Rosetten's bow. Decorative: the wordmark next to it carries the name. */
export const RosettMark = ({ size = 28, className }: RosettMarkProps) => (
  <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className={className}>
    <g stroke={ROSETT.ink} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
      <path d="M30 38L19 58L29 54L33 60L36 54L47 58L34 38Z" fill={ROSETT.deep} />
      <path d="M32 32C20 10 4 20 10 34C14 44 28 40 32 32Z" fill={ROSETT.pink} />
      <path d="M32 32C44 10 60 20 54 34C50 44 36 40 32 32Z" fill={ROSETT.pink} />
      <rect x="25" y="26" width="14" height="14" rx="5" fill={ROSETT.cream} />
    </g>
  </svg>
);
```

- [ ] **Step 3: The mascot** `src/components/brand/Rosetten.tsx`

```tsx
import type { ReactNode } from 'react';
import { ROSETT } from './palette';

export type RosettenPose = 'hello' | 'happy' | 'sleep' | 'lost' | 'sad' | 'locked';

const STROKE = {
  stroke: ROSETT.ink,
  strokeWidth: 4,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const;

const ARM_DOWN_LEFT = 'M48 132C32 136 30 154 44 158';
const ARM_DOWN_RIGHT = 'M152 132C168 136 170 154 156 158';

interface FigureProps {
  leftArm: string;
  rightArm: string;
  droop?: boolean;
  wiggle?: boolean;
  /** Stroked extras drawn with the figure (question mark, cloud, padlock, z's). */
  extras?: ReactNode;
  /** Face and other unstroked detail. */
  face: ReactNode;
  /** Unstroked extras (dots, tears). */
  overlay?: ReactNode;
}

const Figure = ({ leftArm, rightArm, droop = false, wiggle = false, extras, face, overlay }: FigureProps) => (
  <>
    <ellipse cx="100" cy="192" rx="52" ry="6" fill={ROSETT.ink} opacity=".1" />
    <g {...STROKE}>
      <path d={leftArm} fill="none" />
      <path d={rightArm} fill="none" />
      <rect x="66" y="176" width="24" height="14" rx="7" fill={ROSETT.deep} />
      <rect x="110" y="176" width="24" height="14" rx="7" fill={ROSETT.deep} />
      <rect x="48" y="98" width="104" height="82" rx="16" fill={ROSETT.pink} />
      <rect x="40" y="76" width="120" height="32" rx="12" fill={ROSETT.deep} />
      <rect x="90" y="76" width="20" height="32" fill={ROSETT.cream} />
      <g className={wiggle ? 'rs-wiggle' : undefined}>
        <path
          d={droop ? 'M100 76C80 44 46 58 64 78C74 86 92 82 100 76Z' : 'M100 76C78 30 38 46 62 74C72 82 92 80 100 76Z'}
          fill={ROSETT.pink}
        />
        <path
          d={droop ? 'M100 76C120 44 154 58 136 78C126 86 108 82 100 76Z' : 'M100 76C122 30 162 46 138 74C128 82 108 80 100 76Z'}
          fill={ROSETT.pink}
        />
        <rect x="90" y="64" width="20" height="18" rx="7" fill={ROSETT.cream} />
      </g>
      {extras}
    </g>
    <ellipse cx="70" cy="146" rx="9" ry="5.5" fill={ROSETT.cream} opacity=".55" />
    <ellipse cx="130" cy="146" rx="9" ry="5.5" fill={ROSETT.cream} opacity=".55" />
    {face}
    {overlay}
  </>
);

const RoundEyes = ({ dx = 0, lookUp = false }: { dx?: number; lookUp?: boolean }) => (
  <>
    <g fill={ROSETT.ink}>
      <ellipse cx={82 + dx} cy={130} rx={6} ry={lookUp ? 6 : 7} />
      <ellipse cx={118 + dx} cy={130} rx={6} ry={lookUp ? 6 : 7} />
    </g>
    <g fill={ROSETT.highlight}>
      <circle cx={84 + dx} cy={127} r={2.2} />
      <circle cx={120 + dx} cy={127} r={2.2} />
    </g>
  </>
);

const line = { fill: 'none', stroke: ROSETT.ink, strokeWidth: 4, strokeLinecap: 'round' } as const;

const POSES: Record<RosettenPose, () => ReactNode> = {
  hello: () => (
    <Figure
      leftArm="M48 132C28 126 24 104 36 94"
      rightArm={ARM_DOWN_RIGHT}
      face={
        <>
          <RoundEyes />
          <path d="M90 146Q100 158 110 146" {...line} />
        </>
      }
    />
  ),
  happy: () => (
    <Figure
      leftArm="M48 132C28 126 24 104 36 94"
      rightArm="M152 132C172 126 176 104 164 94"
      face={
        <>
          <path d="M74 132Q82 120 90 132M110 132Q118 120 126 132" {...line} />
          <path d="M88 144Q100 168 112 144Z" fill={ROSETT.ink} stroke={ROSETT.ink} strokeWidth={4} strokeLinejoin="round" />
          <path d="M95 158Q100 152 105 158Z" fill={ROSETT.pink} />
        </>
      }
    />
  ),
  sleep: () => (
    <Figure
      leftArm={ARM_DOWN_LEFT}
      rightArm={ARM_DOWN_RIGHT}
      droop
      extras={<path d="M146 36H162L146 56H162M168 18H178L168 30H178" fill="none" />}
      face={
        <>
          <path d="M74 130Q82 138 90 130M110 130Q118 138 126 130" {...line} />
          <path d="M94 150Q100 154 106 150" {...line} />
        </>
      }
    />
  ),
  lost: () => (
    <Figure
      leftArm="M48 130C26 118 26 92 50 80"
      rightArm={ARM_DOWN_RIGHT}
      extras={<path d="M150 40C150 22 178 22 178 40C178 52 164 52 164 66" fill="none" strokeWidth={5} />}
      overlay={<circle cx="164" cy="78" r="3.5" fill={ROSETT.ink} />}
      face={
        <>
          <g fill={ROSETT.ink}>
            <circle cx="80" cy="128" r="5.5" />
            <circle cx="116" cy="128" r="5.5" />
          </g>
          <path d="M72 122L90 116M128 122L110 116" {...line} />
          <path d="M88 152Q94 145 100 152T112 152" {...line} />
        </>
      }
    />
  ),
  sad: () => (
    <Figure
      leftArm={ARM_DOWN_LEFT}
      rightArm={ARM_DOWN_RIGHT}
      droop
      extras={
        <>
          <path
            d="M140 40C132 40 128 46 130 52C122 52 120 62 128 64H164C174 64 176 52 168 50C168 42 152 38 140 40Z"
            fill={ROSETT.cream}
          />
          <path d="M134 74L170 34" fill="none" />
        </>
      }
      overlay={<path d="M126 138C121 148 131 148 126 138Z" fill={ROSETT.tear} stroke={ROSETT.ink} strokeWidth={2} />}
      face={
        <>
          <g fill={ROSETT.ink}>
            <ellipse cx="82" cy="130" rx="6" ry="7" />
            <ellipse cx="118" cy="130" rx="6" ry="7" />
          </g>
          <path d="M72 122L90 116M128 122L110 116" {...line} />
          <path d="M90 154Q100 144 110 154" {...line} />
        </>
      }
    />
  ),
  locked: () => (
    <Figure
      leftArm={ARM_DOWN_LEFT}
      rightArm="M152 134C168 138 170 150 158 156"
      extras={
        <>
          <path d="M150 152V142C150 128 174 128 174 142V152" fill="none" />
          <rect x="144" y="150" width="36" height="28" rx="7" fill={ROSETT.gold} />
        </>
      }
      overlay={<circle cx="162" cy="162" r="4" fill={ROSETT.ink} />}
      face={
        <>
          <RoundEyes dx={4} />
          <path d="M92 150H108" {...line} />
        </>
      }
    />
  ),
};

interface RosettenProps {
  pose: RosettenPose;
  size?: number;
  className?: string;
}

/** The mascot. Decorative: the heading next to it says what is going on. */
export const Rosetten = ({ pose, size = 120, className }: RosettenProps) => (
  <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true" className={className}>
    {POSES[pose]()}
  </svg>
);

interface RosettenLoaderProps {
  label: string;
  size?: number;
  className?: string;
}

/** Floats and wiggles its bow while something loads; stands still under reduced motion. */
export const RosettenLoader = ({ label, size = 120, className }: RosettenLoaderProps) => (
  <div role="status" aria-label={label} className={className}>
    <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true">
      <g className="rs-float">
        <Figure
          leftArm={ARM_DOWN_LEFT}
          rightArm={ARM_DOWN_RIGHT}
          wiggle
          face={
            <>
              <RoundEyes />
              <path d="M92 146Q100 154 108 146" {...line} />
            </>
          }
        />
      </g>
    </svg>
  </div>
);
```

`src/components/brand/index.ts`:
```ts
export { Rosetten, RosettenLoader, type RosettenPose } from './Rosetten';
export { RosettMark } from './RosettMark';
```

- [ ] **Step 4: Motion.** Append to `src/index.css` (after the last `@layer utilities` block):

```css
@keyframes rs-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes rs-wiggle {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}
.rs-float { animation: rs-float 2s ease-in-out infinite; }
.rs-wiggle { transform-box: fill-box; transform-origin: 50% 100%; animation: rs-wiggle 1.2s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .rs-float, .rs-wiggle { animation: none; }
}
```

- [ ] **Step 5: Check and commit**

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"; npm run lint 2>&1 | grep -E "src/components/brand|problems"; npm run build 2>&1 | tail -1`
Expected: `0`; no lint problem under `src/components/brand` (total 10); build succeeds.

```bash
git add src/components/brand src/index.css
git commit -m "feat(brand): Rosetten mascot (six poses and loader) and the bow mark"
```

---

### Task 2: App icon files

**Files:**
- Create: `docs/brand/icon.svg`, `docs/brand/icon-square.svg`, `docs/brand/README.md`
- Modify: `public/icon.svg`, `public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png`, `public/favicon-16x16.png`, `public/favicon-32x32.png`, `public/icon.ico`, `public/manifest.json`, `index.html`
- Delete: `src/components/GiftHuntIcon.tsx` (placeholder, unused)

**Interfaces:** none.

- [ ] **Step 1: The two SVG sources.** `docs/brand/icon.svg` is the rounded app icon (used as the browser tab icon and as the preview); `docs/brand/icon-square.svg` is full-bleed square with the bow inside the maskable safe zone (80 %), used for every PNG so iOS and Android can apply their own mask.

`docs/brand/icon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="21.5" fill="#FFF6F0"/>
  <g transform="translate(16 16)" stroke="#1C1719" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
    <path d="M30 38L19 58L29 54L33 60L36 54L47 58L34 38Z" fill="#EC8E91"/>
    <path d="M32 32C20 10 4 20 10 34C14 44 28 40 32 32Z" fill="#F59EA0"/>
    <path d="M32 32C44 10 60 20 54 34C50 44 36 40 32 32Z" fill="#F59EA0"/>
    <rect x="25" y="26" width="14" height="14" rx="5" fill="#FFF6F0"/>
  </g>
</svg>
```

`docs/brand/icon-square.svg` (96 px box, background fills the whole square; the bow occupies about 64 px, centred, which is within the 80 % safe zone):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <rect width="96" height="96" fill="#FFF6F0"/>
  <g transform="translate(16 16)" stroke="#1C1719" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
    <path d="M30 38L19 58L29 54L33 60L36 54L47 58L34 38Z" fill="#EC8E91"/>
    <path d="M32 32C20 10 4 20 10 34C14 44 28 40 32 32Z" fill="#F59EA0"/>
    <path d="M32 32C44 10 60 20 54 34C50 44 36 40 32 32Z" fill="#F59EA0"/>
    <rect x="25" y="26" width="14" height="14" rx="5" fill="#FFF6F0"/>
  </g>
</svg>
```

- [ ] **Step 2: Generate the PNGs and the ICO** (one-off; the commands go into `docs/brand/README.md` too).

```bash
set -e
cp docs/brand/icon.svg public/icon.svg
T=$(mktemp -d)
qlmanage -t -s 1024 -o "$T" docs/brand/icon-square.svg >/dev/null 2>&1
SRC="$T/icon-square.svg.png"
sips -z 512 512 "$SRC" --out public/icon-512.png >/dev/null
sips -z 192 192 "$SRC" --out public/icon-192.png >/dev/null
sips -z 180 180 "$SRC" --out public/apple-touch-icon.png >/dev/null
sips -z 32 32 "$SRC" --out public/favicon-32x32.png >/dev/null
sips -z 16 16 "$SRC" --out public/favicon-16x16.png >/dev/null
sips -z 48 48 "$SRC" --out "$T/48.png" >/dev/null
python3 -I - "$T" <<'EOF'
import struct, sys
t = sys.argv[1]
images = [(16, open('public/favicon-16x16.png', 'rb').read()), (32, open('public/favicon-32x32.png', 'rb').read()), (48, open(f'{t}/48.png', 'rb').read())]
header = struct.pack('<HHH', 0, 1, len(images))
offset = 6 + 16 * len(images)
entries, data = b'', b''
for size, png in images:
    entries += struct.pack('<BBBBHHII', size, size, 0, 0, 1, 32, len(png), offset + len(data))
    data += png
open('public/icon.ico', 'wb').write(header + entries + data)
EOF
file public/icon-512.png public/apple-touch-icon.png public/favicon-16x16.png public/icon.ico
```
Expected: `PNG image data, 512 x 512` (and 180 x 180, 16 x 16), `MS Windows icon resource - 3 icons`. Read `public/icon-512.png` and `public/favicon-32x32.png` with the image viewer: the cream square with the bow, no white border, no blur. If `qlmanage` renders a white margin or fails, render `docs/brand/icon-square.svg` in Chrome at 1024 px and save the screenshot as `$T/icon-square.svg.png`, then continue from `SRC`.

- [ ] **Step 3: Manifest, HTML, cleanup**

```bash
python3 -I - <<'EOF'
def edit(path, pairs):
    s = open(path).read()
    for old, new in pairs:
        assert s.count(old) == 1, (path, old)
        s = s.replace(old, new)
    open(path, 'w').write(s)

edit('public/manifest.json', [
    ('"background_color": "#ffffff"', '"background_color": "#F3F1F2"'),
    ('"theme_color": "#000000"', '"theme_color": "#FAF9F9"'),
])
s = open('index.html').read()
assert s.count('?v=2') == 4, s.count('?v=2')
open('index.html', 'w').write(s.replace('?v=2', '?v=3'))
EOF
git rm -q src/components/GiftHuntIcon.tsx
grep -rn "GiftHuntIcon" src | head -3
```
Expected: the `grep` prints nothing. (The theme-color meta in `index.html` is set by the existing script, left alone.)

- [ ] **Step 4: `docs/brand/README.md`**: three short paragraphs: what the two SVGs are, that every file in `public/` is generated from `icon-square.svg` with the Step 2 commands (copy them in), and that the header mark is `src/components/brand/RosettMark.tsx` (keep the three in sync when the icon changes).

- [ ] **Step 5: Check and commit**

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"; npm run build 2>&1 | tail -1`
Expected: `0`; build succeeds.

```bash
git add docs/brand public index.html src/components
git commit -m "feat(brand): the bow as app icon, favicon and manifest icons"
```

---

### Task 3: Poses in empty states, errors and 404

**Files:**
- Modify: `src/components/gh/EmptyState.tsx`, `src/Home/index.tsx`, `src/Profile/index.tsx`, `src/AcceptInvitation/components/InviteProblem.tsx`, `src/PublicWishlist/components/EmptyWishlistState.tsx`, `src/PublicWishlist/components/AccessDeniedState.tsx`, `src/Wishlist/components/OwnerWishlist.tsx`, `src/Wishlist/components/OrganizerWishlist.tsx`, `src/pages/NotFound.tsx`

**Interfaces:**
- Consumes: `Rosetten`, `RosettenPose` (Task 1).
- Produces: `EmptyState({ pose, title, text?, action?, size?, headingAs? })` (the `icon` prop is removed).

- [ ] **Step 1: EmptyState.** Replace the icon with the pose. In `src/components/gh/EmptyState.tsx`:

```bash
python3 -I - <<'EOF'
def edit(path, pairs):
    s = open(path).read()
    for old, new in pairs:
        assert s.count(old) == 1, (path, old)
        s = s.replace(old, new)
    open(path, 'w').write(s)

edit('src/components/gh/EmptyState.tsx', [
    ("import type { LucideIcon } from 'lucide-react';\n", "import { Rosetten, type RosettenPose } from '@/components/brand';\n"),
    ("  icon: LucideIcon;\n", "  pose: RosettenPose;\n"),
    ("  icon: Icon,\n", "  pose,\n"),
    ('    <Icon className="h-10 w-10 text-gh-muted" aria-hidden="true" />\n',
     '    <Rosetten pose={pose} size={size === \'screen\' ? 144 : 104} />\n'),
])
EOF
```

- [ ] **Step 2: The usages.** Mapping (pose and what changes in each file): remove the now unused lucide import (`Gift`, `Link2Off`, `User`) from a file only when nothing else in it uses it.

| File | Before | Pose |
|---|---|---|
| `Home/index.tsx` load failed | `icon={Gift}` | `sad` |
| `Home/index.tsx` first visit | `icon={Gift}` | `hello` |
| `Profile/index.tsx` load failed | `icon={User}` | `sad` |
| `AcceptInvitation/components/InviteProblem.tsx` (gone) | `icon={Link2Off}` | `lost` |
| `PublicWishlist/components/EmptyWishlistState.tsx` | `icon={Gift}` | `sleep` |
| `PublicWishlist/components/AccessDeniedState.tsx` | `icon={Link2Off}` | `locked` |
| `Wishlist/components/OwnerWishlist.tsx` load failed | `icon={Gift}` | `sad` |
| `Wishlist/components/OwnerWishlist.tsx` empty list | `icon={Gift}` | `sleep` |
| `Wishlist/components/OrganizerWishlist.tsx` load failed | `icon={Gift}` | `sad` |
| `Wishlist/components/OrganizerWishlist.tsx` empty list (the "Lediga" tab empty) | `icon={Gift}` | `sleep` |

```bash
python3 -I - <<'EOF'
import re
def sub(path, old, new, count=1):
    s = open(path).read()
    assert s.count(old) == count, (path, old, s.count(old))
    open(path, 'w').write(s.replace(old, new))

# Home: two usages, told apart by their neighbours
s = open('src/Home/index.tsx').read()
a = s.index("<EmptyState")
first = s.index("icon={Gift}", a)
s = s[:first] + "pose=\"sad\"" + s[first + len("icon={Gift}"):]
second = s.index("icon={Gift}", first)
s = s[:second] + "pose=\"hello\"" + s[second + len("icon={Gift}"):]
open('src/Home/index.tsx', 'w').write(s)

sub('src/Profile/index.tsx', 'icon={User}', 'pose="sad"')
sub('src/AcceptInvitation/components/InviteProblem.tsx', 'icon={Link2Off}', 'pose="lost"')
sub('src/PublicWishlist/components/EmptyWishlistState.tsx', 'icon={Gift}', 'pose="sleep"')
sub('src/PublicWishlist/components/AccessDeniedState.tsx', 'icon={Link2Off}', 'pose="locked"')
for path in ('src/Wishlist/components/OwnerWishlist.tsx', 'src/Wishlist/components/OrganizerWishlist.tsx'):
    s = open(path).read()
    assert s.count('icon={Gift}') == 2, path
    first = s.index('icon={Gift}')
    s = s[:first] + 'pose="sad"' + s[first + len('icon={Gift}'):]
    second = s.index('icon={Gift}')
    s = s[:second] + 'pose="sleep"' + s[second + len('icon={Gift}'):]
    open(path, 'w').write(s)
EOF
npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep "error TS" | cut -c1-160
```
Expected: errors only for now-unused imports are not tsc errors; lint reports them. Run `npm run lint 2>&1 | grep -E "no-unused-vars|is defined but never used"` and remove each reported lucide import (`Gift`, `Link2Off`, `User`, `Plus` must stay where still used) by hand until lint is at its baseline.

- [ ] **Step 3: NotFound.** Replace `src/pages/NotFound.tsx` with a page in the design system's style:

```tsx
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/gh/EmptyState';

const NotFound = () => {
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gh-bg p-4 text-gh-ink">
      <EmptyState
        pose="lost"
        size="screen"
        headingAs="h1"
        title={t('notFound.message')}
        action={
          <Button asChild variant="outline" className="h-12 rounded-gh-md px-5 text-base font-semibold">
            <Link to="/">{t('notFound.returnHome')}</Link>
          </Button>
        }
      />
    </div>
  );
};

export default NotFound;
```
(`LanguageSwitcher` leaves this page: language lives on Profile.)

- [ ] **Step 4: Check and commit**

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"; npm run lint 2>&1 | grep problems; npm run build 2>&1 | tail -1; grep -rn "icon={" src --include='*.tsx' | grep -i emptystate`
Expected: `0`; lint ≤ 10; build succeeds; the grep prints nothing.

```bash
git add src
git commit -m "feat(brand): Rosetten in empty states, errors and the 404 page"
```

---

### Task 4: The mark in the header and the loader

**Files:**
- Modify: `src/components/AppHeader.tsx`, `src/components/AccountShell.tsx`, `src/Auth/components/AuthLoadingState.tsx`, `src/components/auth/AuthProvider.tsx`

**Interfaces:**
- Consumes: `RosettMark`, `RosettenLoader` (Task 1).

- [ ] **Step 1: Header and auth shell.** In `AppHeader.tsx` the wordmark link becomes mark + wordmark:

```tsx
          <Link
            to="/"
            className="flex items-center gap-2 rounded-gh-sm font-brand text-[22px] font-semibold leading-none tracking-[-0.3px] text-gh-ink">
            <RosettMark size={28} />
            GiftHunt
          </Link>
```
(replace the existing `Link` for the wordmark; add `import { RosettMark } from '@/components/brand';`). In `AccountShell.tsx` the wordmark `div` becomes `flex items-center gap-2` with `<RosettMark size={36} />` before the text and the import added.

- [ ] **Step 2: Loader.** `src/Auth/components/AuthLoadingState.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { RosettenLoader } from '@/components/brand';

export const AuthLoadingState = () => {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-gh-bg">
      <RosettenLoader label={t('common.loading')} size={144} />
    </div>
  );
};
```
In `AuthProvider.tsx` replace the initial-loading block (`<div className="min-h-screen flex items-center justify-center"><div className="animate-spin …"></div></div>`) with `<AuthLoadingState />` imported from `@/Auth/components/AuthLoadingState`. (The provider sits above the router's i18n use; `useTranslation` works there because i18n is initialised in `main`.)

- [ ] **Step 3: Check and commit**

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"; npm run lint 2>&1 | grep problems; npm run build 2>&1 | tail -1`
Expected: `0`; lint ≤ 10; build succeeds.

```bash
git add src
git commit -m "feat(brand): the bow next to the wordmark; Rosetten as the loading screen"
```

---

### Task 5: Browser verification (Chrome DevTools MCP, local Supabase, `npm run dev` in this worktree)

Seed as in the phase 6 plan (users `erik@e2e.se` with lists, `newbie@e2e.se` without lists, an organizer list, a share link `e2e-token`).

- [ ] **Step 1:** Header: the bow and `GiftHunt` side by side on Home, Profile, a wishlist, light and dark, 390 and 1280 px; the bow's outline reads on dark (pink body and cream knot clearly visible). The auth page and onboarding show the larger mark.
- [ ] **Step 2:** Poses on screen, light and dark, 390 and 1280: `newbie@e2e.se` Home → `hello` with "Skapa din första önskelista"; an empty owner list → `sleep`; `/shared/<token>` of an empty list → `sleep`; a turned-off or unknown share link → `locked`; `/nonsense` → `lost` with the return button; an invitation link that is gone → `lost`; force a load error (stop Supabase for a moment or block the request in DevTools) → `sad` on Home, Profile and a wishlist. No pose appears on any screen listing items that are taken.
- [ ] **Step 3:** Loader: reload the app: Rosetten floats and wiggles on the loading screen (use `emulate` with reduced motion: it stands still); its label is announced (`role="status"`).
- [ ] **Step 4:** Browser tab and icons: open `/icon.svg`, `/favicon-32x32.png`, `/apple-touch-icon.png`, `/icon-512.png`; each shows the bow on cream, crisp, centred; `manifest.json` loads. Take a 16 px favicon screenshot of the tab: the bow is recognisable.
- [ ] **Step 5:** Console has no errors; no horizontal scroll at 390 px; `EmptyState` heights have not changed enough to push actions below the fold at 390×844 (Home first visit, public empty list).

Record anything that does not match as a defect and fix it before Task 6.

---

### Task 6: Docs and final checks

**Files:**
- Modify: `CLAUDE.md`, the design system README (claude.ai artifact UWZ3km7B9v3y6vSDg8uWhu)

- [ ] **Step 1: CLAUDE.md.** In the design-system section add after the **Type** bullet:

```
- **Brand:** the app mark is the Rosett bow (`RosettMark`; sources in `docs/brand/`, PNGs in `public/` are generated from `icon-square.svg`). The mascot **Rosetten** (`Rosetten` with poses `hello`, `happy`, `sleep`, `lost`, `sad`, `locked`; `RosettenLoader`) lives in `src/components/brand/`. Use it only in empty states (`EmptyState pose=…`), errors, the 404 page and full-screen loading: one per view, always with a heading, never beside anything that is taken. `Skeleton` stays first for lists and detail pages. Its fixed palette is in `palette.ts`; everything else uses `gh-*`.
```
(Use an `assert s.count(old) == 1` edit anchored on the `**Type:**` bullet.)

- [ ] **Step 2: Design system README.** `read` the live `project/README.md` of the artifact above, replace the "Brand" section's last bullet (no logo file yet) with: "The mark is the Rosett bow. The mascot is **Rosetten**, a gift box with a bow for ears: poses hej, klart, vilar, vilsen, ledsen, låst and laddar; used only in empty states, errors, 404 and full-screen loading, one per view, always with a heading. See the Varumärke canvas (https://claude.ai/artifact/Aihm5Q1LPi7j9Xri3fytHR)." Publish that one file to the same artifact.
- [ ] **Step 3: Final checks and commit**

Run: `npm run test:unit 2>&1 | grep -E "ℹ (pass|fail)"; npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"; npm run lint 2>&1 | grep problems; npm run build 2>&1 | tail -1`
Expected: 110 pass; tsc `0`; lint ≤ 10; build succeeds. No database change, so no `test:db`.

```bash
git add CLAUDE.md docs/superpowers/plans/2026-10-22-rosetten-brand.md
git commit -m "docs(brand): Rosetten and the app mark"
```
