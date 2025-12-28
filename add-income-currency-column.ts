// Script to add currency and client_id columns to income table
import { db } from "./server/db";
import { sql } from "drizzle-orm";

export async function addIncomeCurrencyColumn() {
  try {
    console.log("[Migration] Checking and adding missing columns to income table...");
    
    // Check if currency column exists
    const currencyColumns = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'income' AND column_name = 'currency';
    `);
    
    if (currencyColumns.rows.length === 0) {
      console.log("[Migration] Adding currency column...");
      await db.execute(sql`
        ALTER TABLE income 
        ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';
      `);
      console.log("[Migration] ✓ Added currency column to income table");
    } else {
      console.log("[Migration] ✓ currency column already exists");
    }
    
    // Check if client_id column exists
    const clientIdColumns = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'income' AND column_name = 'client_id';
    `);
    
    if (clientIdColumns.rows.length === 0) {
      console.log("[Migration] Adding client_id column...");
      await db.execute(sql`
        ALTER TABLE income 
        ADD COLUMN client_id VARCHAR(255);
      `);
      console.log("[Migration] ✓ Added client_id column to income table");
    } else {
      console.log("[Migration] ✓ client_id column already exists");
    }
    
    return true;
  } catch (error: any) {
    console.error("[Migration] ✗ Error adding columns:", error.message);
    return false;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addIncomeCurrencyColumn().then(() => process.exit(0));
}
