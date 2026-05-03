import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { parsePostgresConnectionUrl, sslForDatabaseUrl } from "./src/pgSsl";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
config({ path: path.join(root, ".env") });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing. Add it to the repo root .env (see .env.example) or export it before running drizzle-kit.",
  );
}

const credentials = parsePostgresConnectionUrl(process.env.DATABASE_URL);
const ssl = sslForDatabaseUrl(process.env.DATABASE_URL);

export default defineConfig({
  schema: "./src/schema/**/*.ts",
  dialect: "postgresql",
  dbCredentials: {
    ...credentials,
    ...(ssl !== undefined ? { ssl } : {}),
  },
});
