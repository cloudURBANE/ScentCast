import "./bootstrap-env";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort =
  process.env["PORT"] ??
  (process.env.NODE_ENV === "production" ? undefined : "8080");

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required in production.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const host = process.env.HOST ?? "0.0.0.0";

app.listen(port, host, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port, host }, "Server listening");
});
