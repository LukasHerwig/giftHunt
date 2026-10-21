/** Store links come from the list owner: always open them as an https URL. */
export const toStoreUrl = (link: string): string => {
  const trimmed = link.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};
