# Profile

`/profile` (canvas: https://claude.ai/artifact/55y11MkuWVCCyYvWMHBTEb). The header avatar opens it.

## What it does
- **Om dig:** name (trimmed, required, ≤ 100 characters; "Spara namn" is enabled once it changes) and the read-only e-mail.
- **Utseende** (light, dark, follow device) and **Språk** (Svenska, English) apply at once and are remembered by the theme and i18n providers.
- "Medlem sedan …" and **Logga ut** at the bottom (no confirmation).

## Structure
- `lib/memberSince.ts` – the date (unit tested); name rules are in `src/lib/personName.ts`
- `hooks/useProfile.ts` – load and save
- `services/ProfileService.ts` – `profiles` read and update
- `components/` – `AboutSection`, `ProfileLoading`
