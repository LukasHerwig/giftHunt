export interface ProfileName {
  full_name: string | null;
  email: string | null;
}

export interface OwnedListRaw {
  id: string;
  title: string;
  description: string | null;
  is_self_managed: boolean;
  created_at: string;
  itemCount: number;
  /** The organizer who shares this list for the owner, if any. */
  organizer: ProfileName | null;
  /** Set once the owner archives the list. */
  archived_at: string | null;
}

export interface OrganizedListRaw {
  id: string;
  title: string;
  description: string | null;
  itemCount: number;
  owner: ProfileName | null;
  /** Pending change requests waiting for this organizer. */
  requestCount: number;
}

export interface InvitationRaw {
  id: string;
  wishlistId: string;
  title: string;
  description: string | null;
  inviter: ProfileName | null;
}

export interface HomeData {
  fullName: string | null;
  owned: OwnedListRaw[];
  organized: OrganizedListRaw[];
  invitations: InvitationRaw[];
}

/** own = a list for yourself; other = a list you make for someone else and share yourself. */
export type ListKind = 'own' | 'other';

export interface NewListForm {
  kind: ListKind;
  title: string;
  description: string;
}

export type NewListError = 'title_required' | 'title_too_long';

export interface OwnedRow {
  id: string;
  title: string;
  itemCount: number;
  /** Who shares the list for the owner (never set on a self-managed list). */
  organizerName: string | null;
  /** The viewer made it for someone else and shares it themselves. */
  selfManaged: boolean;
}

export interface ArchivedRow {
  id: string;
  title: string;
  itemCount: number;
}

export interface OrganizedRow {
  id: string;
  title: string;
  ownerName: string | null;
  itemCount: number;
  requestCount: number;
}

export interface InvitationRow {
  id: string;
  title: string;
  inviterName: string | null;
}
