/** The readable part of a name: the whole name, or the e-mail's local part when the name is an address. */
const words = (name: string): string[] => {
  const trimmed = name.trim();
  const base = trimmed.includes('@') && !/\s/.test(trimmed) ? trimmed.split('@')[0] : trimmed;
  return base.split(/\s+/).filter(Boolean);
};

/** "Maja Herwig" -> "Maja"; an e-mail gives its local part. */
export const firstName = (name: string): string => words(name)[0] ?? '';

/** "Maja Herwig" -> "MH", "Maja" -> "M", "bo@x.se" -> "B". */
export const initials = (name: string): string => {
  const parts = words(name);
  if (parts.length === 0) return '';
  const first = Array.from(parts[0])[0];
  const last = parts.length > 1 ? Array.from(parts[parts.length - 1])[0] : '';
  return (first + last).toUpperCase();
};
