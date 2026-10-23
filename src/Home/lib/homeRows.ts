import type {
  ArchivedRow,
  InvitationRaw,
  InvitationRow,
  OrganizedListRaw,
  OrganizedRow,
  OwnedListRaw,
  OwnedRow,
  ProfileName,
} from '../types/index.ts';

/** The name to show for a person: full name, else e-mail, else nothing. */
export const displayName = (profile: ProfileName | null): string | null => {
  if (!profile) return null;
  const name = profile.full_name?.trim();
  if (name) return name;
  const email = profile.email?.trim();
  return email ? email : null;
};

export const firstName = (fullName: string | null | undefined): string | null => {
  const name = fullName?.trim().split(/\s+/)[0];
  return name ? name : null;
};

export const toOwnedRows = (lists: OwnedListRaw[]): OwnedRow[] =>
  lists
    .filter((list) => list.archived_at === null)
    .map((list) => ({
      id: list.id,
      title: list.title,
      itemCount: list.itemCount,
      // On a self-managed list the "organizer" is the owner themselves.
      organizerName: list.is_self_managed ? null : displayName(list.organizer),
      selfManaged: list.is_self_managed,
    }));

export const toArchivedRows = (lists: OwnedListRaw[]): ArchivedRow[] =>
  lists
    .filter((list) => list.archived_at !== null)
    .map((list) => ({ id: list.id, title: list.title, itemCount: list.itemCount }));

export const toOrganizedRows = (lists: OrganizedListRaw[]): OrganizedRow[] =>
  lists.map((list) => ({
    id: list.id,
    title: list.title,
    ownerName: displayName(list.owner),
    itemCount: list.itemCount,
    requestCount: list.requestCount,
  }));

/** An invitation to a list the user made themselves can never be accepted, so it is not offered. */
export const withoutOwnLists = (invitations: InvitationRaw[], ownedIds: string[]): InvitationRaw[] =>
  invitations.filter((invitation) => !ownedIds.includes(invitation.wishlistId));

export const toInvitationRows = (invitations: InvitationRaw[]): InvitationRow[] =>
  invitations.map((invitation) => ({
    id: invitation.id,
    title: invitation.title,
    inviterName: displayName(invitation.inviter),
  }));
