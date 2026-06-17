// Script to add next payment columns to clients table
import { db } from "./server/db";
import { sql } from "drizzle-orm";

export async function addNextPaymentColumns() {
  try {
    console.log("[Migration] Checking and adding next payment columns to clients table...");
    
    // Check if nextPaymentDate column exists
    const nextPaymentDateColumns = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'clients' AND column_name = 'next_payment_date';
    `);
    
    if (nextPaymentDateColumns.rows.length === 0) {
      console.log("[Migration] Adding next_payment_date column...");
      await db.execute(sql`
        ALTER TABLE clients 
        ADD COLUMN next_payment_date TIMESTAMP;
      `);
      console.log("[Migration] ✓ Added next_payment_date column to clients table");
    } else {
      console.log("[Migration] ✓ next_payment_date column already exists");
    }
    
    // Check if nextPaymentAmount column exists
    const nextPaymentAmountColumns = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'clients' AND column_name = 'next_payment_amount';
    `);
    
    if (nextPaymentAmountColumns.rows.length === 0) {
      console.log("[Migration] Adding next_payment_amount column...");
      await db.execute(sql`
        ALTER TABLE clients 
        ADD COLUMN next_payment_amount INTEGER;
      `);
      console.log("[Migration] ✓ Added next_payment_amount column to clients table");
    } else {
      console.log("[Migration] ✓ next_payment_amount column already exists");
    }
    
    // Check if nextPaymentNote column exists
    const nextPaymentNoteColumns = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'clients' AND column_name = 'next_payment_note';
    `);
    
    if (nextPaymentNoteColumns.rows.length === 0) {
      console.log("[Migration] Adding next_payment_note column...");
      await db.execute(sql`
        ALTER TABLE clients 
        ADD COLUMN next_payment_note TEXT;
      `);
      console.log("[Migration] ✓ Added next_payment_note column to clients table");
    } else {
      console.log("[Migration] ✓ next_payment_note column already exists");
    }
    
    return true;
  } catch (error: any) {
    console.error("[Migration] ✗ Error adding columns:", error.message);
    return false;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addNextPaymentColumns().then(() => process.exit(0));
}



