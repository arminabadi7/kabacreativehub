// Script to add payment plans tables
import { db } from "./server/db";
import { sql } from "drizzle-orm";

export async function addPaymentPlansTables() {
  try {
    console.log("[Migration] Checking and creating payment_plans table...");
    
    // Check if payment_plans table exists
    const paymentPlansTable = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'payment_plans';
    `);
    
    if (paymentPlansTable.rows.length === 0) {
      console.log("[Migration] Creating payment_plans table...");
      await db.execute(sql`
        CREATE TABLE payment_plans (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          client_id VARCHAR NOT NULL,
          month INTEGER NOT NULL,
          year INTEGER NOT NULL,
          total_amount INTEGER NOT NULL,
          currency TEXT NOT NULL DEFAULT 'USD',
          note TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT now()
        )
      `);
      console.log("[Migration] ✓ Created payment_plans table");
    } else {
      console.log("[Migration] ✓ payment_plans table already exists");
    }

    console.log("[Migration] Checking and creating payment_plan_installments table...");
    
    // Check if payment_plan_installments table exists
    const installmentsTable = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'payment_plan_installments';
    `);
    
    if (installmentsTable.rows.length === 0) {
      console.log("[Migration] Creating payment_plan_installments table...");
      await db.execute(sql`
        CREATE TABLE payment_plan_installments (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          payment_plan_id VARCHAR NOT NULL,
          amount INTEGER NOT NULL,
          due_date TIMESTAMP NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          paid_at TIMESTAMP,
          income_id VARCHAR,
          created_at TIMESTAMP NOT NULL DEFAULT now()
        )
      `);
      console.log("[Migration] ✓ Created payment_plan_installments table");
    } else {
      console.log("[Migration] ✓ payment_plan_installments table already exists");
    }
    
    return true;
  } catch (error: any) {
    console.error("[Migration] ✗ Error creating payment plans tables:", error.message);
    return false;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addPaymentPlansTables().then(() => process.exit(0));
}

