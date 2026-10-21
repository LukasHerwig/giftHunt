export const NAME_MAX = 100;

export type NameError = 'required' | 'tooLong';

export const validateName = (name: string): NameError | null => {
  const trimmed = name.trim();
  if (trimmed === '') return 'required';
  if (trimmed.length > NAME_MAX) return 'tooLong';
  return null;
};

export const nameChanged = (saved: string | null, input: string): boolean =>
  input.trim() !== (saved ?? '').trim();

/** One or two capital letters for an avatar: from the name, else the first letter of the e-mail. */
export const initials = (
  fullName: string | null | undefined,
  email: string | null | undefined,
): string => {
  const name = fullName?.trim();
  if (name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }
  return email?.trim()[0]?.toUpperCase() ?? '';
};
