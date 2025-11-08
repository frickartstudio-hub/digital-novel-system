import { Pool } from "pg";
import { env } from "../config/env";

export const pool = new Pool({
  connectionString: env.DATABASE_URL || undefined,
  max: Number(process.env.PG_POOL_MAX ?? 10),
  ssl: env.DATABASE_SSL
    ? {
        rejectUnauthorized: false,
      }
    : undefined,
});

export async function initDb(): Promise<void> {
  try {
    await pool.query("SELECT 1");
    console.log("[db] PostgreSQL connection established");
  } catch (error) {
    console.error("[db] Failed to connect to PostgreSQL", error);
    throw error;
  }
}
