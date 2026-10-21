# AcceptInvitation

`/accept-invitation?token=…` from the invitation e-mail (canvas: https://claude.ai/artifact/55y11MkuWVCCyYvWMHBTEb).

## What it does
- **Signed out:** shows who invited and which list; "Logga in" / "Skapa konto" store the token (`sessionStorage` `pendingInvitationToken`) and go to `/auth`.
- **Signed in:** calls `accept_invitation` straight away and opens `/wishlist/:id`. The token is removed once the invitation is accepted or found no longer valid.
- **Problems** (`lib/invitation.ts`): no longer valid (withdrawn, used, expired, list already has an organizer), wrong account (never shows the invited address; "Logga ut" keeps the token so the right account lands back here), unconfirmed e-mail, or a failure with retry.

## Structure
- `lib/invitation.ts` – token and accept outcome mapping (unit tested)
- `hooks/useAcceptInvitation.ts` – the flow; accepts once per token and account
- `services/AcceptInvitationService.ts` – the two RPCs
- `components/` – shell, loading, prompt, problem screens
