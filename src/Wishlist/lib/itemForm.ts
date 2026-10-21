import type { ItemFormData, ItemFormError, OwnerItem } from '../types/index.ts';

export const TITLE_MAX = 200;

export const emptyItemForm = (): ItemFormData => ({
  title: '',
  description: '',
  link: '',
  url: '',
  priceRange: '',
  priority: null,
  isGiftcard: false,
  claimCap: null,
});

export const formFromItem = (item: OwnerItem): ItemFormData => ({
  title: item.title,
  description: item.description ?? '',
  link: item.link ?? '',
  url: item.url ?? '',
  priceRange: item.price_range ?? '',
  priority: item.priority ?? null,
  isGiftcard: item.is_giftcard ?? false,
  claimCap: item.claim_cap ?? null,
});

export const validateItemForm = (form: ItemFormData): ItemFormError | null => {
  const title = form.title.trim();
  if (title === '') return 'title_required';
  if (title.length > TITLE_MAX) return 'title_too_long';
  if (
    form.isGiftcard &&
    form.claimCap != null &&
    (!Number.isInteger(form.claimCap) || form.claimCap < 1)
  ) {
    return 'claim_cap_invalid';
  }
  return null;
};

const clean = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

/** The columns of wishlist_items an owner writes. */
export const toItemRow = (form: ItemFormData) => ({
  title: form.title.trim(),
  description: clean(form.description),
  link: clean(form.link),
  url: clean(form.url),
  price_range: clean(form.priceRange),
  priority: form.priority,
  is_giftcard: form.isGiftcard,
  claim_cap: form.isGiftcard ? form.claimCap : null,
});

export type ItemRowValues = ReturnType<typeof toItemRow>;

/** Only the fields that differ from the item: what `request_item_change` accepts. */
export const buildProposal = (item: OwnerItem, form: ItemFormData): Partial<ItemRowValues> => {
  const next = toItemRow(form);
  const current: ItemRowValues = {
    title: item.title,
    description: item.description ?? null,
    link: item.link ?? null,
    url: item.url ?? null,
    price_range: item.price_range ?? null,
    priority: item.priority ?? null,
    is_giftcard: item.is_giftcard ?? false,
    claim_cap: item.is_giftcard ? (item.claim_cap ?? null) : null,
  };
  const proposal: Record<string, unknown> = {};
  for (const key of Object.keys(next) as (keyof ItemRowValues)[]) {
    if (next[key] !== current[key]) proposal[key] = next[key];
  }
  return proposal as Partial<ItemRowValues>;
};
export const priorityName = (priority: number | null): 'low' | 'medium' | 'high' | null => {
  if (priority === 1) return 'low';
  if (priority === 2) return 'medium';
  if (priority === 3) return 'high';
  return null;
};
