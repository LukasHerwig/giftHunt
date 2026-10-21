import type { NewListError, NewListForm } from '../types/index.ts';

export const TITLE_MAX = 120;

export const validateNewList = (form: NewListForm): NewListError | null => {
  const title = form.title.trim();
  if (title === '') return 'title_required';
  if (title.length > TITLE_MAX) return 'title_too_long';
  return null;
};

/** The wishlists row to insert: only links are on to begin with; the rest is changed in Settings. */
export const toNewListRow = (userId: string, form: NewListForm) => ({
  creator_id: userId,
  title: form.title.trim(),
  description: form.description.trim() === '' ? null : form.description.trim(),
  enable_links: true,
  enable_price: false,
  enable_priority: false,
  is_self_managed: form.kind === 'other',
});
