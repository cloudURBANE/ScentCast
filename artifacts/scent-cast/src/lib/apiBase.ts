/**
 * When the UI is on Vercel and the API is elsewhere, set VITE_API_ORIGIN at build time
 * (e.g. https://scent-cast-api.onrender.com). Omit or leave empty for same-origin / Replit.
 */
const origin =
  typeof import.meta.env.VITE_API_ORIGIN === "string"
    ? import.meta.env.VITE_API_ORIGIN.trim().replace(/\/+$/, "")
    : "";

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return origin ? `${origin}${p}` : p;
}

const oauthOrigin =
  (typeof import.meta.env.VITE_API_ORIGIN === "string"
    ? import.meta.env.VITE_API_ORIGIN.trim().replace(/\/+$/, "")
    : "") ||
  (typeof import.meta.env.VITE_OAUTH_ORIGIN === "string"
    ? import.meta.env.VITE_OAUTH_ORIGIN.trim().replace(/\/+$/, "")
    : "");

/** Full URL for Google OAuth start — must stay on API host (8080 locally) to match Authorized redirect URIs in Google Cloud. */
export function googleOAuthAuthorizeUrl(): string {
  if (oauthOrigin) return `${oauthOrigin}/api/auth/google`;
  if (import.meta.env.DEV) return "http://localhost:8080/api/auth/google";
  return apiUrl("/api/auth/google");
}
