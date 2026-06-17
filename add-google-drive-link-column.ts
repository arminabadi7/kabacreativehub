import { db } from "./server/db";
import { sql } from "drizzle-orm";

export async function addGoogleDriveLinkColumn() {
  try {
    console.log("[Migration] Adding google_drive_link column to clients table...");

    const columns = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'clients' AND column_name = 'google_drive_link';
    `);

    if (columns.rows.length > 0) {
      console.log("[Migration] ✓ google_drive_link column already exists");
      return true;
    }

    await db.execute(sql`
      ALTER TABLE clients 
      ADD COLUMN google_drive_link TEXT;
    `);

    console.log("[Migration] ✓ Added google_drive_link column to clients table");
    return true;
  } catch (error: any) {
    console.error("[Migration] ✗ Error adding google_drive_link column:", error.message);
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  addGoogleDriveLinkColumn().then(() => process.exit(0));
}
