import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(dir, "../../../.env");
if (existsSync(envPath)) {
  config({ path: envPath });
}
