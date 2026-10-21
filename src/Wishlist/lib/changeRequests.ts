import type {
  ChangeRequestRow,
  ChangedField,
  FieldChange,
  FieldValue,
  OwnerItem,
  OwnerRequest,
} from '../types/index.ts';

/** Answered requests stay visible this long, then they are history. */
export const ANSWER_VISIBLE_DAYS = 7;

const FIELD: Record<string, ChangedField> = {
  title: 'title',
  description: 'description',
  link: 'link',
  url: 'image',
  price_range: 'price',
  priority: 'priority',
  is_giftcard: 'giftcard',
  claim_cap: 'claimCap',
};

const currentValue = (item: OwnerItem, key: string): unknown =>
  (item as unknown as Record<string, unknown>)[key];

const normalise = (value: unknown): FieldValue => {
  if (value === undefined || value === null || value === '') return null;
  return value as FieldValue;
};

const changesFor = (row: ChangeRequestRow, item: OwnerItem | undefined, applied: boolean): FieldChange[] => {
  if (row.kind !== 'edit' || !row.proposed) return [];
  return Object.entries(row.proposed)
    .filter(([key]) => key in FIELD)
    .map(([key, value]): FieldChange => {
      const change: FieldChange = { field: FIELD[key], after: normalise(value) };
      if (!applied && item) change.before = normalise(currentValue(item, key));
      return change;
    });
};

export const toOwnerRequests = (
  rows: ChangeRequestRow[],
  items: OwnerItem[],
  now: Date,
): OwnerRequest[] => {
  const cutoff = now.getTime() - ANSWER_VISIBLE_DAYS * 86_400_000;
  const byId = new Map(items.map((item) => [item.id, item]));

  const mapped = rows.flatMap((row): OwnerRequest[] => {
    if (row.status === 'withdrawn') return [];
    const item = row.item_id ? byId.get(row.item_id) : undefined;
    const base = { id: row.id, itemId: row.item_id, itemTitle: row.item_title, kind: row.kind, message: row.message };
    if (row.status === 'pending') {
      return [{ ...base, state: 'pending', changes: changesFor(row, item, false), when: row.created_at }];
    }
    const answeredAt = row.resolved_at ?? row.created_at;
    if (new Date(answeredAt).getTime() < cutoff) return [];
    const applied = row.status === 'approved';
    return [
      {
        ...base,
        state: applied ? 'applied' : 'kept',
        changes: changesFor(row, item, applied),
        when: answeredAt,
      },
    ];
  });

  const rank = (request: OwnerRequest) => (request.state === 'pending' ? 0 : 1);
  return mapped.sort(
    (a, b) => rank(a) - rank(b) || new Date(b.when).getTime() - new Date(a.when).getTime(),
  );
};
