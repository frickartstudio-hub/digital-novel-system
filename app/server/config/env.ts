import dotenv from "dotenv";

dotenv.config();

const required = ["DATABASE_URL"] as const;

const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.warn(
    `[env] Missing required environment variables: ${missing.join(
      ", ",
    )}. Backend features depending on them may fail.`,
  );
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 3000),
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  UPLOAD_DIR:
    process.env.UPLOAD_DIR ??
    new URL("../../uploads", import.meta.url).pathname,
};
