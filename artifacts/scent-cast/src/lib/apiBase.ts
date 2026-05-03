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

/**
 * Full URL for Google OAuth start — must hit the API host so redirect_uri matches Google Cloud.
 *
 * Split deploy (Vercel UI + Render API): set **VITE_API_ORIGIN** (or VITE_OAUTH_ORIGIN) at **build**
 * to your API origin (e.g. https://xxx.onrender.com). If missing in production builds, `/api/auth/google`
 * would wrongly resolve against the frontend host (OAuth never reaches the API).
 */
export function googleOAuthAuthorizeUrl(): string {
  if (oauthOrigin) return `${oauthOrigin}/api/auth/google`;
  if (import.meta.env.DEV) return "http://localhost:8080/api/auth/google";
  if (import.meta.env.PROD) {
    console.error(
      "VITE_API_ORIGIN (or VITE_OAUTH_ORIGIN) is not set. Add it on Vercel (Production env) and redeploy.",
    );
    return `${import.meta.env.BASE_URL}?oauth_error=missing_api_origin`;
  }
  return apiUrl("/api/auth/google");
}
