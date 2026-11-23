# List helpers: run a list for someone else together

Date: 2026-11-23 · Status: approved · Issue: #58

## Intent

When you make a list for someone else (a self-managed list: a child's birthday, a relative who doesn't use the app), you often don't run it alone. Two parents, or a parent and a grandparent, want to add wishes, fix them and see what's been taken. Today only the creator can do that. The organizer invitation doesn't fit: the database allows one organizer per list, the self-managed creator already holds that row, and organizers can't add items.

This feature lets the creator of a self-managed list invite **helpers**. A helper works inside the list as the creator does. The list itself stays the creator's.

## Roles

| Can… | Creator | Helper |
| --- | --- | --- |
| Add, edit, delete items | ✓ | ✓ |
| See Lediga · Tagna and who took what; make an item free; remove one gift from a gift card | ✓ | ✓ |
| Copy the active share link | ✓ | ✓ |
| Create or turn off the share link | ✓ | – |
| Rename, change settings, archive, unarchive, delete the list | ✓ | – |
| Invite helpers, withdraw an invitation, remove a helper | ✓ | – |
| Leave the list | – | ✓ |

The user decided the first two rows ("full gift overview", option A) and that list-level actions and inviting belong only to the creator. The share-link split and "leave" are my calls: creating or killing the link decides whether guests can reach the list, which is a list-level decision. A helper needs a way out that doesn't depend on the creator.

## Goals

- The creator of a self-managed list can invite any number of helpers by email and remove them again.
- A helper who accepts gets the organizer screen with add-item, and sees the list on Home.
- Ordinary lists (a list for yourself) behave exactly as today: at most one organizer, who cannot add items.

## Non-goals

- Helpers on ordinary lists. On your own list, someone else adding items would spoil the surprise, and the organizer role covers helping there.
- Helpers inviting others, handing over ownership, or promoting a helper to creator.
- Notifications when a helper changes something, or a log of who changed what.
- Helpers seeing each other's names or emails (only the creator sees the helper list).

## Anti-goals (would make this a failure even if it works)

- Any change to what an ordinary list's owner or organizer can do, or to what the gift recipient can see.
- A helper able to rename, archive, delete or change settings through the API, not just the UI. Every rule above is enforced in the database.
- A shared list breaking for guests once a list has more than one organizer row (see the `get_shared_wishlist` fix below).

## Approaches considered

1. **Reuse the organizer setup and allow several on self-managed lists (chosen).** A helper is one more `wishlist_admins` row; invitations stay in `admin_invitations`. Almost everything a helper needs already works for admins: `wishlist_items_admin` for claims, `items_admin_update/delete`, `claims_admin_delete`, the accept page, Home's organized lists. The cost: "admin" means slightly different things depending on `is_self_managed`, and the code paths that assume one admin per list need to handle several.
2. **A separate helpers table with its own invitations.** Cleaner naming, but it duplicates the invitation and accept flow, the claims view and every item policy. Roughly double the RLS to write and test. Rejected.

The user picked approach 1.

## Design

### Database (one new migration, tested with pgTAP)

**Who is a helper.** A helper is a `wishlist_admins` row on a self-managed list whose `admin_id` is not the creator. `is_wishlist_admin` already covers creator and helpers alike, since the creator of a self-managed list has their own admin row. Add one SQL helper, `is_self_managed(p_wishlist_id)` (security definer, like the others), for policies.

**Constraints.**
- `wishlist_admins`: replace `wishlist_admins_one_per_wishlist UNIQUE (wishlist_id)` with `UNIQUE (wishlist_id, admin_id)`. Keep the one-per-list rule for ordinary lists with a `before insert` trigger that refuses a second row for a *different* `admin_id` when the list is not self-managed (`admin_already_exists`). The same `admin_id` passes, so `on conflict do nothing` stays a quiet no-op as today. It can't be a partial index because `is_self_managed` lives on `wishlists`. The trigger runs as definer and takes a row lock on the wishlist, so two parallel accepts can't both pass.
- `admin_invitations`: replace `admin_invitations_one_per_wishlist UNIQUE (wishlist_id)` with a partial unique index on `(wishlist_id, lower(email)) where not accepted`. Accepted rows no longer block inviting the same address again after someone leaves.
  - On ordinary lists, a `before insert` trigger keeps "at most one invitation per list" and raises SQLSTATE `23505`, as the old constraint did, so `WishlistService.invite`'s `invite_pending` mapping and the existing pgTAP tests keep working unchanged. *(My call: no behaviour change on ordinary lists.)*
  - On self-managed lists only, inviting yourself is refused (`cannot_invite_self`), and so is inviting the email of an existing helper's profile (`already_helper`). These are front-line checks; `accept_invitation` and the unique key on `wishlist_admins` remain the real guard.
- `admin_invitations` gets an `accepted_by uuid references auth.users on delete set null` column, which `accept_invitation` fills. This links a helper's admin row to the invitation they accepted, even when the email they signed in with differs from the one invited. *(My call: a column instead of matching by email, which `20261020000011` already showed to be fragile.)*

**Items.** New policy `items_helper_insert`: `is_wishlist_admin(wishlist_id) and is_self_managed(wishlist_id) and not wishlist_is_archived(wishlist_id)`. Update and delete already pass through `items_admin_update/delete`. The owner edit lock (`wishlist_has_share_link`) applies only to the owner policies. On a self-managed list the creator edits through the admin policies too, so helpers aren't locked either. This matches today's self-managed behaviour.

**Share links.** `share_links_admin_insert/update/delete` gain `and (not is_self_managed(wishlist_id) or is_wishlist_owner(wishlist_id))`. Read (`share_links_admin_read`) stays, so helpers can copy the link.

**Invitations.** `invitations_owner_insert` already requires the owner and a non-archived list; it stays as is, and the trigger above decides how many invitations a list may have. `accept_invitation`: change `on conflict (wishlist_id)` to `on conflict (wishlist_id, admin_id)`; the trigger raises `admin_already_exists` for a second organizer on an ordinary list, as today.

**Removing and leaving.**
- New `remove_wishlist_helper(p_wishlist_id, p_admin_id)`: creator only, self-managed only, refuses `p_admin_id = creator`, refuses archived lists. It deletes that admin row and the invitation with `accepted_by = p_admin_id`, and nothing else. Unlike `remove_wishlist_admin`, it keeps the share link, taken status and claims, because the creator is still running the list.
- New `leave_wishlist(p_wishlist_id)`: deletes the caller's own admin row on a self-managed list they didn't create, and their invitation (`accepted_by = auth.uid()`).
- `remove_wishlist_admin` is unchanged and stays for ordinary lists. Guard it so it refuses self-managed lists. Today it would also delete the creator's own row.

**Archive.** No change. `archive_wishlist` already deletes every admin row except the creator's, plus all invitations. Unarchiving gives a list without helpers, as the user expects for organizers.

**Guests.** `get_shared_wishlist` reads `organizer_name` with a scalar subquery over `wishlist_admins`. With two rows it errors and the shared page breaks. On self-managed lists, return the creator's name. On ordinary lists, return the one organizer as today.

**Profiles.** `can_see_profile` already lets the creator and a helper see each other. Helpers don't see other helpers (non-goal).

### App

**Mode.** `resolveMode` (`src/Wishlist/lib/mode.ts`) gets a fourth mode, `helper`: not the creator, has an admin row, list is self-managed. `index.tsx` loads `is_self_managed` already through the wishlist row.

**Helper screen.** `OrganizerWishlist` in helper mode works like `self` mode, minus settings, archive, and the create/turn-off share-link actions:
- add item
- Lediga · Tagna
- who took what
- make free
- remove a gift
- edit and delete items
- copy the active link, or a calm line saying no share link has been created yet
- a "Leave list" action at the bottom (destructive placement, `ConfirmBlock`).

**Creator: helpers sheet.** On a self-managed list the creator gets a "Helpers" entry on the organizer screen, where Share opens on the owner screen. It opens a sheet (Drawer on mobile, Dialog on desktop) with:
- the accepted helpers (name, remove)
- pending invitations (email, withdraw)
- an email field to invite another.

The `/accept-invitation` page gets helper wording when the list is self-managed. `get_invitation_by_token` returns `is_self_managed` for that. The invitation email (the `send-invitation` Edge Function) stays as it is. Its subject, "You've been invited to help with …", already fits helpers, and leaving it alone avoids a separate manual `supabase functions deploy`, which CI doesn't run. *(My call.)*

**Home.**
- Helped lists appear for the helper in the existing "Lists I organize" section with the owner's name. No request count, since self-managed lists have none.
- `loadOwned` currently takes `admins[0]` as "the organizer". On a self-managed list that can now be a helper, so ignore admin rows on self-managed lists there, or show "+N helpers". The design board decides which.
- Pending helper invitations use the existing `InvitationCard` with helper wording.

**Copy.** All new strings in `en.json` and `sv.json`. The role is "hjälpare" / "helper".

### Visual design

The helpers sheet, the helper's screen (what's missing compared with self mode), the Home card and the invitation card wording get boards in a claude.ai Design artifact using the GiftHunt design system. The boards are approved before UI code.

## What's left to the builder

- Exact copy, beyond the role name.
- Whether the helper's Home card shows "Du hjälper till" or similar. Decided on the board.
- Error codes and toasts for refused actions. Follow `src/Wishlist/lib/errorCode.ts`.
- pgTAP coverage: every row of the roles table, run for helper, creator, ordinary-list organizer and stranger. Also two parallel accepts on an ordinary list, a shared page with two admin rows, and archive removing helpers.

## Rollout

One migration and no Edge Function changes. Merging runs `supabase db push`, which changes production in these ways:
- the constraints on `wishlist_admins` and `admin_invitations` change
- `admin_invitations` gets a new `accepted_by` column (left null on old rows)
- `get_shared_wishlist`, `get_invitation_by_token`, `accept_invitation`, `remove_wishlist_admin` and the share-link and item policies are replaced.

Existing data already satisfies the new constraints, because every list has at most one admin row and one invitation today.
