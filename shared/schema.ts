import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const affiliates = pgTable("affiliates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull(),
  paymentMethod: text("payment_method"),
  paymentDetails: text("payment_details"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertAffiliateSchema = createInsertSchema(affiliates).omit({
  id: true,
  createdAt: true,
}).extend({
  username: z.string().regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores").min(3).max(30),
  email: z.string().email(),
});

export type InsertAffiliate = z.infer<typeof insertAffiliateSchema>;
export type Affiliate = typeof affiliates.$inferSelect;

export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull(),
  referrerUsername: text("referrer_username").notNull(),
  visitorIP: text("visitor_ip"),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
  converted: boolean("converted").notNull().default(false),
  conversionDate: timestamp("conversion_date"),
});

export const trackReferralSchema = z.object({
  referrerUsername: z.string().regex(/^[a-zA-Z0-9_]+$/, "Invalid username format"),
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  timestamp: true,
  converted: true,
  conversionDate: true,
});

export type TrackReferral = z.infer<typeof trackReferralSchema>;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;

export const updatePaymentSchema = z.object({
  paymentMethod: z.enum(["paypal", "etransfer", "banktransfer"]),
  paymentDetails: z.string().min(1, "Payment details are required"),
});

export type UpdatePayment = z.infer<typeof updatePaymentSchema>;

export const affiliateStatsSchema = z.object({
  totalClicks: z.number(),
  totalConversions: z.number(),
  totalCommission: z.number(),
});
