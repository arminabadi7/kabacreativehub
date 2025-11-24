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
  passwordHash: text("password_hash"),
  paymentMethod: text("payment_method"),
  paymentDetails: text("payment_details"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertAffiliateSchema = createInsertSchema(affiliates).omit({
  id: true,
  createdAt: true,
  passwordHash: true,
}).extend({
  username: z.string().regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores").min(3).max(30),
  email: z.string().email(),
});

export const registerAffiliateSchema = insertAffiliateSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginAffiliateSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type InsertAffiliate = z.infer<typeof insertAffiliateSchema>;
export type RegisterAffiliate = z.infer<typeof registerAffiliateSchema>;
export type LoginAffiliate = z.infer<typeof loginAffiliateSchema>;
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

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  attendeeName: text("attendee_name").notNull(),
  attendeeEmail: text("attendee_email").notNull(),
  eventTime: timestamp("event_time").notNull(),
  referralId: varchar("referral_id"),
  affiliateUsername: text("affiliate_username"),
  tier: text("tier"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  confirmedAt: timestamp("confirmed_at"),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  confirmedAt: true,
  status: true,
}).extend({
  attendeeName: z.string().min(1, "Attendee name is required"),
  attendeeEmail: z.string().email(),
  eventTime: z.coerce.date(),
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export const confirmBookingSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  tier: z.enum(["Growth", "Domination", "Empire"]),
});
