/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_ORIGIN?: string;
  /** Local/dev: API base for OAuth (e.g. http://localhost:8080); must match API_PUBLIC_URL and Google redirect URI. */
  readonly VITE_OAUTH_ORIGIN?: string;
}
