# One Desktop Page Column Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On desktop the app header and every in-app page share one column, so the logo, the avatar and the page content line up on the same left and right edges with the same side margins.

**Architecture:** One exported class string, `PAGE_COLUMN` (`src/components/pageColumn.ts`), holds the column (centred, max 960 px, 16 px side padding on mobile, 32 px from `md`). `AppHeader` and every page container use it instead of their own `max-w-*`/`px-*` classes. A node unit test fails if a page declares its own `max-w-[720px]` or `max-w-[960px]` again. No logic, data or database changes.

**Tech Stack:** React + Tailwind (`gh-*` tokens), `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-20-ui-redesign-design.md` section 1 ("Pages are max-width centred on desktop"). Updated design: the desktop boards in the four canvases (Home https://claude.ai/artifact/Bn2EAQs9VsGuWgpApRfYpF, Konto https://claude.ai/artifact/55y11MkuWVCCyYvWMHBTEb, Wishlist owner https://claude.ai/artifact/VEUdZk5qZ1d8iGL8s3Udkp, Wishlist organizer https://claude.ai/artifact/7H54j1GKPXSCWqeEcBjor9) now draw the header inside the same column as the content, with a note on each canvas.

## What is wrong today (measured at 1280 px in the browser)

| Page | Header content | Page content | Problem |
|---|---|---|---|
| Home `/` | x 208 – 1072 (container 896, `px-4`) | x 312 – 968 (container 720, `md:px-8`) | content is 104 px inside the header on both sides |
| Profile `/profile` | back button x 200, avatar right edge 1072 | x 312 – 968 | same |
| Wishlist `/wishlist/:id` (owner, organizer, self-managed use the same two components) | x 208 – 1072 | x 192 – 1088 (container 960, `md:px-8`) | content is 16 px wider than the header on each side |
| Public `/shared/:token` | no app header | x 192 – 1088 | same column as the wishlist pages; becomes the same as everything once they share one value |

Cause: three different containers (`max-w-4xl px-4` in the header, `max-w-[720px] md:px-8` on Home and Profile, `max-w-[960px] md:px-8` on wishlist and public pages) and no shared definition. The design canvases had the same gap: their header ran edge to edge while the content was a centred column.

## Decision

One column everywhere in the app: `mx-auto w-full max-w-[960px] px-4 md:px-8`. At 1280 px that is x 192 – 1088, a 896 px content width. Home and Profile become wider than their old 720 px (rows get longer; nothing else changes), the header moves in to the column edges. Mobile does not change (16 px gutter, as before). Forms that are narrow on purpose (sign in, sign up, onboarding, invitation: 440 px) stay narrow and centred; only their header, where there is one, now sits on the column edges.

## Global Constraints

- Only `gh-*` Tailwind tokens, no hardcoded colours; touch targets ≥ 44 px; nothing new may overflow horizontally at 390, 768, 1024, 1280 or 1440 px.
- Mobile layout (below `md`, 768 px) is unchanged.
- No page may declare its own `max-w-[720px]` or `max-w-[960px]`; the loading skeletons use the same column as the page they stand in for (no jump when content arrives).
- Baselines: unit tests 108 (+2 new), `tsc` 0 errors, lint 10 problems (3 errors, 7 warnings), db tests untouched (no database change).

## Review Focus

- **Header, Home, Profile, all wishlist modes, public page and every loading skeleton resolve to the same left and right content edges** at 1024, 1280 and 1440 px, and to the same 16 px gutter at 390 px. (Task 3)
- **Between 768 and 960 px** (tablet) the column simply fills the width with 32 px sides; no clipped or double padding. (Task 3)
- **Home at 896 px:** invitation card, rows with the "N förfrågningar" pill, and the new-list sheet still read well. (Task 3)
- **Narrow forms and the signed-in invitation/onboarding pages** are unaffected apart from the header edges. (Task 3)

## File structure

| File | Responsibility |
|---|---|
| `src/components/pageColumn.ts` (+ `pageColumn.test.ts`) | `PAGE_COLUMN` and the guard test |
| `src/components/AppHeader.tsx` | header inner row uses the column |
| `src/Home/index.tsx`, `components/HomeLoading.tsx` | page column |
| `src/Profile/index.tsx`, `components/ProfileLoading.tsx` | page column |
| `src/Wishlist/components/OwnerWishlist.tsx`, `OrganizerWishlist.tsx`, `WishlistLoading.tsx` | page column |
| `src/PublicWishlist/index.tsx`, `components/LoadingState.tsx` | page column |
| `CLAUDE.md` | the rule, under the design-system section |
| design system README (claude.ai artifact UWZ3km7B9v3y6vSDg8uWhu) | the same rule for designers |

---

### Task 1: The shared column, a guard test, and the header

**Files:**
- Create: `src/components/pageColumn.ts`, `src/components/pageColumn.test.ts`
- Modify: `src/components/AppHeader.tsx`

**Interfaces:**
- Produces: `export const PAGE_COLUMN: string` = `'mx-auto w-full max-w-[960px] px-4 md:px-8'`. Pages combine it with `cn(PAGE_COLUMN, '<vertical padding, gap, flex…>')`.

- [ ] **Step 1: Write the failing test** `src/components/pageColumn.test.ts`

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PAGE_COLUMN } from './pageColumn.ts';

const SRC = join(import.meta.dirname, '..');

const sourceFiles = (): string[] =>
  (readdirSync(SRC, { recursive: true }) as string[])
    .filter((file) => file.endsWith('.tsx'))
    .map((file) => join(SRC, file));

test('the page column is one centred 960px column with the shared side padding', () => {
  for (const part of ['mx-auto', 'w-full', 'max-w-[960px]', 'px-4', 'md:px-8']) {
    assert.ok(PAGE_COLUMN.split(' ').includes(part), `PAGE_COLUMN is missing ${part}`);
  }
});

test('no screen declares its own page width: they all use PAGE_COLUMN', () => {
  const offenders = sourceFiles().filter((file) => /max-w-\[(720|960)px\]/.test(readFileSync(file, 'utf8')));
  assert.deepEqual(
    offenders.map((file) => file.slice(SRC.length + 1)),
    [],
    'these files hardcode a page column width; use PAGE_COLUMN from @/components/pageColumn',
  );
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:unit 2>&1 | grep -E "ℹ (tests|pass|fail)|Cannot find module" | head -4`
Expected: FAIL `Cannot find module './pageColumn.ts'`.

- [ ] **Step 3: Implement** `src/components/pageColumn.ts`

```ts
/**
 * The one column of the app on desktop: the header and every page use it, so the logo, the
 * avatar and the content line up (960px wide with 32px sides = 896px of content from `md`,
 * a 16px gutter below). Narrow forms (sign in, onboarding, invitation) are 440px on purpose
 * and do not use it. Combine with `cn(PAGE_COLUMN, 'flex flex-col gap-8 pb-10 pt-6 …')`.
 */
export const PAGE_COLUMN = 'mx-auto w-full max-w-[960px] px-4 md:px-8';
```

- [ ] **Step 4: Header.** In `src/components/AppHeader.tsx` replace the inner row class and add imports:

```bash
python3 -I - <<'EOF'
def edit(path, pairs):
    s = open(path).read()
    for old, new in pairs:
        assert s.count(old) == 1, (path, old)
        s = s.replace(old, new)
    open(path, 'w').write(s)

edit('src/components/AppHeader.tsx', [
    ("""      <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4">""",
     """      <div className={cn(PAGE_COLUMN, 'flex h-14 items-center justify-between')}>"""),
    ("import { initials } from '@/lib/personName';",
     "import { initials } from '@/lib/personName';\nimport { cn } from '@/lib/utils';\nimport { PAGE_COLUMN } from '@/components/pageColumn';"),
])
EOF
```

- [ ] **Step 5: Check and commit**

Run: `npm run test:unit 2>&1 | grep -E "ℹ (tests|pass|fail)|hardcode|\.tsx" | head -14`
Expected: the first test passes; the second still FAILS and lists the nine page files (this is the work of Task 2). Do not commit a red suite: commit after Task 2 (Tasks 1 and 2 are one commit sequence ending green).

---

### Task 2: Use the column on every page

**Files:**
- Modify: `src/Home/index.tsx`, `src/Home/components/HomeLoading.tsx`, `src/Profile/index.tsx`, `src/Profile/components/ProfileLoading.tsx`, `src/Wishlist/components/OwnerWishlist.tsx`, `src/Wishlist/components/OrganizerWishlist.tsx`, `src/Wishlist/components/WishlistLoading.tsx`, `src/PublicWishlist/index.tsx`, `src/PublicWishlist/components/LoadingState.tsx`

**Interfaces:**
- Consumes: `PAGE_COLUMN` (Task 1).

- [ ] **Step 1: Replace each page's own container classes.** The script finds the one `className="…"` per file that carries `max-w-[720px]` or `max-w-[960px]`, removes `mx-auto w-full max-w-[…] px-4 md:px-8` from it, and wraps what is left in `cn(PAGE_COLUMN, '…')`; it adds the two imports if missing and asserts exactly one match per file.

```bash
python3 -I - <<'EOF'
import re
FILES = [
    'src/Home/index.tsx', 'src/Home/components/HomeLoading.tsx',
    'src/Profile/index.tsx', 'src/Profile/components/ProfileLoading.tsx',
    'src/Wishlist/components/OwnerWishlist.tsx', 'src/Wishlist/components/OrganizerWishlist.tsx',
    'src/Wishlist/components/WishlistLoading.tsx',
    'src/PublicWishlist/index.tsx', 'src/PublicWishlist/components/LoadingState.tsx',
]
DROP = {'mx-auto', 'w-full', 'px-4', 'md:px-8'}
pattern = re.compile(r'className="([^"]*max-w-\[(?:720|960)px\][^"]*)"')

for path in FILES:
    s = open(path).read()
    matches = pattern.findall(s)
    assert len(matches) == 1, (path, matches)
    tokens = matches[0].split()
    kept = [t for t in tokens if t not in DROP and not re.fullmatch(r'max-w-\[(?:720|960)px\]', t)]
    new = "className={cn(PAGE_COLUMN, '%s')}" % ' '.join(kept)
    s = pattern.sub(lambda m: new, s, count=1)
    imports = []
    if not re.search(r"import \{[^}]*\bcn\b[^}]*\} from '@/lib/utils'", s):
        imports.append("import { cn } from '@/lib/utils';")
    imports.append("import { PAGE_COLUMN } from '@/components/pageColumn';")
    s = '\n'.join(imports) + '\n' + s
    open(path, 'w').write(s)
    print(path, '->', ' '.join(kept))
EOF
git diff --stat | tail -1
```
Expected: nine lines printed such as `src/Home/index.tsx -> flex flex-col gap-8 pb-10 pt-6 md:gap-10 md:pt-12`, then a diff stat of 10 files (these nine plus `AppHeader.tsx`).

- [ ] **Step 2: Verify the guard test is green and nothing else broke**

Run: `npm run test:unit 2>&1 | grep -E "ℹ (tests|pass|fail)"; npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"; npm run lint 2>&1 | grep problems; npm run build 2>&1 | tail -1`
Expected: 110 tests, 110 pass; tsc `0`; lint ≤ 10 problems (a moved import must not add one: if the import-first insert trips a rule, put the imports after the last existing import instead); build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/pageColumn.ts src/components/pageColumn.test.ts src/components/AppHeader.tsx src/Home src/Profile src/Wishlist src/PublicWishlist
git commit -m "fix(ui): header and every page share one desktop column"
```

---

### Task 3: Browser verification (Chrome DevTools MCP, local Supabase, `npm run dev` in this worktree)

Seed as in the phase 6 plan Task 7 Step 4 (or `bash /tmp/p4c/t5_6.sh`): Anna, Erik and the lists "Annas 35-årsdag" (Erik organizes) and "Eriks egen lista" (self-managed), share token `e2e-token`. Log in as Erik in one isolated context and as Anna in another.

Measure with this snippet (evaluate_script, after the page has loaded) at 1280×900, 1440×900, 1024×800, 768×900 and 390×844:

```js
() => {
  const rect = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { left: Math.round(b.left), right: Math.round(b.right) }; };
  const header = document.querySelector('header > div');
  const content = document.querySelector('main > :first-child') || document.querySelector('main');
  const headerFirst = header && header.firstElementChild;
  const headerLast = header && header.lastElementChild;
  return {
    path: location.pathname, viewport: innerWidth,
    headerColumn: rect(header), headerFirst: rect(headerFirst), headerLast: rect(headerLast),
    mainColumn: rect(document.querySelector('main')), content: rect(content),
    overflowX: document.documentElement.scrollWidth > innerWidth,
  };
}
```

- [ ] **Step 1:** For each page, expected result: `headerColumn.left == mainColumn.left` and `headerColumn.right == mainColumn.right` (the two columns are the same box); at 1280 px both are 160 – 1120 with 32 px padding, so the content and the logo/avatar edges are 192 and 1088; `overflowX` is `false` everywhere. Pages: Home (`/`), Profile, Annas 35-årsdag as organizer (Erik), Eriks egen lista (self-managed), Annas 35-årsdag as owner (Anna), the public page (`/shared/e2e-token`; no header: its `mainColumn` must equal the others), and each page's loading state (throttle the network, or read the skeleton's container with the same snippet right after navigation).
- [ ] **Step 2:** Screenshots at 1280×900 of Home, Profile and one wishlist, compared with the updated desktop boards in the canvases; Home with an invitation card (create one as in the phase 6 plan) and with the new-list side panel open; the three-way theme control on Profile must not wrap at 1280 or 768.
- [ ] **Step 3:** At 390×844 take one screenshot each of Home and a wishlist: unchanged from before (16 px gutter, header aligned with content).
- [ ] **Step 4:** Onboarding, sign in and the invitation page (signed in and out) still show their 440 px column centred; no horizontal scroll. Console has no errors.

Record anything that does not match as a defect and fix it before Task 4.

---

### Task 4: Docs, final checks, commit

**Files:**
- Modify: `CLAUDE.md`
- Modify (design system artifact): README paragraph

- [ ] **Step 1: CLAUDE.md.** In the design-system section, after the **Responsive overlays** block, add:

```
**Page column** — on desktop the header and every in-app page share one column: `PAGE_COLUMN` from `src/components/pageColumn.ts` (centred, max 960px, 16px sides on mobile and 32px from `md`, so 896px of content). Use `cn(PAGE_COLUMN, '…vertical padding and layout…')` on a page's `<main>`, never your own `max-w-*`/`px-*`; a unit test fails if a screen hardcodes `max-w-[720px]` or `max-w-[960px]`. Narrow forms (auth, onboarding, invitation) are 440px on purpose and stay centred.
```
Use a python `assert s.count(old) == 1` edit anchored on the line `**Responsive overlays** — use \`useIsMobile()\` to switch:`: insert the paragraph and a blank line before it.

- [ ] **Step 2: Design system README.** `read` `project/README.md` of https://claude.ai/artifact/UWZ3km7B9v3y6vSDg8uWhu (it has a newer version than the copies in the canvases: merge onto the live one), and under "Layout and surfaces" add the bullet "- **Page column (desktop):** the header and every page share one column, max 960px with 32px side padding (16px on mobile), so the logo, the avatar and the content line up. Forms that are narrow on purpose (440px) stay centred." Publish that one file to the same artifact with `file_path` = the edited README and `root` = its folder.

- [ ] **Step 3: Final checks and commit**

Run: `npm run test:unit 2>&1 | grep -E "ℹ (pass|fail)"; npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS"; npm run lint 2>&1 | grep problems; npm run build 2>&1 | tail -1`
Expected: 110 pass; tsc `0`; lint ≤ 10; build succeeds.

```bash
git add CLAUDE.md docs/superpowers/plans/2026-10-21-desktop-page-column.md
git commit -m "docs: the page column rule and its plan"
```

(If Task 3 found defects, commit their fixes as `fix(ui): …` before this step.)
