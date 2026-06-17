import { db } from "./server/db";
import { bookings } from "./shared/schema";
import { sql } from "drizzle-orm";

async function checkBookings() {
  try {
    const allBookings = await db.select().from(bookings).orderBy(sql`created_at DESC`);
    console.log(`Found ${allBookings.length} bookings in database`);
    if (allBookings.length > 0) {
      console.log("\nFirst 5 bookings:");
      allBookings.slice(0, 5).forEach((b, i) => {
        console.log(`${i + 1}. ${b.attendeeName} (${b.attendeeEmail}) - Affiliate: ${b.affiliateUsername || 'None'} - Created: ${b.createdAt}`);
      });
    }
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkBookings();
