# Wishlist

The wishlist screen at `/wishlist/:id` (spec: `docs/superpowers/specs/2026-10-20-ui-redesign-design.md`).

## What it does
- `index.tsx` finds the viewer's role (`lib/mode.ts`). **Owner** gets `components/OwnerWishlist`. Organizers and self-managed owners are redirected to `/wishlist/:id/admin` and `/wishlist/:id/self` until phase 4c; everyone else goes Home.
- Owner mode: add, edit and delete items; invite and follow an organizer (the owner never sees the share link or anything about what is taken); list settings; and, once the list is shared, change requests.
- While the list is unshared, item edits go straight to the database. Once an active share link exists the database refuses direct updates and deletes (phase 4a), so edits and removals are sent through `request_item_change` and answered by the organizer (neutral answers: "Ändringen är gjord" / "behöll önskningen som den var").

## Structure
- `lib/` – pure logic with unit tests (`npm run test:unit`): form → row, proposals, request view-model, role → mode
- `services/WishlistService.ts` – all Supabase calls
- `hooks/useOwnerWishlist.ts` – state and actions
- `components/` – the screen, the item form sheet, share (invite organizer) sheet, settings sheet, request card

## Design
Approved canvas: https://claude.ai/artifact/VEUdZk5qZ1d8iGL8s3Udkp. Design system: https://claude.ai/artifact/UWZ3km7B9v3y6vSDg8uWhu.
