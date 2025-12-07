import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  type: text("type"), // 'founder' | 'manager' | 'editor' | 'clipper' | 'client' | 'affiliate' | 'member'
  role: text("role"), // For members: 'admin' | 'manager' | 'editor' | 'clipper' | 'member'
  fullName: text("full_name"),
  mustChangePassword: boolean("must_change_password").default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  type: true,
  role: true,
  fullName: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Members
export const members = pgTable("members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  plainPassword: text("plain_password"), // Plain password for founder access
  fullName: text("full_name"),
  role: text("role").notNull().default("member"), // 'admin' | 'manager' | 'editor' | 'clipper' | 'member'
  mustChangePassword: boolean("must_change_password").default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  createdAt: true,
  passwordHash: true,
}).extend({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "manager", "editor", "clipper", "member"]).optional(),
});

export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;

// Clients
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  plainPassword: text("plain_password"), // Plain password for founder access
  fullName: text("full_name"),
  tier: text("tier"), // 'Growth' | 'Domination' | 'Empire'
  phoneNumber: text("phone_number"),
  instagramUsername: text("instagram_username"),
  totalSpent: integer("total_spent").default(0), // in cents
  clientSince: timestamp("client_since").notNull().default(sql`now()`),
  monthlyPaymentDate: integer("monthly_payment_date"), // Day of month (1-31)
  contractFilePath: text("contract_file_path"),
  mustChangePassword: boolean("must_change_password").default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  clientSince: true,
  passwordHash: true,
}).extend({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(8),
  tier: z.enum(["Growth", "Domination", "Empire"]).optional(),
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export const affiliates = pgTable("affiliates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull(),
  passwordHash: text("password_hash"),
  plainPassword: text("plain_password"), // Plain password for founder access
  fullName: text("full_name"),
  country: text("country"),
  telegramAccount: text("telegram_account"),
  instagramUsername: text("instagram_username"),
  phoneNumber: text("phone_number"),
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
  saleStatus: text("sale_status"), // "sold", "failed", or null
  commissionPaid: boolean("commission_paid").notNull().default(false),
  commissionAmount: integer("commission_amount"), // in cents
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  confirmedAt: timestamp("confirmed_at"),
  soldAt: timestamp("sold_at"),
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
  saleStatus: z.enum(["sold", "failed"]).optional(),
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

// Affiliate Transactions (Commission Payouts)
export const affiliateTransactions = pgTable("affiliate_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull(),
  affiliateUsername: text("affiliate_username").notNull(),
  bookingId: varchar("booking_id"), // Reference to the booking that generated this commission
  amount: integer("amount").notNull(), // Commission amount in cents
  description: text("description"), // e.g., "Commission for Growth tier sale"
  status: text("status").notNull().default("pending"), // "pending", "paid", "cancelled"
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export type AffiliateTransaction = typeof affiliateTransactions.$inferSelect;
export const insertAffiliateTransactionSchema = createInsertSchema(affiliateTransactions).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.number().positive("Amount must be positive"),
  status: z.enum(["pending", "paid", "cancelled"]).optional(),
});

export type InsertAffiliateTransaction = z.infer<typeof insertAffiliateTransactionSchema>;

// Social Media Accounts (Account Groups - one username/password for multiple platforms)
export const socialMediaAccounts = pgTable("social_media_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  accountName: text("account_name"), // Optional name for the account group
  username: text("username").notNull(),
  password: text("password"), // Encrypted password (same for all platforms in this group)
  platforms: text("platforms").notNull(), // JSON array: ["instagram", "tiktok", "youtube", "facebook"]
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export type SocialMediaAccount = typeof socialMediaAccounts.$inferSelect;

// Issue Templates
export const issueTemplates = pgTable("issue_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  issueTitle: text("issue_title").notNull(),
  description: text("description"),
  videoUrl: text("video_url"),
  videoDuration: integer("video_duration"), // in seconds
  teamId: varchar("team_id"), // Team this template is for
  defaultStatus: text("default_status").default("todo"), // Default status when issue is created
  defaultPriority: text("default_priority").default("no_priority"), // Default priority
  defaultAssigneeId: varchar("default_assignee_id"), // Default assignee
  defaultProjectId: varchar("default_project_id"), // Default project
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export type IssueTemplate = typeof issueTemplates.$inferSelect;

// Template Tasks (Tasks that belong to a template)
export const templateTasks = pgTable("template_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull(),
  name: text("name").notNull(),
  points: integer("points").default(0),
  priority: text("priority").default("no_priority"), // "no_priority", "low", "medium", "high"
  assignedTo: varchar("assigned_to"), // Member ID
  order: integer("order").default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export type TemplateTask = typeof templateTasks.$inferSelect;

// Teams (Groups of members working together)
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export type Team = typeof teams.$inferSelect;

// Projects
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  clientId: varchar("client_id").notNull(),
  fileLink: text("file_link"),
  statusLabels: text("status_labels"), // JSON string storing custom status labels per project
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export type Project = typeof projects.$inferSelect;

// Issues (Tasks in Kanban board)
export const issues = pgTable("issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"), // "todo", "in_progress", "review", "done"
  order: integer("order").default(0),
  videoUrl: text("video_url"),
  videoDuration: integer("video_duration"), // in seconds
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export type Issue = typeof issues.$inferSelect;

// Clips
export const clips = pgTable("clips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  filePath: text("file_path"), // Optional - can be null or empty
  clipNumber: integer("clip_number").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "valid", "invalid"
  invalidNote: text("invalid_note"),
  validatedBy: varchar("validated_by"),
  validatedAt: timestamp("validated_at"),
  issueId: varchar("issue_id"), // If converted to issue
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export type Clip = typeof clips.$inferSelect;

// Tasks (Member tasks)
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id"), // Optional - can be null for issue tasks
  issueId: varchar("issue_id"), // Link to issue if this is an issue task
  title: text("title"), // Optional - can use name instead
  name: text("name"), // Alternative to title for issue tasks
  description: text("description"),
  status: text("status").notNull().default("pending"), // "pending", "completed"
  points: integer("points").default(0),
  priority: text("priority").default("no_priority"),
  assignedTo: varchar("assigned_to"), // For issue tasks
  order: integer("order").default(0),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export type Task = typeof tasks.$inferSelect;

// Income
export const income = pgTable("income", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").notNull().default("USD"),
  source: text("source"), // "client", "affiliate", "stripe", "paypal"
  description: text("description"),
  date: timestamp("date").notNull().default(sql`now()`),
  clientId: varchar("client_id"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export type Income = typeof income.$inferSelect;

// Expenses
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").notNull().default("USD"),
  category: text("category").notNull(),
  description: text("description"),
  notes: text("notes"),
  date: timestamp("date").notNull().default(sql`now()`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export type Expense = typeof expenses.$inferSelect;

// Invoices
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id"),
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").notNull().default("USD"),
  description: text("description").notNull(),
  stripeCheckoutId: text("stripe_checkout_id"),
  paypalInvoiceId: text("paypal_invoice_id"),
  status: text("status").notNull().default("pending"), // "pending", "paid", "cancelled"
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export type Invoice = typeof invoices.$inferSelect;

// Notes (Team Chat/Comments)
export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id"),
  projectId: varchar("project_id"),
  taskId: varchar("task_id"),
  authorId: varchar("author_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export type Note = typeof notes.$inferSelect;

// Outreach Tracking
export const outreachTracking = pgTable("outreach_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull(), // DM account ID
  date: timestamp("date").notNull().default(sql`now()`),
  count: integer("count").default(0),
  responseRate: integer("response_rate"), // percentage
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export type OutreachTracking = typeof outreachTracking.$inferSelect;

// Editor Workload
export const editorWorkload = pgTable("editor_workload", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  editorId: varchar("editor_id").notNull(),
  projectId: varchar("project_id").notNull(),
  deadline: timestamp("deadline"),
  status: text("status").notNull().default("active"), // "active", "completed", "overdue"
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export type EditorWorkload = typeof editorWorkload.$inferSelect;

// Member Stats (Points system)
export const memberStats = pgTable("member_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull().unique(),
  pointsEarned: integer("points_earned").default(0),
  pointsPaid: integer("points_paid").default(0),
  currentBalance: integer("current_balance").default(0),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type MemberStats = typeof memberStats.$inferSelect;

// Transactions (Member point transactions)
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull(),
  type: text("type").notNull(), // "earned", "paid", "bonus", "penalty"
  description: text("description").notNull(),
  points: integer("points").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export type Transaction = typeof transactions.$inferSelect;

// Workspace Currency
export const workspaceCurrency = pgTable("workspace_currency", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  currency: text("currency").notNull().default("USD"),
  pointsToUsdRate: text("points_to_usd_rate").notNull().default("0.05208333"), // 1 point = $0.05208333
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type WorkspaceCurrency = typeof workspaceCurrency.$inferSelect;

// Recurring Subscriptions
export const recurringSubscriptions = pgTable("recurring_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  monthlyAmount: integer("monthly_amount").notNull(), // in cents
  startDate: timestamp("start_date").notNull(),
  nextPaymentDate: timestamp("next_payment_date"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export type RecurringSubscription = typeof recurringSubscriptions.$inferSelect;

// Unified Login Schema
export const unifiedLoginSchema = z.object({
  emailOrUsername: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

export type UnifiedLogin = z.infer<typeof unifiedLoginSchema>;
