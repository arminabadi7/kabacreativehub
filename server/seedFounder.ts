import bcrypt from "bcrypt";
import { db } from "./db";
import { members } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Idempotently ensures a real Founder member account exists so the founder can
 * log in like everyone else. The env-password (FOUNDER_PASSWORD) bypass remains
 * available as an emergency backup login.
 *
 * Credentials:
 *   username : FOUNDER_USERNAME  (default "founder")
 *   email    : FOUNDER_EMAIL     (default "founder@kabacontent.com")
 *   password : FOUNDER_PASSWORD  (default "Mohi2002")
 *   role     : "founder"
 */
export async function ensureFounderAccount(): Promise<void> {
  const username = (process.env.FOUNDER_USERNAME || "founder").toLowerCase();
  const email = process.env.FOUNDER_EMAIL || "founder@kabacontent.com";
  const password = process.env.FOUNDER_PASSWORD || "Mohi2002";

  // Already have a founder-role account? Nothing to do.
  const [existingFounderRole] = await db
    .select()
    .from(members)
    .where(sql`lower(${members.role}) = 'founder'`)
    .limit(1);
  if (existingFounderRole) {
    console.log(`✓ Founder account already exists (${existingFounderRole.username})`);
    return;
  }

  // A member already occupies the founder username → promote it to founder role.
  const [existingByUsername] = await db
    .select()
    .from(members)
    .where(sql`lower(${members.username}) = ${username}`)
    .limit(1);
  if (existingByUsername) {
    await db
      .update(members)
      .set({ role: "founder" })
      .where(eq(members.id, existingByUsername.id));
    console.log(`✓ Promoted existing member "${existingByUsername.username}" to founder role`);
    return;
  }

  // Create a fresh founder account.
  const passwordHash = await bcrypt.hash(password, 10);
  const [created] = await db
    .insert(members)
    .values({
      username,
      email,
      passwordHash,
      plainPassword: password,
      fullName: "Founder",
      role: "founder",
    })
    .returning();
  console.log(`✓ Created founder account "${created.username}" (login with this + FOUNDER_PASSWORD)`);
}
