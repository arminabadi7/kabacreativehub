// Script to add offerLink column to clients table
import { db } from "./server/db";
import { sql } from "drizzle-orm";

export async function addOfferLinkColumn() {
  try {
    console.log("[Migration] Adding offerLink column to clients table...");
    
    // Check if column already exists
    const columns = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'clients' AND column_name = 'offer_link';
    `);
    
    if (columns.rows.length > 0) {
      console.log("[Migration] ✓ offer_link column already exists");
      return true;
    }
    
    // Add the column
    await db.execute(sql`
      ALTER TABLE clients 
      ADD COLUMN offer_link TEXT;
    `);
    
    console.log("[Migration] ✓ Added offer_link column to clients table");
    return true;
  } catch (error: any) {
    console.error("[Migration] ✗ Error adding offer_link column:", error.message);
    return false;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addOfferLinkColumn().then(() => process.exit(0));
}



