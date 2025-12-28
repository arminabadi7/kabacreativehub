// Script to fix the social_media_accounts table by adding missing columns
// Run this with: npm run dev (it will be executed automatically)
// OR run directly: npx tsx fix-social-media-table.ts

import { db } from "./server/db";
import { sql } from "drizzle-orm";

export async function fixSocialMediaAccountsTable() {
  try {
    console.log("[Fix] Checking social_media_accounts table structure...");
    
    // Check what columns exist
    const columns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'social_media_accounts'
      ORDER BY ordinal_position;
    `);
    
    console.log("[Fix] Current columns:");
    columns.rows.forEach((col: any) => {
      console.log(`[Fix]   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    const columnNames = columns.rows.map((col: any) => col.column_name);
    let fixed = false;
    
    // Check if platforms column exists
    if (!columnNames.includes('platforms')) {
      console.log("[Fix] ✗ 'platforms' column is missing. Adding it...");
      
      await db.execute(sql`
        ALTER TABLE social_media_accounts 
        ADD COLUMN IF NOT EXISTS platforms TEXT NOT NULL DEFAULT '[]';
      `);
      
      console.log("[Fix] ✓ Added 'platforms' column");
      fixed = true;
    } else {
      console.log("[Fix] ✓ 'platforms' column exists");
    }
    
    // Check if there's an old 'platform' (singular) column that conflicts
    if (columnNames.includes('platform')) {
      console.log("[Fix] ⚠️  Found old 'platform' (singular) column. Making it nullable or removing it...");
      
      // First, try to make it nullable if it has data
      try {
        await db.execute(sql`
          ALTER TABLE social_media_accounts 
          ALTER COLUMN platform DROP NOT NULL;
        `);
        console.log("[Fix] ✓ Made 'platform' column nullable");
      } catch (e: any) {
        console.log("[Fix] Could not make platform nullable, will try to drop it");
      }
      
      // If platforms column exists and has data, we can drop the old platform column
      // But be careful - only drop if platforms column exists
      if (columnNames.includes('platforms')) {
        try {
          await db.execute(sql`
            ALTER TABLE social_media_accounts 
            DROP COLUMN IF EXISTS platform;
          `);
          console.log("[Fix] ✓ Dropped old 'platform' column");
          fixed = true;
        } catch (e: any) {
          console.log("[Fix] ⚠️  Could not drop 'platform' column:", e.message);
        }
      }
    }
    
    // Check if account_name column exists
    if (!columnNames.includes('account_name')) {
      console.log("[Fix] ✗ 'account_name' column is missing. Adding it...");
      
      await db.execute(sql`
        ALTER TABLE social_media_accounts 
        ADD COLUMN IF NOT EXISTS account_name TEXT;
      `);
      
      console.log("[Fix] ✓ Added 'account_name' column");
      fixed = true;
    } else {
      console.log("[Fix] ✓ 'account_name' column exists");
    }
    
    // Check if created_at column exists
    if (!columnNames.includes('created_at')) {
      console.log("[Fix] ✗ 'created_at' column is missing. Adding it...");
      
      await db.execute(sql`
        ALTER TABLE social_media_accounts 
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();
      `);
      
      console.log("[Fix] ✓ Added 'created_at' column");
      fixed = true;
    } else {
      console.log("[Fix] ✓ 'created_at' column exists");
    }
    
    if (fixed) {
      console.log("[Fix] ✓ Table structure has been fixed!");
    } else {
      console.log("[Fix] ✓ Table structure is already correct!");
    }
    
    return true;
  } catch (error: any) {
    console.error("[Fix] ✗ Error fixing table:", error.message);
    console.error("[Fix] Full error:", error);
    return false;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixSocialMediaAccountsTable().then(() => process.exit(0));
}

