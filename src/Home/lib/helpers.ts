import type { ProfileName } from '../types/index.ts';

interface AdminRow {
  admin_id: string;
  profile: ProfileName | null;
}

interface ListFacts {
  is_self_managed: boolean;
  creator_id: string;
}

/** The organizer shown on an owner's card. A self-managed list has none: its admin rows are the owner and helpers. */
export const ownedOrganizer = (list: ListFacts, admins: AdminRow[]): ProfileName | null =>
  list.is_self_managed ? null : (admins[0]?.profile ?? null);

/** Names of the people helping on a self-managed list: its non-creator admins, by name or else e-mail, in the same order as the list header. */
export const helperNames = (list: ListFacts, admins: AdminRow[]): string[] => {
  if (!list.is_self_managed) return [];
  const names: string[] = [];
  for (const admin of admins) {
    if (admin.admin_id === list.creator_id) continue;
    const name = admin.profile?.full_name?.trim() || admin.profile?.email?.trim();
    if (name) names.push(name);
  }
  return names.sort((a, b) => a.localeCompare(b, 'sv'));
};

/** Lists someone else made that I am admin of: ordinary ones I organize, self-managed ones I help with. */
export const splitOrganized = <T extends { is_self_managed: boolean }>(
  lists: T[],
): { organized: T[]; helped: T[] } => ({
  organized: lists.filter((list) => !list.is_self_managed),
  helped: lists.filter((list) => list.is_self_managed),
});

/** "Maja och Bo", "Maja, Bo och Eva" in the viewer's language. `and` is the fallback word where Intl.ListFormat is missing. */
export const joinNames = (names: string[], locale: string, and = 'and'): string => {
  // The project's TS lib predates Intl.ListFormat.
  const { ListFormat } = Intl as unknown as {
    ListFormat?: new (locale: string, options: object) => { format: (items: string[]) => string };
  };
  if (ListFormat) return new ListFormat(locale, { style: 'long', type: 'conjunction' }).format(names);
  if (names.length < 2) return names.join('');
  return `${names.slice(0, -1).join(', ')} ${and} ${names[names.length - 1]}`;
};
