/**
 * Service and RPC errors carry a code in `message` ("edit_locked", "request_pending", …).
 * Supabase errors are plain objects, not `Error` instances, so read `message` structurally.
 */
export const errorCode = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const { message } = error as { message: unknown };
    return typeof message === 'string' ? message : '';
  }
  return '';
};
