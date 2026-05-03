import type { ConnectionOptions } from "tls";

/** Parsed pieces for `pg.Pool` / Drizzle (no `connectionString` — lets us attach `ssl`). */
export function parsePostgresConnectionUrl(urlStr: string): {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
} {
  const u = new URL(urlStr);
  const database = decodeURIComponent(u.pathname.replace(/^\//, "") || "postgres");
  const user = decodeURIComponent(u.username);
  const password = decodeURIComponent(u.password);
  const host = u.hostname;
  const port = u.port ? Number(u.port) : 5432;
  return { host, port, user, password, database };
}

/**
 * Supabase and other cloud URLs need TLS. Local Docker typically does not.
 * DATABASE_SSL_REJECT_UNAUTHORIZED=false skips chain verification (fixes AV / TLS inspection). Avoid in production.
 */
export function sslForDatabaseUrl(urlStr: string): ConnectionOptions | undefined {
  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false") {
    return { rejectUnauthorized: false };
  }

  let hostname = "";
  try {
    hostname = new URL(urlStr).hostname;
  } catch {
    return undefined;
  }

  const needsTls =
    /\.supabase\.co$/i.test(hostname) ||
    /pooler\.supabase\.com$/i.test(hostname) ||
    /\.neon\.tech$/i.test(hostname);

  try {
    const mode = new URL(urlStr).searchParams.get("sslmode");
    if (mode && mode !== "disable") {
      return { rejectUnauthorized: true };
    }
  } catch {
    /* ignore */
  }

  if (needsTls) {
    return { rejectUnauthorized: true };
  }

  return undefined;
}
