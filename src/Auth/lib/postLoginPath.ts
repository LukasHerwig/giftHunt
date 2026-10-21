/** Where to go after signing in: back to a pending invitation, else Home. */
export const postLoginPath = (pendingToken: string | null): string =>
  pendingToken ? `/accept-invitation?token=${encodeURIComponent(pendingToken)}` : '/';
