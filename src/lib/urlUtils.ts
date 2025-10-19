/**
 * Utility function to get the correct base URL for the application
 * Uses environment variable for flexibility across deployments
 */
export const getBaseUrl = (): string => {
  return import.meta.env.VITE_APP_BASE_URL || window.location.origin;
};
