# GiftHunt UI redesign – design spec

Date: 2026-10-20
Status: draft for review

## Goal

Rebuild GiftHunt's UI and UX from scratch. The current design is hard to use: the structure is split by role into near-duplicate screens, core tasks take too many steps, and the look (an iOS imitation) is disliked.

Success means each role finishes its core task in as few steps as possible, on mobile first and on desktop:

- **Owner** – create a list and add items.
- **Organizer (admin)** – share the list, see who took what, fix mistakes, approve the owner's changes.
- **Giver** – open a share link, find a gift and claim it, without an account.

All three roles weigh equally.

## Scope

- Same features and data model as today, with a new structure, new flows and a new visual design.
- Database changes only where a flow needs them (listed under Data model changes).
- Out of scope: issue #32 (optional giver name) and the features under Later.

## Decisions

| Topic | Decision |
|---|---|
| What to change | Both structure/flows and look |
| Visual base | A **GiftHunt design system**, a sibling of the Timey design system (Zero8-AB/timey-design): same foundations and rules, own brand |
| Where designs live | claude.ai artifacts – one design system artifact and one design canvas per flow, mirrored to `docs/design/` |
| Structure | One wishlist screen that adapts to the role (approach A); no tab bar |
| Share link | **Only the organizer** creates, sees and turns off the share link. The owner never sees it, because anyone holding the link sees which items are taken |
| Owner edits after sharing | Become **change requests** the organizer approves |
| Self-managed list | Unchanged concept: the creator is the organizer of their own list, sees everything, no requests |

## 1. Structure and navigation

| Route | Who | Content |
|---|---|---|
| `/` Home | Signed in | Invitation cards at the top (accept inline), then **My wishlists** and **Wishlists I organize** as two lists of rows. "New wishlist" opens a sheet; the new list opens as soon as it is created |
| `/wishlist/:id` | Owner or organizer | One screen; mode by role (sections 2–3) |
| `/shared/:token` | Anyone | The giver's page (section 4) |
| `/auth`, `/onboarding` | – | Same purpose, restyled |
| `/accept-invitation` | Invitee | Accepts directly after sign-in; no extra trip via Home |
| `/profile` | Signed in | Name, theme and language (moved out of the header menu) |

- Removed: `/shared-wishlists`, `/wishlist/:id/manage`, `/wishlist/:id/admin`, `/wishlist/:id/self`. The old wishlist routes redirect to `/wishlist/:id`.
- App frame: a header with the GiftHunt logo on the left and an avatar on the right that opens Profile. No tab bar, no side menu.
- Mobile first. Content, choices and input open in a **BottomSheet** on mobile and a **SidePanel** on desktop. A confirming question shows inline on the same surface (ConfirmBlock); a centred Dialog only for actions started on the page itself. Never a dialog on top of a sheet. Pages are max-width centred on desktop.

## 2. Wishlist screen – shared parts

- Header: title, description, a **Dela** button (its content depends on the mode), and a ⋯ menu.
- Items as ItemRows (image or icon, title, price, priority, gift-card badge); a two-column grid on desktop.
- **Lägg till önskning** opens a sheet with the title field first and the other fields optional below. Pasting a link fills title and image through the existing `get-link-metadata` function.
- Tapping an item opens ItemDetail in a sheet/panel, where it is edited directly; delete sits at the bottom with an inline confirm.
- ⋯ → Settings: title, description, link/price/priority switches, delete the list.
- Gift-card items keep today's rules: `is_giftcard`, optional `claim_cap`, `claim_cap = null` for non-giftcard items.

## 3. Wishlist screen – modes

### Owner mode (own list)

- No claim information anywhere, and no share link.
- **Dela** opens "Bjud in en arrangör som delar listan åt dig": email invite, then its status (pending · revoke · remove organizer). Once shared, a status line says who shares the list ("Anna delar listan"), never the link.
- **Before the list is shared:** the owner adds, edits and deletes items directly.
- **After an active share link exists:**
  - New items still apply directly.
  - Editing or removing an existing item creates a **change request**. The sheet says "Skickas till arrangören för godkännande". The item shows a "Väntar på godkännande" chip; the owner can withdraw the request.
  - When the organizer has answered, the owner sees a neutral outcome ("Ändringen är gjord" / "Arrangören behöll önskningen som den var") plus the organizer's optional message. The default text never reveals whether the item was claimed.

### Organizer mode (invited admin, or creator of a self-managed list)

- **Change requests** first, as ChangeRequestCards: before → after, whether the item is claimed and by whom, and the actions **Godkänn** (the change is applied) or **Behåll som den är**, with an optional message to the owner.
- Segments **Lediga · Tagna**. Tagna shows who took what; gift cards show the number of claims and ClaimProgress against `claim_cap`.
- Untake and remove a single claim happen in the item sheet with one inline confirm.
- **Dela** opens ShareLinkCard: create, copy and turn off the link (covers issue #40).
- Self-managed list: no change requests (the creator is the organizer); settings and delete are available (missing today).
- An invited organizer does not get settings or delete for the list.

## 4. Giver page (`/shared/:token`)

- Top: list title, "Önskelista från {namn}", description. No login and no app chrome. The logo does not link to the app; a footer link "Skapa din egen önskelista" goes to `/auth`.
- **Lediga** items first (rows on mobile, grid on desktop); gift cards carry a "Flera kan ge" chip.
- **Redan tagna** at the bottom, muted but **tappable read-only**: the same detail sheet with image, description and store link, without the claim button. This way a giver who comes back can always find the item and its link again.
- **Det här har du tagit** – a section at the top with what this device has claimed on this list (localStorage: claim/item ids per token). Wrapped in try/catch; the page works without it.
- Claiming:
  1. Tap an item → sheet with image, description, price and "Öppna i butiken".
  2. "Ditt namn", prefilled from the last claim on this device (localStorage).
  3. **Jag köper den här**.
  4. The sheet turns into a receipt (SentReceipt pattern): "Du har tagit {item}", the name, and "Ångrar du dig? Hör av dig till {arrangörens namn}".
- Turned-off or unknown link → an empty state: "Den här länken är inte längre aktiv".
- No giver undo (there is always an organizer; anonymous deletes would need extra security work).

## 5. Design system and canvases

### GiftHunt design system (claude.ai design system artifact)

- **Taken from Timey's foundations:** the token structure (`bg` → `surface-100…400`, `line`/`line-strong`, `ink`/`ink-2`/`muted`/`subtle`, status colours with `-bg`, radii, three shadows, motion tokens); IBM Plex Sans as the only UI typeface; dark and light themes, following the OS until the user picks one; the rules (touch targets ≥ 44 px, focus ring 2 px, text never under 11 px, no AI-slop patterns, motion lives in the components and respects `prefers-reduced-motion`).
- **GiftHunt's own:**
  - A GiftHunt wordmark and app icon.
  - **A pastel red accent** for primary actions. It must be soft, never sharp or saturated. 3–4 pastel red/coral/rose candidates are compared on the design system canvas, and the user picks one. Buttons on the pastel fill use dark text; links use a deeper shade of the same hue so they keep 4.5:1 contrast.
  - Status colours for available/taken.
  - Empty states with a heading, one line and an action; no mascot for now.
- **Reused patterns:** Button, TextField, SwitchRow, Segmented, Chip, ListRow, SectionHeader, BottomSheet, SidePanel, Dialog, ConfirmBlock, Toast, SentReceipt, EmptyState, Skeleton.
- **New:** ItemRow / ItemCard, ItemDetail, ClaimProgress, ShareLinkCard, InviteCard, ChangeRequestCard, AppHeader.

### Canvases (mobile and desktop artboards each)

1. `gifthunt-home` – Home, create a list, invitation cards, empty states.
2. `gifthunt-wishlist-owner` – owner mode, add/edit items, invite an organizer, change requests seen by the owner, settings.
3. `gifthunt-wishlist-organizer` – Lediga/Tagna, item detail with claims, untake, remove claim, share link, approving change requests.
4. `gifthunt-shared` – giver page, claiming, receipt, read-only taken items, "Det här har du tagit", inactive link.
5. `gifthunt-account` – login, onboarding, accept invitation, profile.

### Working rules

- Design copy is in Swedish (like Timey); the app keeps en and sv through react-i18next, with no hardcoded strings.
- Canvases are mirrored to `docs/design/` so they can be read in PRs.
- The user comments on the canvases; nothing is implemented before its canvas is approved.

## 6. Data model changes

All as migrations in `supabase/migrations/`, tested with `npx supabase db reset` before `db push`. New tables get explicit `GRANT`s in the same migration (Supabase stops auto-granting for new tables from 2026-10-30).

- `share_links.is_active boolean not null default true`. The public page and its RLS only accept active links.
- New table `item_change_requests`: `id`, `item_id`, `wishlist_id`, `kind` (`edit` | `remove`), `proposed` (jsonb with the changed item fields), `status` (`pending` | `approved` | `declined` | `withdrawn`), `message` (organizer's optional text), `created_by`, `created_at`, `resolved_by`, `resolved_at`. RLS: the owner of the wishlist can insert and read their own requests and withdraw pending ones; the organizer can read them and resolve them. Approving applies the change (or the removal) to `wishlist_items` in one database function, so approve and apply cannot get out of step.
- RLS on `wishlist_items`: the owner can't update or delete existing items while the wishlist has an active share link (today only the frontend enforces this). Insert stays allowed.
- RLS so the owner of a non-self-managed list can't read claim data (`item_claims`, `is_taken`, `taken_by_name`) – today it is only left out of the frontend query. The exact mechanism (column privileges, a view, or a security-definer function) is decided in the implementation plan.
- Share link RLS stays organizer-only, as today.

## 7. Implementation and order

- Tokens become CSS variables in `src/index.css`, mapped in `tailwind.config`; the hardcoded iOS colours (`#000000`, `#1C1C1E`, `#007AFF`, `#34C759`) go away.
- shadcn/Radix primitives stay underneath, restyled. New shared components go in `src/components/`; the feature-folder structure stays.
- A new `Wishlist` feature folder for `/wishlist/:id` replaces `ManageWishlist`, `AdminWishlist` and `SelfManagedWishlist`; `SharedWishlists` is removed.
- Use `getBaseUrl()` for every generated link.

Phases, each its own GitHub issue and PR, merged to `main` when done:

1. **Database** – the changes in section 6.
2. **Design system and app frame** – the design system artifact, tokens in code, AppHeader, themes. The old screens pick up the new tokens.
3. **Giver page** – canvas, then implementation.
4. **Wishlist screen** – owner and organizer modes, change requests, redirects from the old routes.
5. **Home**.
6. **Account screens** – login, onboarding, accept invitation, profile.

Between phases, some screens are new and some old.

## 8. Testing (per phase)

There is no test suite.

- `npm run lint` and `npm run build`.
- In Chrome against local Supabase: run the phase's core flows end to end as owner, organizer and anonymous giver; screenshots at 390 px and 1280 px, dark and light, sv and en, compared with the approved canvas.
- RLS: SQL as anon, owner and organizer confirms that the owner can't read claims or the share link and can't update/delete items after sharing, and that only active links work.
- Update the design-system section of `CLAUDE.md` when phase 2 lands (the iOS rules no longer apply).

## Later (not in this redesign)

- Optional email receipt for givers ("Mejla mig en kopia"), sent without storing the address.
- Signing in as a giver, so claims are tied to an account and shown across devices.
- Illustrations for empty states.
