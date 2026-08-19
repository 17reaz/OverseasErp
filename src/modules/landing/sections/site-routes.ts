/**
 * Central place to point the landing page at the app's EXISTING auth routes.
 *
 * This file does not add any routing or auth logic — it only holds the two
 * path strings the landing sections link to, so they live in one place.
 *
 * ⚠️ Update these two values to match your actual React Router paths
 * (e.g. the paths used in your <Route path="..."> definitions for the
 * login and signup pages) if they differ from the defaults below.
 */
export const SITE_ROUTES = {
  LOGIN: "/login",
  SIGNUP: "/signup",
} as const;
