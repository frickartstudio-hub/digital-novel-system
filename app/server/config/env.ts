import dotenv from "dotenv";
import path from "path";

dotenv.config();
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(process.cwd(), "app/.env") });
}

const required = ["DATABASE_URL"] as const;

const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.warn(
    `[env] Missing required environment variables: ${missing.join(
      ", ",
    )}. Backend features depending on them may fail.`,
  );
}

function parseBoolean(value: string | undefined) {
  if (!value) return false;
  return value === "true" || value === "1";
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 3000),
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  DATABASE_SSL: parseBoolean(process.env.DATABASE_SSL),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? "http://localhost:3000",
  UPLOAD_DIR:
    process.env.UPLOAD_DIR ??
    new URL("../../uploads", import.meta.url).pathname,
};
