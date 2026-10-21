/** "12 oktober 2026". Written in UTC so the day never depends on the machine's time zone. */
export const formatMemberSince = (createdAt: string, locale: string): string =>
  new Date(createdAt).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
