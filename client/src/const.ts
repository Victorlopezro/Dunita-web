export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Google OAuth configuration
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// Get login URL - now points to Google login page
export const getLoginUrl = () => {
  return "/auth/login";
};
