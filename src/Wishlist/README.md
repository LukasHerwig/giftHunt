# Wishlist

The wishlist screen at `/wishlist/:id` (spec: `docs/superpowers/specs/2026-10-20-ui-redesign-design.md`).

## What it does
- `index.tsx` finds the viewer's role (`lib/mode.ts`). **Owner** gets `components/OwnerWishlist`. **Organizers** and the creator of a **self-managed** list get `components/OrganizerWishlist`; everyone else goes Home. The old `/manage`, `/admin` and `/self` addresses redirect here.
- Owner mode: add, edit and delete items; invite and follow an organizer (the owner never sees the share link or anything about what is taken); list settings; and, once the list is shared, change requests.
- Organizer mode: decide the owner's change requests (with an optional message), Lediga · Tagna, who took what, make an item free, remove one gift from a gift card, edit or delete an item, and create, copy and turn off the share link. A self-managed creator gets the same screen plus add item and settings, and no requests. An invited organizer cannot add items (the database refuses it).
- While the list is unshared, item edits go straight to the database. Once an active share link exists the database refuses direct updates and deletes (phase 4a), so edits and removals are sent through `request_item_change` and answered by the organizer (neutral answers: "Ändringen är gjord" / "behöll önskningen som den var").

## Structure
- `lib/` – pure logic with unit tests (`npm run test:unit`): form → row, proposals, request view-model, role → mode
- `services/WishlistService.ts`, `services/OrganizerService.ts` – all Supabase calls (owner, organizer)
- `hooks/useOwnerWishlist.ts`, `hooks/useOrganizerWishlist.ts` – state and actions
- `components/` – the two screens, the item form sheet, share (invite organizer) and share link sheets, settings sheet, request cards, organizer item sheet

## Design
Approved canvases: owner https://claude.ai/artifact/VEUdZk5qZ1d8iGL8s3Udkp, organizer https://claude.ai/artifact/7H54j1GKPXSCWqeEcBjor9. Design system: https://claude.ai/artifact/UWZ3km7B9v3y6vSDg8uWhu.
