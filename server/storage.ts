import { 
  users,
  affiliates,
  referrals,
  bookings,
  availability,
  bookingQuestions,
  appointments,
  founderSettings,
  issueTemplates,
  templateTasks,
  members,
  clients,
  transactions,
  memberStats,
  billingInfo,
  clips,
  issues,
  tasks,
  type User, 
  type InsertUser,
  type Affiliate,
  type InsertAffiliate,
  type Referral,
  type InsertReferral,
  type UpdatePayment,
  type Booking,
  type InsertBooking,
  type Availability,
  type BookingQuestion,
  type Appointment,
  type InsertAppointment,
  type FounderSettings,
  type IssueTemplate,
  type TemplateTask,
  type Member,
  type Transaction,
  type MemberStats,
  type BillingInfo,
  type Clip,
  type Issue,
  type Task,
  type Project
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, isNull } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAffiliate(id: string): Promise<Affiliate | undefined>;
  getAffiliateByUsername(username: string): Promise<Affiliate | undefined>;
  createAffiliate(affiliate: InsertAffiliate): Promise<Affiliate>;
  updateAffiliatePayment(username: string, payment: UpdatePayment): Promise<Affiliate | undefined>;
  getAllAffiliates(): Promise<Affiliate[]>;
  
  createReferral(referral: InsertReferral): Promise<Referral>;
  getReferralsByAffiliate(affiliateId: string): Promise<Referral[]>;
  markReferralConverted(referralId: string): Promise<Referral | undefined>;
  getAffiliateStats(affiliateId: string): Promise<{
    totalClicks: number;
    totalConversions: number;
    totalCommission: number;
  }>;
  
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBookings(status?: string): Promise<Booking[]>;
  confirmBooking(bookingId: string, tier: string): Promise<Booking | undefined>;
  updateBooking(bookingId: string, updates: Partial<Booking>): Promise<Booking | undefined>;
  
  // Scheduling System
  getAvailability(): Promise<Availability[]>;
  updateAvailability(dayOfWeek: number, startTime: string, endTime: string, isEnabled: boolean): Promise<Availability>;
  
  getBookingQuestions(): Promise<BookingQuestion[]>;
  createBookingQuestion(question: Omit<BookingQuestion, 'id' | 'createdAt'>): Promise<BookingQuestion>;
  updateBookingQuestion(id: string, updates: Partial<BookingQuestion>): Promise<BookingQuestion | undefined>;
  deleteBookingQuestion(id: string): Promise<void>;
  
  getAppointments(): Promise<Appointment[]>;
  getAppointmentById(id: string): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | undefined>;
  
  getFounderSettings(): Promise<FounderSettings | undefined>;
  updateFounderSettings(settings: Partial<FounderSettings>): Promise<FounderSettings>;
  
  // Templates
  getAllTemplates(): Promise<IssueTemplate[]>;
  getTemplate(id: string): Promise<IssueTemplate | undefined>;
  createTemplate(data: { name: string; title: string; description?: string | null; videoUrl?: string | null; videoDuration?: string | null }): Promise<IssueTemplate>;
  updateTemplate(id: string, data: Partial<IssueTemplate>): Promise<IssueTemplate | undefined>;
  deleteTemplate(id: string): Promise<void>;
  
  // Template Tasks
  getTemplateTasks(templateId: string): Promise<TemplateTask[]>;
  createTemplateTask(templateId: string, data: { name: string; points: number; priority: string; assignedTo?: string | null; order: number }): Promise<TemplateTask>;
  updateTemplateTask(templateId: string, taskId: string, data: Partial<TemplateTask>): Promise<TemplateTask | undefined>;
  deleteTemplateTask(templateId: string, taskId: string): Promise<void>;
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

  async getAllAffiliates(): Promise<Affiliate[]> {
    return await db.select().from(affiliates).orderBy(desc(affiliates.createdAt));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db
      .insert(bookings)
      .values(insertBooking)
      .returning();
    return booking;
  }

  async getBookingById(bookingId: string): Promise<Booking | undefined> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId));
    return booking || undefined;
  }

  async upsertBooking(bookingData: any): Promise<Booking> {
    // Try to insert, if it conflicts on ID, update it
    const [booking] = await db
      .insert(bookings)
      .values({
        id: bookingData.id,
        attendeeName: bookingData.attendeeName,
        attendeeEmail: bookingData.attendeeEmail,
        eventTime: new Date(bookingData.appointmentTime || bookingData.eventTime),
        status: "pending"
      })
      .onConflictDoUpdate({
        target: bookings.id,
        set: {
          attendeeName: bookingData.attendeeName,
          attendeeEmail: bookingData.attendeeEmail,
          eventTime: new Date(bookingData.appointmentTime || bookingData.eventTime),
        }
      })
      .returning();
    return booking;
  }

  async getBookings(status?: string): Promise<Booking[]> {
    if (status) {
      return await db
        .select()
        .from(bookings)
        .where(eq(bookings.status, status))
        .orderBy(desc(bookings.createdAt));
    }
    return await db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async confirmBooking(bookingId: string, tier: string): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({
        status: "confirmed",
        tier: tier,
        confirmedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId))
      .returning();
    return booking || undefined;
  }

  async updateBooking(bookingId: string, updates: Partial<Booking>): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set(updates)
      .where(eq(bookings.id, bookingId))
      .returning();
    return booking || undefined;
  }

  // Scheduling System Methods
  async getAvailability(): Promise<Availability[]> {
    return await db.select().from(availability).orderBy(availability.dayOfWeek);
  }

  async updateAvailability(dayOfWeek: number, startTime: string, endTime: string, isEnabled: boolean): Promise<Availability> {
    const existing = await db.select().from(availability).where(eq(availability.dayOfWeek, dayOfWeek));
    
    if (existing.length > 0) {
      const [updated] = await db
        .update(availability)
        .set({ startTime, endTime, isEnabled, updatedAt: new Date() })
        .where(eq(availability.dayOfWeek, dayOfWeek))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(availability)
        .values({ dayOfWeek, startTime, endTime, isEnabled })
        .returning();
      return created;
    }
  }

  async getBookingQuestions(): Promise<BookingQuestion[]> {
    return await db.select().from(bookingQuestions).orderBy(bookingQuestions.order);
  }

  async createBookingQuestion(question: Omit<BookingQuestion, 'id' | 'createdAt'>): Promise<BookingQuestion> {
    const [created] = await db
      .insert(bookingQuestions)
      .values(question)
      .returning();
    return created;
  }

  async updateBookingQuestion(id: string, updates: Partial<BookingQuestion>): Promise<BookingQuestion | undefined> {
    const [updated] = await db
      .update(bookingQuestions)
      .set(updates)
      .where(eq(bookingQuestions.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteBookingQuestion(id: string): Promise<void> {
    await db.delete(bookingQuestions).where(eq(bookingQuestions.id, id));
  }

  async getAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments).orderBy(desc(appointments.appointmentTime));
  }

  async getAppointmentById(id: string): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment || undefined;
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [created] = await db
      .insert(appointments)
      .values(appointment)
      .returning();
    return created;
  }

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | undefined> {
    const [updated] = await db
      .update(appointments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return updated || undefined;
  }

  async getFounderSettings(): Promise<FounderSettings | undefined> {
    const [settings] = await db.select().from(founderSettings).limit(1);
    return settings || undefined;
  }

  async updateFounderSettings(updates: Partial<FounderSettings>): Promise<FounderSettings> {
    const existing = await this.getFounderSettings();
    
    if (existing) {
      const [updated] = await db
        .update(founderSettings)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(founderSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(founderSettings)
        .values(updates as any)
        .returning();
      return created;
    }
  }

  // Templates
  async getAllTemplates(): Promise<IssueTemplate[]> {
    return await db.select().from(issueTemplates).orderBy(issueTemplates.createdAt);
  }

  async getTemplate(id: string): Promise<IssueTemplate | undefined> {
    const [template] = await db.select().from(issueTemplates).where(eq(issueTemplates.id, id));
    return template || undefined;
  }

  async createTemplate(data: { name: string; title: string; description?: string | null; videoUrl?: string | null; videoDuration?: string | null }): Promise<IssueTemplate> {
    const [template] = await db.insert(issueTemplates).values(data).returning();
    return template;
  }

  async updateTemplate(id: string, data: Partial<IssueTemplate>): Promise<IssueTemplate | undefined> {
    const [updated] = await db
      .update(issueTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(issueTemplates.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTemplate(id: string): Promise<void> {
    // Delete template tasks first
    await db.delete(templateTasks).where(eq(templateTasks.templateId, id));
    // Then delete template
    await db.delete(issueTemplates).where(eq(issueTemplates.id, id));
  }

  // Template Tasks
  async getTemplateTasks(templateId: string): Promise<TemplateTask[]> {
    return await db
      .select()
      .from(templateTasks)
      .where(eq(templateTasks.templateId, templateId))
      .orderBy(templateTasks.order);
  }

  async createTemplateTask(templateId: string, data: { name: string; points: number; priority: string; assignedTo?: string | null; order: number }): Promise<TemplateTask> {
    const [task] = await db
      .insert(templateTasks)
      .values({ ...data, templateId })
      .returning();
    return task;
  }

  async updateTemplateTask(templateId: string, taskId: string, data: Partial<TemplateTask>): Promise<TemplateTask | undefined> {
    const [updated] = await db
      .update(templateTasks)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(templateTasks.id, taskId), eq(templateTasks.templateId, templateId)))
      .returning();
    return updated || undefined;
  }

  async deleteTemplateTask(templateId: string, taskId: string): Promise<void> {
    await db
      .delete(templateTasks)
      .where(and(eq(templateTasks.id, taskId), eq(templateTasks.templateId, templateId)));
  }

  // Members
  async getMember(id: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member || undefined;
  }

  async getMemberByUsername(username: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.username, username));
    return member || undefined;
  }

  async getMemberByEmail(email: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.email, email));
    return member || undefined;
  }

  async getAllMembers(): Promise<Member[]> {
    return await db.select().from(members).orderBy(members.createdAt);
  }

  async updateMember(id: string, data: Partial<Member>): Promise<Member | undefined> {
    const [updated] = await db
      .update(members)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(members.id, id))
      .returning();
    return updated || undefined;
  }

  // Member Stats
  async getMemberStats(memberId: string): Promise<MemberStats | undefined> {
    const [stats] = await db.select().from(memberStats).where(eq(memberStats.memberId, memberId));
    return stats || undefined;
  }

  async createOrUpdateMemberStats(memberId: string, data: Partial<MemberStats>): Promise<MemberStats> {
    const existing = await this.getMemberStats(memberId);
    if (existing) {
      const [updated] = await db
        .update(memberStats)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(memberStats.memberId, memberId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(memberStats)
        .values({ memberId, ...data })
        .returning();
      return created;
    }
  }

  // Transactions
  async getMemberTransactions(memberId: string, limit?: number, offset?: number): Promise<Transaction[]> {
    let query = db
      .select()
      .from(transactions)
      .where(eq(transactions.memberId, memberId))
      .orderBy(desc(transactions.createdAt));
    
    if (limit) {
      query = query.limit(limit) as any;
    }
    if (offset) {
      query = query.offset(offset) as any;
    }
    
    return await query;
  }

  async createTransaction(data: { memberId: string; type: string; description: string; points: number }): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(data).returning();
    return transaction;
  }

  // Billing Info
  async getMemberBillingInfo(memberId: string): Promise<BillingInfo | undefined> {
    const [billing] = await db.select().from(billingInfo).where(eq(billingInfo.memberId, memberId));
    return billing || undefined;
  }

  async createOrUpdateBillingInfo(memberId: string, data: { cardNumber?: string; shebah?: string; fullNameOnCard?: string }): Promise<BillingInfo> {
    const existing = await this.getMemberBillingInfo(memberId);
    if (existing) {
      const [updated] = await db
        .update(billingInfo)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(billingInfo.memberId, memberId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(billingInfo)
        .values({ memberId, ...data })
        .returning();
      return created;
    }
  }

  // Projects
  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(projects.createdAt);
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(data: { name: string; description?: string; fileLocation?: string }): Promise<Project> {
    const [project] = await db.insert(projects).values(data).returning();
    return project;
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project | undefined> {
    const [updated] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updated || undefined;
  }

  // Clips
  async getPendingClips(projectId?: string): Promise<Clip[]> {
    if (projectId) {
      return await db
        .select()
        .from(clips)
        .where(and(isNull(clips.isValid), eq(clips.projectId, projectId)))
        .orderBy(clips.clipNumber);
    }
    return await db
      .select()
      .from(clips)
      .where(isNull(clips.isValid))
      .orderBy(clips.clipNumber);
  }

  async getClip(id: string): Promise<Clip | undefined> {
    const [clip] = await db.select().from(clips).where(eq(clips.id, id));
    return clip || undefined;
  }

  async createClip(data: { projectId: string; clipNumber: number; filePath: string }): Promise<Clip> {
    const [clip] = await db.insert(clips).values({ ...data, isValid: null }).returning();
    return clip;
  }

  async updateClip(id: string, data: { clipNumber?: number; filePath?: string; isValid?: boolean; rejectionNote?: string; reviewedBy?: string }): Promise<Clip | undefined> {
    const updateData: any = { ...data };
    if (data.isValid !== undefined) {
      updateData.reviewedAt = new Date();
    }
    const [updated] = await db
      .update(clips)
      .set(updateData)
      .where(eq(clips.id, id))
      .returning();
    return updated || undefined;
  }

  // Issues
  async createIssue(data: { projectId?: string; templateId?: string; title: string; description?: string; videoUrl?: string; videoDuration?: string; status?: string; order?: number }): Promise<Issue> {
    const [issue] = await db.insert(issues).values({
      ...data,
      status: data.status || "backlog",
      order: data.order || 0,
    }).returning();
    return issue;
  }

  // Issues/Projects
  async getIssues(projectId?: string): Promise<Issue[]> {
    if (projectId) {
      return await db.select().from(issues).where(eq(issues.projectId, projectId)).orderBy(issues.order);
    }
    return await db.select().from(issues).orderBy(issues.order);
  }

  async getIssue(id: string): Promise<Issue | undefined> {
    const [issue] = await db.select().from(issues).where(eq(issues.id, id));
    return issue || undefined;
  }

  async updateIssue(id: string, data: Partial<Issue>): Promise<Issue | undefined> {
    const [updated] = await db
      .update(issues)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(issues.id, id))
      .returning();
    return updated || undefined;
  }

  // Tasks
  async getIssueTasks(issueId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.issueId, issueId))
      .orderBy(tasks.order);
  }
}

export const storage = new DatabaseStorage();
