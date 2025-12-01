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

export const updateBookingSchema = z.object({
  affiliateUsername: z.string().optional(),
  tier: z.enum(["Growth", "Domination", "Empire"]).optional(),
  status: z.enum(["call_scheduled", "no_show", "follow_up", "no_interest", "sale"]).optional(),
});

// Availability Management
export const availability = pgTable("availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: text("start_time").notNull(), // "00:00"
  endTime: text("end_time").notNull(), // "23:45"
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type Availability = typeof availability.$inferSelect;

// Booking Questions (Custom Form Builder)
export const bookingQuestions = pgTable("booking_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  questionType: text("question_type").notNull(), // "short_answer", "paragraph", "multiple_choice", "checkboxes", "dropdown", "file_upload", "linear_scale", "rating", "date", "time"
  options: text("options"), // JSON string for multiple choice, checkboxes, dropdown options
  isRequired: boolean("is_required").notNull().default(true),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export type BookingQuestion = typeof bookingQuestions.$inferSelect;

// Appointments (Scheduled Calls)
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  attendeeName: text("attendee_name").notNull(),
  attendeeEmail: text("attendee_email").notNull(),
  guests: text("guests"), // JSON string [{name, email}]
  appointmentTime: timestamp("appointment_time").notNull(),
  formResponses: text("form_responses").notNull(), // JSON string of all answers
  referralId: varchar("referral_id"),
  affiliateUsername: text("affiliate_username"),
  googleCalendarEventId: text("google_calendar_event_id"),
  googleSheetRowId: text("google_sheet_row_id"),
  confirmationEmailSent: boolean("confirmation_email_sent").notNull().default(false),
  reminderEmailSent: boolean("reminder_email_sent").notNull().default(false),
  status: text("status").notNull().default("scheduled"), // "scheduled", "completed", "cancelled"
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type Appointment = typeof appointments.$inferSelect;

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  googleCalendarEventId: true,
  googleSheetRowId: true,
  confirmationEmailSent: true,
  reminderEmailSent: true,
  status: true,
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

// Founder Settings
export const founderSettings = pgTable("founder_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timeFormat: text("time_format").notNull().default("12h"), // "12h" or "24h"
  meetingDuration: integer("meeting_duration").notNull().default(30), // minutes
  bufferTime: integer("buffer_time").notNull().default(20), // minutes
  timezone: text("timezone").notNull().default("America/Toronto"),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type FounderSettings = typeof founderSettings.$inferSelect;

// Members/Employees
export const members = pgTable("members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  passwordHash: text("password_hash").notNull(),
  profilePicture: text("profile_picture"),
  role: text("role").notNull().default("MEMBER"), // MEMBER, MANAGER, ADMIN, etc.
  memberSince: timestamp("member_since").notNull().default(sql`now()`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type Member = typeof members.$inferSelect;

// Clients
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  passwordHash: text("password_hash").notNull(),
  tier: text("tier"), // Growth, Domination, Empire
  phoneNumber: text("phone_number"),
  instagramUsername: text("instagram_username"),
  totalSpent: integer("total_spent").notNull().default(0), // in cents
  clientSince: timestamp("client_since").notNull().default(sql`now()`),
  monthlyPaymentDate: integer("monthly_payment_date"), // Day of month (1-31)
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type Client = typeof clients.$inferSelect;

// Social Media Accounts
export const socialMediaAccounts = pgTable("social_media_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  accountName: text("account_name").notNull(), // Name to identify this account
  username: text("username").notNull(),
  password: text("password").notNull(),
  platform: text("platform").notNull(), // instagram, tiktok, youtube, facebook
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type SocialMediaAccount = typeof socialMediaAccounts.$inferSelect;

// Billing Information (Iranian Bank Cards)
export const billingInfo = pgTable("billing_info", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull(),
  cardNumber: text("card_number"),
  shebah: text("shebah"),
  fullNameOnCard: text("full_name_on_card"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type BillingInfo = typeof billingInfo.$inferSelect;

// Transactions
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull(),
  type: text("type").notNull(), // "task_completed", "bonus", "payment", "penalty", etc.
  description: text("description").notNull(),
  points: integer("points").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export type Transaction = typeof transactions.$inferSelect;

// Member Stats
export const memberStats = pgTable("member_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull().unique(),
  currentBalance: integer("current_balance").notNull().default(0), // points
  totalEarned: integer("total_earned").notNull().default(0), // points
  totalPaid: integer("total_paid").notNull().default(0), // points
  tasksCompleted: integer("tasks_completed").notNull().default(0),
  bonusesReceived: integer("bonuses_received").notNull().default(0),
  paymentsProcessed: integer("payments_processed").notNull().default(0),
  tasksIncomplete: integer("tasks_incomplete").notNull().default(0),
  penaltiesApplied: integer("penalties_applied").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type MemberStats = typeof memberStats.$inferSelect;

// Workspace Currency
export const workspaceCurrency = pgTable("workspace_currency", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  exchangeRate: text("exchange_rate").notNull().default("0.052083333333333"), // 1 point = X USD
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type WorkspaceCurrency = typeof workspaceCurrency.$inferSelect;

// Projects
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type Project = typeof projects.$inferSelect;

// Issue Templates
export const issueTemplates = pgTable("issue_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url"),
  videoDuration: text("video_duration"), // "0:01:00" format
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type IssueTemplate = typeof issueTemplates.$inferSelect;

// Issues (Tasks/Projects)
export const issues = pgTable("issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id"),
  templateId: varchar("template_id"),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url"),
  videoDuration: text("video_duration"),
  status: text("status").notNull().default("backlog"), // backlog, ready_for_editing, editing, ready_for_caption, ready_for_upload
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type Issue = typeof issues.$inferSelect;

// Clips (for Clipping Area)
export const clips = pgTable("clips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  clipNumber: integer("clip_number").notNull(),
  filePath: text("file_path").notNull(),
  isValid: boolean("is_valid"), // null = pending, true = valid, false = not valid
  rejectionNote: text("rejection_note"),
  reviewedBy: varchar("reviewed_by"), // member id
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export type Clip = typeof clips.$inferSelect;

// Template Tasks (Tasks that belong to a template)
export const templateTasks = pgTable("template_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull(),
  name: text("name").notNull(), // "Video Selection", "Translate", "Dub", "Edit", "Admin"
  points: integer("points").notNull().default(0),
  priority: text("priority").notNull().default("no_priority"), // no_priority, low, medium, high
  assignedTo: varchar("assigned_to"), // member id
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type TemplateTask = typeof templateTasks.$inferSelect;

// Tasks (Sub-tasks within issues)
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  issueId: varchar("issue_id").notNull(),
  templateTaskId: varchar("template_task_id"), // Reference to template task if created from template
  name: text("name").notNull(), // "Video Selection", "Translate", "Dub", "Edit", "Admin"
  points: integer("points").notNull().default(0),
  priority: text("priority").notNull().default("no_priority"), // no_priority, low, medium, high
  assignedTo: varchar("assigned_to"), // member id
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type Task = typeof tasks.$inferSelect;
