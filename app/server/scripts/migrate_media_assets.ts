
import { pool } from "../db/pool";

async function migrate() {
    try {
        console.log("Starting migration...");

        // Add data column if it doesn't exist
        await pool.query(`
      ALTER TABLE media_assets 
      ADD COLUMN IF NOT EXISTS data BYTEA;
    `);

        console.log("Migration completed successfully: Added 'data' column to 'media_assets'.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
