import { 
  users,
  affiliates,
  referrals,
  type User, 
  type InsertUser,
  type Affiliate,
  type InsertAffiliate,
  type Referral,
  type InsertReferral,
  type UpdatePayment
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAffiliate(id: string): Promise<Affiliate | undefined>;
  getAffiliateByUsername(username: string): Promise<Affiliate | undefined>;
  createAffiliate(affiliate: InsertAffiliate): Promise<Affiliate>;
  updateAffiliatePayment(username: string, payment: UpdatePayment): Promise<Affiliate | undefined>;
  
  createReferral(referral: InsertReferral): Promise<Referral>;
  getReferralsByAffiliate(affiliateId: string): Promise<Referral[]>;
  markReferralConverted(referralId: string): Promise<Referral | undefined>;
  getAffiliateStats(affiliateId: string): Promise<{
    totalClicks: number;
    totalConversions: number;
    totalCommission: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAffiliate(id: string): Promise<Affiliate | undefined> {
    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.id, id));
    return affiliate || undefined;
  }

  async getAffiliateByUsername(username: string): Promise<Affiliate | undefined> {
    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.username, username));
    return affiliate || undefined;
  }

  async createAffiliate(insertAffiliate: InsertAffiliate): Promise<Affiliate> {
    const [affiliate] = await db
      .insert(affiliates)
      .values(insertAffiliate)
      .returning();
    return affiliate;
  }

  async updateAffiliatePayment(username: string, payment: UpdatePayment): Promise<Affiliate | undefined> {
    const [affiliate] = await db
      .update(affiliates)
      .set({
        paymentMethod: payment.paymentMethod,
        paymentDetails: payment.paymentDetails,
      })
      .where(eq(affiliates.username, username))
      .returning();
    return affiliate || undefined;
  }

  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const [referral] = await db
      .insert(referrals)
      .values(insertReferral)
      .returning();
    return referral;
  }

  async getReferralsByAffiliate(affiliateId: string): Promise<Referral[]> {
    return await db
      .select()
      .from(referrals)
      .where(eq(referrals.affiliateId, affiliateId))
      .orderBy(desc(referrals.timestamp));
  }

  async markReferralConverted(referralId: string): Promise<Referral | undefined> {
    const [referral] = await db
      .update(referrals)
      .set({
        converted: true,
        conversionDate: new Date(),
      })
      .where(eq(referrals.id, referralId))
      .returning();
    return referral || undefined;
  }

  async getAffiliateStats(affiliateId: string): Promise<{
    totalClicks: number;
    totalConversions: number;
    totalCommission: number;
  }> {
    const allReferrals = await db
      .select()
      .from(referrals)
      .where(eq(referrals.affiliateId, affiliateId));

    const totalClicks = allReferrals.length;
    const totalConversions = allReferrals.filter(r => r.converted).length;
    
    const totalCommission = totalConversions * 1750;

    return {
      totalClicks,
      totalConversions,
      totalCommission,
    };
  }
}

export const storage = new DatabaseStorage();
