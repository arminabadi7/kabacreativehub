// Quick fix to remove the conflicting 'platform' column
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function quickFix() {
  try {
    console.log("Fixing platform column issue...");
    
    // Step 1: Make platform nullable (if it exists)
    try {
      await db.execute(sql`
        ALTER TABLE social_media_accounts 
        ALTER COLUMN platform DROP NOT NULL;
      `);
      console.log("✓ Made 'platform' column nullable");
    } catch (e: any) {
      console.log("⚠️  Could not make platform nullable:", e.message);
    }
    
    // Step 2: Drop the old platform column
    try {
      await db.execute(sql`
        ALTER TABLE social_media_accounts 
        DROP COLUMN IF EXISTS platform;
      `);
      console.log("✓ Dropped old 'platform' column");
    } catch (e: any) {
      console.log("⚠️  Could not drop platform column:", e.message);
    }
    
    // Step 3: Ensure platforms column exists
    try {
      await db.execute(sql`
        ALTER TABLE social_media_accounts 
        ADD COLUMN IF NOT EXISTS platforms TEXT NOT NULL DEFAULT '[]';
      `);
      console.log("✓ Ensured 'platforms' column exists");
    } catch (e: any) {
      console.log("⚠️  Could not add platforms column:", e.message);
    }
    
    console.log("\n✓ Fix complete! Try creating an account again.");
    
  } catch (error: any) {
    console.error("✗ Error:", error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

quickFix();



