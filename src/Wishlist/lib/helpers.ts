export type HelperEntry =
  | { kind: 'helper'; adminId: string; name: string; email: string | null }
  | { kind: 'pending'; invitationId: string; email: string };

export interface AdminRow {
  admin_id: string;
  profiles: { full_name: string | null; email: string | null } | null;
}

export interface InviteRow {
  id: string;
  email: string;
  accepted: boolean;
  expires_at: string;
}

/** Helpers by name, then waiting invitations by e-mail. The creator's own row and expired invitations are left out. */
export const toHelperEntries = (
  creatorId: string,
  admins: AdminRow[],
  invites: InviteRow[],
  now: Date,
): HelperEntry[] => {
  const helpers = admins
    .filter((admin) => admin.admin_id !== creatorId)
    .map((admin): HelperEntry => {
      const email = admin.profiles?.email ?? null;
      return {
        kind: 'helper',
        adminId: admin.admin_id,
        name: admin.profiles?.full_name || email || '',
        email,
      };
    })
    .sort((a, b) => (a.kind === 'helper' && b.kind === 'helper' ? a.name.localeCompare(b.name, 'sv') : 0));
  const pending = invites
    .filter((invite) => !invite.accepted && new Date(invite.expires_at) > now)
    .map((invite): HelperEntry => ({ kind: 'pending', invitationId: invite.id, email: invite.email }))
    .sort((a, b) => (a.kind === 'pending' && b.kind === 'pending' ? a.email.localeCompare(b.email, 'sv') : 0));
  return [...helpers, ...pending];
};
