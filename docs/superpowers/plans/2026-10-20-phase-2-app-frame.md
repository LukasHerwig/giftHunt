# Phase 2 – App frame Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the GiftHunt design system into the app: its colour, type and radius tokens as CSS variables and Tailwind colours, the new AppHeader, light/dark themes that follow the design system — so every existing screen picks up the new look before the screens themselves are rebuilt in phases 3–6.

**Architecture:** The design system's tokens become CSS custom properties (`--gh-*`, colours as RGB channels so Tailwind opacity modifiers like `/10` keep working) in a new `src/styles/tokens.css`, with a light `:root` block and a `.dark` block (the app already toggles `.dark` on `<html>`). Tailwind gets a `gh` colour namespace for new code. The legacy shadcn variables (`--background`, `--primary`, …) and the iOS palette (`--ios-blue`, …) are re-pointed at the GiftHunt tokens, so the 54 files that use them change look without being edited; the one place where that breaks legibility — white text on an accent fill — is fixed with legacy `on-*` colours. The runtime "pastel colour scheme" override in `src/lib/theme.ts` is removed (GiftHunt has one accent).

**Tech Stack:** React 18, Vite, Tailwind CSS 3, shadcn/ui, lucide-react, react-i18next.

**Spec:** `docs/superpowers/specs/2026-10-20-ui-redesign-design.md` (sections 1, 5, 7 – phase 2). Design system (source of every value): https://claude.ai/artifact/UWZ3km7B9v3y6vSDg8uWhu — tokens, brand book, AppHeader component.

## Global Constraints

- Every colour comes from a GiftHunt token. No new literal hex/rgb values in components.
- Text never under 12px; touch targets ≥ 44px; keyboard focus is a 2px solid ring in `--gh-focus-ring`, offset 2px.
- The pastel accent (`primary`) carries dark `on-primary` text, never white.
- UI text in IBM Plex Sans (400/600/700); the wordmark only in Fredoka 600 (both from Google Fonts).
- All user-facing strings through react-i18next (`src/locales/en.json` and `sv.json`); no hardcoded strings.
- No behaviour changes: same routes, same menu items, same flows. Only the look changes.
- `npx tsc --noEmit -p tsconfig.app.json` shows only the 2 errors that also exist on `main` (`src/AdminWishlist/hooks/useAdminWishlist.ts:218`, `src/Dashboard/components/index.ts:7`); `npm run lint` only the 4 that exist on `main`; `npm run build` passes.

## Review Focus

- **Dark theme with white text on an accent or danger fill** → unreadable (the dark accent is a light pastel). Expected: such text uses `ios-on-blue` / `ios-on-red`, dark in the dark theme. Pinned by the grep and screenshots in Task 2.
- **Opacity modifiers on remapped colours** (`bg-ios-separator/10`, `bg-ios-background/80`) → silently become opaque or vanish if the variable format is wrong. Expected: still translucent. Pinned by the screenshot check in Task 2.
- **Theme set to "system" with an OS in dark mode** → the app must look dark and the header must follow. Pinned in Task 4.
- **A user with no name yet (onboarding)** → the avatar has no initials. Expected: a generic person icon. Pinned in Task 3.
- **Long list titles and Swedish words** (e.g. "Födelsedagsönskelistan") in the header area → no overflow at 390px. Pinned in Task 4's screenshots.

## File structure

| File | Responsibility |
|---|---|
| `src/styles/tokens.css` (new) | GiftHunt tokens as CSS variables, light and dark |
| `src/index.css` | imports tokens.css; legacy variables re-pointed at tokens; base font |
| `tailwind.config.ts` | `gh` colour namespace, legacy colours in RGB-channel format, fonts, radii |
| `index.html` | Google Fonts link |
| `src/lib/theme.ts` | applies only light/dark (+ `data-theme`), no runtime colour overrides |
| `src/components/ThemeSettings.tsx` | deleted (unused; only consumer of the colour schemes) |
| `src/components/AppHeader.tsx` | new header: wordmark left, avatar menu right |
| 18+ components using `bg-ios-blue … text-white` | `text-white` → `text-ios-on-blue` (and red/destructive equivalents) |
| `CLAUDE.md` | "UI / iOS design system" section replaced by the GiftHunt design system |

---

### Task 1: Tokens, Tailwind namespace and fonts

**Files:**
- Create: `src/styles/tokens.css`
- Modify: `src/index.css` (top of file), `tailwind.config.ts` (`theme.extend`), `index.html` (`<head>`)

**Interfaces:**
- Produces: CSS variables `--gh-<token>` for every colour token (RGB channels, e.g. `--gh-ink: 28 23 25`; `--gh-scrim` is a full `rgba()`), Tailwind colours `gh-<token>` (e.g. `bg-gh-surface-200`, `text-gh-muted`, `border-gh-line`, `bg-gh-scrim`), font families `font-sans` (IBM Plex Sans) and `font-brand` (Fredoka), radii `rounded-gh-sm|md|lg|xl|sheet|pill`, shadows `shadow-gh-sheet|panel|menu`.

- [ ] **Step 1: Create `src/styles/tokens.css`**

```css
/* GiftHunt design system tokens — values from the GiftHunt design system
   (https://claude.ai/artifact/UWZ3km7B9v3y6vSDg8uWhu, tokens.json).
   Colours are RGB channels so Tailwind opacity modifiers work: rgb(var(--gh-ink) / 0.5). */
:root {
  --gh-bg: 243 241 242;
  --gh-scrim: rgba(28,23,25,0.45);
  --gh-surface-100: 250 249 249;
  --gh-surface-200: 255 255 255;
  --gh-surface-300: 241 238 239;
  --gh-surface-400: 232 227 229;
  --gh-line: 230 225 227;
  --gh-line-strong: 142 131 135;
  --gh-ink: 28 23 25;
  --gh-ink-2: 67 59 62;
  --gh-muted: 101 91 95;
  --gh-subtle: 125 115 119;
  --gh-primary: 245 158 160;
  --gh-on-primary: 42 18 21;
  --gh-primary-pressed: 236 142 145;
  --gh-primary-strong: 176 48 60;
  --gh-primary-tint: 253 228 228;
  --gh-focus-ring: var(--gh-primary-strong);
  --gh-available: 31 111 74;
  --gh-available-bg: 221 240 229;
  --gh-taken: 101 91 95;
  --gh-taken-bg: 238 234 236;
  --gh-warning: 133 86 10;
  --gh-warning-bg: 250 234 204;
  --gh-danger: 160 64 15;
  --gh-danger-bg: 251 227 214;

  --gh-shadow-sheet: 0 -2px 12px rgba(28,23,25,0.10);
  --gh-shadow-panel: -4px 0 12px rgba(28,23,25,0.10);
  --gh-shadow-menu: 0 1px 3px rgba(28,23,25,0.10), 0 4px 12px rgba(28,23,25,0.10);

  --gh-radius-sm: 8px;
  --gh-radius-md: 12px;
  --gh-radius-lg: 16px;
  --gh-radius-xl: 20px;
  --gh-radius-sheet: 28px;
  --gh-radius-pill: 999px;

  color-scheme: light;
}

.dark {
  --gh-bg: 21 19 21;
  --gh-scrim: rgba(8,6,8,0.72);
  --gh-surface-100: 27 24 27;
  --gh-surface-200: 33 29 33;
  --gh-surface-300: 40 35 40;
  --gh-surface-400: 48 42 48;
  --gh-line: 46 41 46;
  --gh-line-strong: 119 109 114;
  --gh-ink: 242 238 240;
  --gh-ink-2: 207 199 203;
  --gh-muted: 168 158 163;
  --gh-subtle: 133 123 128;
  --gh-primary: 245 158 160;
  --gh-on-primary: 42 18 21;
  --gh-primary-pressed: 249 177 179;
  --gh-primary-strong: 245 158 160;
  --gh-primary-tint: 61 33 36;
  --gh-available: 143 211 172;
  --gh-available-bg: 35 59 48;
  --gh-taken: 168 158 163;
  --gh-taken-bg: 44 39 44;
  --gh-warning: 240 194 126;
  --gh-warning-bg: 72 56 34;
  --gh-danger: 255 154 102;
  --gh-danger-bg: 74 42 28;

  --gh-shadow-sheet: 0 -2px 12px rgba(0,0,0,0.40);
  --gh-shadow-panel: -4px 0 12px rgba(0,0,0,0.36);
  --gh-shadow-menu: 0 1px 3px rgba(0,0,0,0.30), 0 4px 12px rgba(0,0,0,0.28);

  color-scheme: dark;
}
```

- [ ] **Step 2: Import it in `src/index.css`**

Add as the very first line of `src/index.css` (before the `@tailwind` directives — CSS `@import` must come first):

```css
@import './styles/tokens.css';
```

- [ ] **Step 3: Add the Google Fonts link to `index.html`**

Inside `<head>`, before any existing stylesheet links:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600&family=IBM+Plex+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
```

- [ ] **Step 4: Extend `tailwind.config.ts`**

Inside `theme.extend`, add (keep every existing key):

```ts
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        brand: ['Fredoka', '"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
```

Inside `theme.extend.colors`, add a `gh` entry:

```ts
        gh: {
          bg: 'rgb(var(--gh-bg) / <alpha-value>)',
          scrim: 'var(--gh-scrim)',
          'surface-100': 'rgb(var(--gh-surface-100) / <alpha-value>)',
          'surface-200': 'rgb(var(--gh-surface-200) / <alpha-value>)',
          'surface-300': 'rgb(var(--gh-surface-300) / <alpha-value>)',
          'surface-400': 'rgb(var(--gh-surface-400) / <alpha-value>)',
          line: 'rgb(var(--gh-line) / <alpha-value>)',
          'line-strong': 'rgb(var(--gh-line-strong) / <alpha-value>)',
          ink: 'rgb(var(--gh-ink) / <alpha-value>)',
          'ink-2': 'rgb(var(--gh-ink-2) / <alpha-value>)',
          muted: 'rgb(var(--gh-muted) / <alpha-value>)',
          subtle: 'rgb(var(--gh-subtle) / <alpha-value>)',
          primary: 'rgb(var(--gh-primary) / <alpha-value>)',
          'on-primary': 'rgb(var(--gh-on-primary) / <alpha-value>)',
          'primary-pressed': 'rgb(var(--gh-primary-pressed) / <alpha-value>)',
          'primary-strong': 'rgb(var(--gh-primary-strong) / <alpha-value>)',
          'primary-tint': 'rgb(var(--gh-primary-tint) / <alpha-value>)',
          'focus-ring': 'rgb(var(--gh-focus-ring) / <alpha-value>)',
          available: 'rgb(var(--gh-available) / <alpha-value>)',
          'available-bg': 'rgb(var(--gh-available-bg) / <alpha-value>)',
          taken: 'rgb(var(--gh-taken) / <alpha-value>)',
          'taken-bg': 'rgb(var(--gh-taken-bg) / <alpha-value>)',
          warning: 'rgb(var(--gh-warning) / <alpha-value>)',
          'warning-bg': 'rgb(var(--gh-warning-bg) / <alpha-value>)',
          danger: 'rgb(var(--gh-danger) / <alpha-value>)',
          'danger-bg': 'rgb(var(--gh-danger-bg) / <alpha-value>)',
        },
```

Inside `theme.extend.borderRadius`, add (keep `lg`/`md`/`sm`):

```ts
        'gh-sm': 'var(--gh-radius-sm)',
        'gh-md': 'var(--gh-radius-md)',
        'gh-lg': 'var(--gh-radius-lg)',
        'gh-xl': 'var(--gh-radius-xl)',
        'gh-sheet': 'var(--gh-radius-sheet)',
        'gh-pill': 'var(--gh-radius-pill)',
```

Inside `theme.extend`, add:

```ts
      boxShadow: {
        'gh-sheet': 'var(--gh-shadow-sheet)',
        'gh-panel': 'var(--gh-shadow-panel)',
        'gh-menu': 'var(--gh-shadow-menu)',
      },
```

(If `theme.extend` already has `boxShadow` or `fontFamily`, merge into it.)

- [ ] **Step 5: Base font and focus ring in `src/index.css`**

In the second `@layer base` block, replace the `body { … font-family: 'Inter', … }` rule with:

```css
  body {
    @apply bg-background text-foreground font-sans antialiased;
  }

  :focus-visible {
    outline: 2px solid rgb(var(--gh-focus-ring));
    outline-offset: 2px;
  }
```

- [ ] **Step 6: Verify**

Run: `npm run build && npx tsc --noEmit -p tsconfig.app.json; npm run lint`
Expected: build passes; only the pre-existing type and lint errors. `grep -c "gh-ink" dist/assets/*.css` ≥ 1.

- [ ] **Step 7: Commit**

```bash
git add src/styles/tokens.css src/index.css tailwind.config.ts index.html
git commit -m "feat(ui): add GiftHunt design tokens, fonts and Tailwind namespace"
```

---

### Task 2: Re-point legacy colours at the tokens

**Files:**
- Modify: `src/index.css` (both variable blocks), `tailwind.config.ts` (legacy colour entries), `src/lib/theme.ts` (`applyThemeColors`), `src/components/ui/sidebar.tsx` (only if it uses `hsl(var(--sidebar…))` and breaks — see step 3)
- Delete: `src/components/ThemeSettings.tsx`
- Modify: every file found by the step-5 grep (white text on accent/danger fills)

**Interfaces:**
- Consumes: `--gh-*` from Task 1.
- Produces: legacy variables now hold RGB channels pointing at tokens; Tailwind legacy colours use `rgb(var(--x) / <alpha-value>)`. New legacy colours `ios-on-blue` and `ios-on-red` for text on `ios-blue` / `ios-red` / `destructive` fills.

Mapping (legacy → token):

| Legacy variable | Token |
|---|---|
| `--background` | `--gh-bg` |
| `--foreground`, `--card-foreground`, `--popover-foreground`, `--secondary-foreground`, `--accent-foreground` | `--gh-ink` |
| `--card`, `--popover` | `--gh-surface-200` |
| `--primary` | `--gh-primary` |
| `--primary-foreground` | `--gh-on-primary` |
| `--secondary`, `--muted` | `--gh-surface-300` |
| `--muted-foreground` | `--gh-muted` |
| `--accent` | `--gh-surface-400` |
| `--destructive` | `--gh-danger` |
| `--destructive-foreground` | `--gh-on-danger` (new, see below) |
| `--border` | `--gh-line` |
| `--input` | `--gh-line-strong` |
| `--ring` | `--gh-focus-ring` |
| `--ios-background` | `--gh-bg` |
| `--ios-secondary-background` | `--gh-surface-200` |
| `--ios-tertiary-background` | `--gh-surface-300` |
| `--ios-quaternary-background` | `--gh-surface-400` |
| `--ios-blue`, `--ios-purple` | `--gh-primary-strong` |
| `--ios-green` | `--gh-available` |
| `--ios-red` | `--gh-danger` |
| `--ios-gray` | `--gh-muted` |
| `--ios-separator` | `--gh-muted` (it is almost always used with an opacity modifier such as `/10`) |
| `--ios-on-blue` (new) | light `255 255 255`, dark `42 18 21` |
| `--gh-on-danger` / `--ios-on-red` (new) | light `255 255 255`, dark `42 18 21` |

- [ ] **Step 1: Replace the variable blocks in `src/index.css`**

In the first `@layer base` block, replace the whole `:root { … }` and `.dark { … }` blocks with:

```css
  :root {
    --background: var(--gh-bg);
    --foreground: var(--gh-ink);
    --card: var(--gh-surface-200);
    --card-foreground: var(--gh-ink);
    --popover: var(--gh-surface-200);
    --popover-foreground: var(--gh-ink);
    --primary: var(--gh-primary);
    --primary-foreground: var(--gh-on-primary);
    --secondary: var(--gh-surface-300);
    --secondary-foreground: var(--gh-ink);
    --muted: var(--gh-surface-300);
    --muted-foreground: var(--gh-muted);
    --accent: var(--gh-surface-400);
    --accent-foreground: var(--gh-ink);
    --gh-on-danger: 255 255 255;
    --destructive: var(--gh-danger);
    --destructive-foreground: var(--gh-on-danger);
    --border: var(--gh-line);
    --input: var(--gh-line-strong);
    --ring: var(--gh-focus-ring);

    --radius: 1rem;

    /* Safe area insets for iOS PWA */
    --safe-area-top: env(safe-area-inset-top);
    --safe-area-bottom: env(safe-area-inset-bottom);
    --safe-area-left: env(safe-area-inset-left);
    --safe-area-right: env(safe-area-inset-right);

    --gradient-primary: none;
    --gradient-accent: none;
    --shadow-soft: var(--gh-shadow-menu);
    --transition-smooth: all 0.2s cubic-bezier(0.2, 0, 0, 1);

    /* Legacy iOS palette, re-pointed at GiftHunt tokens until phases 3–6 replace the screens */
    --ios-background: var(--gh-bg);
    --ios-secondary-background: var(--gh-surface-200);
    --ios-tertiary-background: var(--gh-surface-300);
    --ios-quaternary-background: var(--gh-surface-400);
    --ios-blue: var(--gh-primary-strong);
    --ios-on-blue: 255 255 255;
    --ios-green: var(--gh-available);
    --ios-purple: var(--gh-primary-strong);
    --ios-red: var(--gh-danger);
    --ios-on-red: var(--gh-on-danger);
    --ios-gray: var(--gh-muted);
    --ios-separator: var(--gh-muted);

    --sidebar-background: var(--gh-surface-100);
    --sidebar-foreground: var(--gh-ink);
    --sidebar-primary: var(--gh-primary);
    --sidebar-primary-foreground: var(--gh-on-primary);
    --sidebar-accent: var(--gh-surface-400);
    --sidebar-accent-foreground: var(--gh-ink);
    --sidebar-border: var(--gh-line);
    --sidebar-ring: var(--gh-focus-ring);
  }

  .dark {
    /* Text on the light pastel fills that dark mode uses */
    --gh-on-danger: 42 18 21;
    --ios-on-blue: 42 18 21;
  }
```

Remove the old comment "All colors MUST be HSL." at the top and replace it with: `/* Colours come from src/styles/tokens.css (the GiftHunt design system). Legacy shadcn and iOS variables below point at those tokens. */`

- [ ] **Step 2: Switch the legacy Tailwind colours to the RGB-channel format**

In `tailwind.config.ts`, change every `'hsl(var(--x))'` to `'rgb(var(--x) / <alpha-value>)'` (all entries under `colors`: `border`, `input`, `ring`, `background`, `foreground`, `primary`, `secondary`, `destructive`, `muted`, `accent`, `popover`, `card`, `ios`, `sidebar`). Add to the `ios` entry:

```ts
          red: 'rgb(var(--ios-red) / <alpha-value>)',
          'on-blue': 'rgb(var(--ios-on-blue) / <alpha-value>)',
          'on-red': 'rgb(var(--ios-on-red) / <alpha-value>)',
```

(`ios-red` is used in 20 places but was never defined in the config, so those classes generated nothing until now — check that these places look intended once it exists, in step 6.)

- [ ] **Step 3: Remaining `hsl(var(--…))` uses**

Run: `grep -rn "hsl(var(--" src index.html`
For each hit outside `tailwind.config.ts`, change `hsl(var(--x))` to `rgb(var(--x))` and `hsl(var(--x) / a)` to `rgb(var(--x) / a)`. Known: `src/components/ui/sidebar.tsx` and the `.ios-header-safe-area` rules in `src/index.css`.

- [ ] **Step 4: Stop the runtime colour override**

In `src/lib/theme.ts`, replace the body of `applyThemeColors` with:

```ts
const applyThemeColors = (_colors: ThemeColors, isDark: boolean) => {
  const root = document.documentElement;
  // GiftHunt has one accent (Smultron, in src/styles/tokens.css); only light/dark is applied here.
  root.classList.toggle('dark', isDark);
  root.setAttribute('data-theme', isDark ? 'dark' : 'light');
};
```

Delete `src/components/ThemeSettings.tsx` (run `grep -rn "ThemeSettings" src` first; expected: no importers). Leave the rest of `theme.ts` and `ThemeContext.tsx` as they are.

- [ ] **Step 5: White text on accent and danger fills**

Run: `grep -rn "text-white" src | grep -E "bg-ios-blue|bg-ios-red|bg-destructive|bg-primary"`
In each matching class string, replace `text-white` with `text-ios-on-blue` (for `bg-ios-blue` / `bg-primary`) or `text-ios-on-red` (for `bg-ios-red` / `bg-destructive`). Also handle `focus:bg-ios-blue focus:text-white` and `data-[state=open]:bg-ios-blue data-[state=open]:text-white` the same way (`focus:text-ios-on-blue`, …). Then run `grep -rn "text-white" src` and inspect what remains: white text on `bg-black/…` overlays, the orange local-dev banner and images may stay; anything else on a token-coloured fill gets the matching `on-*` colour.

- [ ] **Step 6: Verify in the browser** (`npm run dev:local`, local Supabase; seed a list with a few items via the app)

Check at 390px and 1280px, light and dark (toggle via the header menu → appearance), and screenshot: Home (Dashboard), the owner's list (ManageWishlist), the organizer's list (AdminWishlist), the share page (PublicWishlist), the sign-in page. Confirm:
- every button label is readable on its fill in both themes (dark text on the pastel/dark accent fills);
- borders and separators that used `/10`, `/20` are faint lines, not solid blocks, and translucent header backgrounds stay translucent;
- `ios-red` usages now look intended (they were unstyled before).
Save screenshots to the PR-description folder of your choice under the scratchpad and list the paths in your report.

- [ ] **Step 7: Verify build, types, lint**

Run: `npm run build && npx tsc --noEmit -p tsconfig.app.json; npm run lint`
Expected: as in Global Constraints.

- [ ] **Step 8: Commit**

```bash
git add src/index.css tailwind.config.ts src/lib/theme.ts <every file changed in steps 3 and 5>
git rm src/components/ThemeSettings.tsx
git commit -m "feat(ui): re-point legacy colours at GiftHunt tokens"
```

---

### Task 3: New AppHeader

**Files:**
- Modify: `src/components/AppHeader.tsx`
- Modify: `src/locales/en.json`, `src/locales/sv.json` (one new key)

**Interfaces:**
- Consumes: Tailwind `gh` colours, `font-brand`, `rounded-gh-*`, `shadow-gh-menu` (Task 1); `useAuth()` from `@/components/auth/useAuth` (exposes the signed-in `user`; read `user.user_metadata.full_name` or `user.email` — check the hook's return type first and use what it really exposes).
- Produces: unchanged default export `AppHeader` with no props; same menu items and handlers as today.

Design (from the design system's AppHeader component): a sticky bar on `bg-gh-surface-100/90` with a backdrop blur and a `border-gh-line` bottom hairline, safe-area top padding as today, content max-width `max-w-4xl` centred, height 56px. Left: the wordmark **GiftHunt** as a link to `/`, `font-brand` 600, 22px, `text-gh-ink` (no icon). Right: a 40px round avatar button (`rounded-gh-pill`, `bg-gh-primary-tint`, `text-gh-primary-strong`, 15px semibold initials; a lucide `User` icon when the user has no name) with `aria-label={t('common.openMenu')}`, opening the existing dropdown.

- [ ] **Step 1: Add the translation key**

In `src/locales/en.json` under `"common"`: `"openMenu": "Open menu"`. In `src/locales/sv.json` under `"common"`: `"openMenu": "Öppna menyn"`. (Keep JSON valid; add a comma where needed.)

- [ ] **Step 2: Rewrite the header markup**

Replace `src/components/AppHeader.tsx` with a version that keeps every import still used, all handlers (`handleSignOut`, `toggleLanguage`, `getCurrentThemeIcon`) and every `DropdownMenuItem` with its `onClick`, and changes only the markup and classes:

```tsx
  const fullName: string | undefined = user?.user_metadata?.full_name;
  const initials = fullName
    ? fullName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('')
    : '';

  return (
    <header className="sticky top-0 z-50 w-full bg-gh-surface-100/90 backdrop-blur-xl border-b border-gh-line pt-[env(safe-area-inset-top)]">
      <div className="mx-auto max-w-4xl w-full px-4 h-14 flex items-center justify-between">
        <Link
          to="/"
          className="font-brand font-semibold text-[22px] leading-none text-gh-ink tracking-[-0.3px] rounded-gh-sm">
          GiftHunt
        </Link>

        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t('common.openMenu')}
              className="h-10 w-10 rounded-gh-pill bg-gh-primary-tint text-gh-primary-strong text-[15px] font-semibold flex items-center justify-center active:scale-[0.97] transition-transform">
              {initials || <User className="w-5 h-5" aria-hidden="true" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 rounded-gh-md p-1 bg-gh-surface-200 border border-gh-line shadow-gh-menu">
            {/* the existing items, each with className:
                "flex items-center gap-3 px-3 py-2.5 rounded-gh-sm text-[16px] text-gh-ink focus:bg-gh-surface-300 focus:text-gh-ink"
                the sub-trigger additionally "data-[state=open]:bg-gh-surface-300";
                the sub-content "w-40 rounded-gh-md p-1 bg-gh-surface-200 border border-gh-line shadow-gh-menu";
                the separator "bg-gh-line mx-1 my-1";
                the sign-out item "… text-gh-danger focus:bg-gh-danger-bg focus:text-gh-danger" */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
```

Get `user` from `useAuth()` alongside `signOut` (adjust to the hook's real field names). Remove the `GiftHuntIcon` and `Button` imports from this file if unused (the icon component itself stays; other pages use it). The wordmark is the brand name and stays untranslated.

- [ ] **Step 3: Verify**

`npm run build`, `npx tsc --noEmit -p tsconfig.app.json`, `npm run lint` (as in Global Constraints). In the browser (390px and 1280px, light and dark): wordmark in Fredoka, avatar with initials; a fresh account in onboarding shows the person icon; the menu opens with all five entries working (Profile, Appearance → Light/Dark/System, language toggle, Sign out); keyboard Tab shows the focus ring on the wordmark and avatar.

- [ ] **Step 4: Commit**

```bash
git add src/components/AppHeader.tsx src/locales/en.json src/locales/sv.json
git commit -m "feat(ui): new GiftHunt app header"
```

---

### Task 4: Docs, full check and PR

**Files:**
- Modify: `CLAUDE.md` (section "UI / iOS design system")

- [ ] **Step 1: Replace the design section of `CLAUDE.md`**

Replace the whole "### UI / iOS design system" section (from its heading up to, but not including, "### Gift card / multi-claim items") with:

```markdown
### UI / GiftHunt design system

The look comes from the **GiftHunt design system** (claude.ai artifact: https://claude.ai/artifact/UWZ3km7B9v3y6vSDg8uWhu — tokens, brand book, components). Read its README before building UI.

- **Tokens** live in `src/styles/tokens.css` as `--gh-*` CSS variables (colours as RGB channels) and in Tailwind as `gh-*` colours (`bg-gh-surface-200`, `text-gh-muted`, `border-gh-line`), `rounded-gh-*` radii and `shadow-gh-*` shadows. Never hardcode a colour. Light is `:root`, dark is `.dark` (set by `src/lib/theme.ts`, which also sets `data-theme`).
- **Accent:** `gh-primary` (pastel Smultron) fills only the one primary action, with `text-gh-on-primary` (never white). Links, focus and active markers use `gh-primary-strong`.
- **Type:** IBM Plex Sans (`font-sans`) for UI; Fredoka (`font-brand`) only for the GiftHunt wordmark. Body 16px, captions 13px, nothing under 12px.
- **Status:** item status is a word plus a pill (`gh-available`/`gh-available-bg` "Ledig", `gh-taken`/`gh-taken-bg` "Tagen"); destructive is `gh-danger` (rust), never the accent.
- **Legacy:** older screens still use shadcn variables and an `ios-*` palette; both point at the GiftHunt tokens (`src/index.css`). Text on `bg-ios-blue` / `bg-ios-red` uses `text-ios-on-blue` / `text-ios-on-red`. New code uses the `gh-*` names only.

**Responsive overlays** — use `useIsMobile()` to switch:

- Mobile → `Drawer` (bottom sheet) from `@/components/ui/drawer`
- Desktop → `Dialog` (centered modal) from `@/components/ui/dialog`

**Prevent input focus loss**: never define sub-components (e.g. `FormContent`) inside a parent component's render body. Define them at the module's top level — inline component definitions are treated as new types on every render, destroying DOM state and focus.

Action placement convention: primary actions top-right, cancel/close top-left, destructive actions full-width at the bottom.
```

- [ ] **Step 2: Full check**

- `npm run build`, `npx tsc --noEmit -p tsconfig.app.json`, `npm run lint` as in Global Constraints.
- Browser (local Supabase): set the OS to dark with the app on "System" → the app is dark; switch to Light and Dark explicitly → both apply and survive a reload.
- Screenshots at 390px and 1280px, light and dark, of Home, owner list, organizer list, share page, sign-in. A long list title ("Födelsedagsönskelistan för hela familjen") doesn't overflow at 390px.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: describe the GiftHunt design system in CLAUDE.md"
```

- [ ] **Step 4: PR (after the user agrees)**

Push the branch and open a PR with before/after screenshots. Merging deploys the frontend (no database changes in this phase).
