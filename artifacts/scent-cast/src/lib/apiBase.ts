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

/** True when UI is loaded from localhost (vite dev/preview proxies /api to the backend). */
function isLocalFrontend(): boolean {
  if (typeof window === "undefined") return import.meta.env.DEV;
  const { hostname } = window.location;
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/**
 * Full URL for Google OAuth start — must hit the API host so redirect_uri matches Google Cloud.
 *
 * Split deploy (Vercel UI + Render API): set **VITE_API_ORIGIN** (or VITE_OAUTH_ORIGIN) at **build**
 * to your API origin (e.g. https://xxx.onrender.com). If missing there, navigating to `/api/auth/google`
 * on Vercel would never reach the Express API — so we refuse on non-local hosts unless VITE_* is set.
 *
 * Avoid `import.meta.env.PROD` here: some hosts mis-set NODE_ENV during `vite build`, which would wrongly
 * emit relative `/api/...` in the SPA and break OAuth.
 */
export function googleOAuthAuthorizeUrl(): string {
  // Nuclear Option: Force the app to use Render, bypassing Vite Env Vars
  return "https://scentcast.onrender.com/api/auth/google";
}
