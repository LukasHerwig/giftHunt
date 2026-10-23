# Home

The page at `/` (spec: `docs/superpowers/specs/2026-10-20-ui-redesign-design.md`, canvas: https://claude.ai/artifact/Bn2EAQs9VsGuWgpApRfYpF).

## What it does
- **Invitations** to organize someone's list sit on top and are accepted (`accept_invitation`) or turned down (`decline_invitation`, with an inline confirm) on the card.
- **Mina önskelistor**: lists the user made (including ones made for someone else and shared by themselves, marked "Du delar listan"), then a "Ny önskelista" row. **Listor jag arrangerar**: lists someone else made, with "N förfrågningar" when change requests wait.
- "Ny önskelista" opens a sheet: a list for yourself, or one for someone else (self-managed: the creator is its organizer). Only links are on to begin with; price and priority are switched on in the list's Settings. The new list opens at once.
- **Arkiverade**: the owner's archived lists, folded away until "Visa" is tapped; each opens the read-only list. Shown last, only when there are any, and never inside Mina önskelistor.
- A first visit with no lists shows an empty state with the primary action.

## Structure
- `lib/` – pure logic with unit tests (`npm run test:unit`): display names, row view-models, new-list validation and insert row
- `services/HomeService.ts` – Supabase calls (RLS decides what each section lists)
- `hooks/useHome.ts` – state and actions
- `components/` – loading state, invitation card, list section, new-list sheet; `src/components/gh/ListRow.tsx` is the row
