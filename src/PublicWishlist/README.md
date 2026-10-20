# PublicWishlist

The page givers open from a share link (`/shared/:token`). No login and no app chrome.

## What it does
- Loads the list through the `get_shared_wishlist` RPC and claims through `claim_shared_item` (`services/PublicWishlistService.ts`). Anonymous users have no table access.
- Splits the items into **Det här har du tagit** (what this device claimed), **Lediga** and **Redan tagna** (`lib/groupItems.ts`).
- Every item opens in one sheet (`components/ItemSheet.tsx`): a claim form while it is available, a read-only view once it is taken, and a receipt right after claiming.
- The device remembers the giver's name and the items they took in `localStorage` (`lib/giverMemory.ts`). The page works without storage.

## Structure
- `index.tsx` – layout and sections
- `hooks/usePublicWishlist.ts` – load, claim, sheet state
- `lib/` – pure logic with unit tests (`npm run test:unit`)
- `components/` – row, sheet, detail, form, receipt, loading / inactive-link / empty states
- Shared UI: `src/components/gh/` and `src/components/ResponsiveSheet.tsx`

## Design
Design canvas: https://claude.ai/artifact/6tVsedsaGbYMx5yKpyzY2b. Design system: https://claude.ai/artifact/UWZ3km7B9v3y6vSDg8uWhu.
