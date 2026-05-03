import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { parsePostgresConnectionUrl, sslForDatabaseUrl } from "./pgSsl";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const credentials = parsePostgresConnectionUrl(process.env.DATABASE_URL);
const ssl = sslForDatabaseUrl(process.env.DATABASE_URL);

export const pool = new Pool({
  ...credentials,
  ...(ssl !== undefined ? { ssl } : {}),
});
export const db = drizzle(pool, { schema });

export * from "./schema";
