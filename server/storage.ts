import { 
  users,
  affiliates,
  members,
  clients,
  referrals,
  bookings,
  availability,
  bookingQuestions,
  appointments,
  founderSettings,
  affiliateTransactions,
  projects,
  issues,
  clips,
  issueTemplates,
  templateTasks,
  teams,
  tasks,
  income,
  expenses,
  invoices,
  notes,
  socialMediaAccounts,
  memberStats,
  transactions,
  recurringSubscriptions,
  type User, 
  type InsertUser,
  type Affiliate,
  type InsertAffiliate,
  type Member,
  type InsertMember,
  type Client,
  type InsertClient,
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
  type AffiliateTransaction,
  type InsertAffiliateTransaction
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or, gte, lte, like, sql, inArray } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getMember(id: string): Promise<Member | undefined>;
  getMemberByUsername(username: string): Promise<Member | undefined>;
  getMemberByEmail(email: string): Promise<Member | undefined>;
  createMember(member: InsertMember & { passwordHash: string }): Promise<Member>;
  getAllMembers(): Promise<Member[]>;
  
  getClient(id: string): Promise<Client | undefined>;
  getClientByUsername(username: string): Promise<Client | undefined>;
  getClientByEmail(email: string): Promise<Client | undefined>;
  createClient(client: InsertClient & { passwordHash: string }): Promise<Client>;
  getAllClients(): Promise<Client[]>;
  
  getAffiliate(id: string): Promise<Affiliate | undefined>;
  getAffiliateByUsername(username: string): Promise<Affiliate | undefined>;
  getAffiliateByEmail(email: string): Promise<Affiliate | undefined>;
  createAffiliate(affiliate: InsertAffiliate & { passwordHash?: string }): Promise<Affiliate>;
  updateAffiliatePayment(username: string, payment: UpdatePayment): Promise<Affiliate | undefined>;
  updateAffiliatePassword(username: string, passwordHash: string): Promise<Affiliate | undefined>;
  updateAffiliateProfile(username: string, profile: { email?: string; fullName?: string | null; country?: string | null; telegramAccount?: string | null; instagramUsername?: string | null; phoneNumber?: string | null }): Promise<Affiliate | undefined>;
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
  
  // Affiliate Transactions
  createAffiliateTransaction(transaction: InsertAffiliateTransaction): Promise<AffiliateTransaction>;
  getAffiliateTransactions(affiliateId: string): Promise<AffiliateTransaction[]>;
  getAffiliateCommissionStats(affiliateId: string): Promise<{ currentBalance: number; totalEarned: number; totalPaid: number }>;
  markBookingsAsPaid(affiliateId: string, amount: number): Promise<void>;
  
  // Projects
  getAllProjects(): Promise<any[]>;
  createProject(project: any): Promise<any>;
  updateProject(projectId: string, updates: any): Promise<any | undefined>;
  deleteProject(projectId: string): Promise<void>;
  getProjectById(projectId: string): Promise<any | undefined>;
  
  // Issues
  getIssuesByProject(projectId: string): Promise<any[]>;
  createIssue(issue: any): Promise<any>;
  updateIssue(issueId: string, updates: any): Promise<any | undefined>;
  deleteIssue(issueId: string): Promise<void>;
  
  // Issue Tasks
  getIssueTasks(issueId: string): Promise<any[]>;
  createIssueTask(issueId: string, taskData: any): Promise<any>;
  
  // Clips
  getClipsByProject(projectId: string): Promise<any[]>;
  getPendingClips(projectId?: string): Promise<any[]>;
  getValidClips(projectId?: string): Promise<any[]>;
  getInvalidClips(projectId?: string): Promise<any[]>;
  createClip(clip: any): Promise<any>;
  updateClip(clipId: string, updates: any): Promise<any | undefined>;
  deleteClip(clipId: string): Promise<void>;
  
  // Issue Templates
  getAllTemplates(): Promise<any[]>;
  createTemplate(template: any): Promise<any>;
  updateTemplate(templateId: string, updates: any): Promise<any | undefined>;
  deleteTemplate(templateId: string): Promise<void>;
  
  // Income & Expenses
  getAllIncome(filters?: any): Promise<any[]>;
  createIncome(income: any): Promise<any>;
  getAllExpenses(filters?: any): Promise<any[]>;
  createExpense(expense: any): Promise<any>;
  
  // Member Stats & Transactions
  getMemberStats(memberId: string): Promise<any | undefined>;
  updateMemberStats(memberId: string, updates: any): Promise<any>;
  getMemberTransactions(memberId: string, filters?: any): Promise<any[]>;
  createTransaction(transaction: any): Promise<any>;
  
  // Social Media Accounts
  getSocialMediaAccountsByClient(clientId: string): Promise<any[]>;
  createSocialMediaAccount(account: any): Promise<any>;
  updateSocialMediaAccount(accountId: string, updates: any): Promise<any | undefined>;
  deleteSocialMediaAccount(accountId: string): Promise<void>;
  
  // Invoices
  getAllInvoices(filters?: any): Promise<any[]>;
  createInvoice(invoice: any): Promise<any>;
  updateInvoice(invoiceId: string, updates: any): Promise<any | undefined>;
  
  // Notes
  getNotes(filters?: any): Promise<any[]>;
  createNote(note: any): Promise<any>;
  deleteNote(noteId: string): Promise<void>;
  
  // Recurring Subscriptions
  getAllSubscriptions(): Promise<any[]>;
  createSubscription(subscription: any): Promise<any>;
  updateSubscription(subscriptionId: string, updates: any): Promise<any | undefined>;
  deleteSubscription(subscriptionId: string): Promise<void>;
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

  // Member methods
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

  async createMember(memberData: InsertMember & { passwordHash: string; plainPassword?: string }): Promise<Member> {
    const { password, ...rest } = memberData;
    const [member] = await db
      .insert(members)
      .values({
        ...rest,
        passwordHash: memberData.passwordHash,
        plainPassword: memberData.plainPassword || undefined,
      })
      .returning();
    return member;
  }

  async getAllMembers(): Promise<Member[]> {
    return await db.select().from(members).orderBy(members.createdAt);
  }

  // Client methods
  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async getClientByUsername(username: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.username, username));
    return client || undefined;
  }

  async getClientByEmail(email: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.email, email));
    return client || undefined;
  }

  async createClient(clientData: InsertClient & { passwordHash: string; plainPassword?: string }): Promise<Client> {
    const { password, ...rest } = clientData;
    const [client] = await db
      .insert(clients)
      .values({
        ...rest,
        passwordHash: clientData.passwordHash,
        plainPassword: clientData.plainPassword || undefined,
      })
      .returning();
    return client;
  }

  async getAllClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(clients.createdAt);
  }

  async updateClient(clientId: string, updates: any): Promise<Client | undefined> {
    const [updated] = await db.update(clients).set(updates).where(eq(clients.id, clientId)).returning();
    return updated || undefined;
  }

  async getAffiliate(id: string): Promise<Affiliate | undefined> {
    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.id, id));
    return affiliate || undefined;
  }

  async getAffiliateByUsername(username: string): Promise<Affiliate | undefined> {
    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.username, username));
    return affiliate || undefined;
  }

  async getAffiliateByEmail(email: string): Promise<Affiliate | undefined> {
    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.email, email));
    return affiliate || undefined;
  }

  async createAffiliate(insertAffiliate: InsertAffiliate & { passwordHash?: string; plainPassword?: string }): Promise<Affiliate> {
    const [affiliate] = await db
      .insert(affiliates)
      .values({
        ...insertAffiliate,
        plainPassword: (insertAffiliate as any).plainPassword || undefined,
      })
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

  async updateAffiliatePassword(username: string, passwordHash: string): Promise<Affiliate | undefined> {
    const [affiliate] = await db
      .update(affiliates)
      .set({ passwordHash })
      .where(eq(affiliates.username, username))
      .returning();
    return affiliate || undefined;
  }

  async updateAffiliateProfile(username: string, profile: { email?: string; fullName?: string | null; country?: string | null; telegramAccount?: string | null; instagramUsername?: string | null; phoneNumber?: string | null }): Promise<Affiliate | undefined> {
    const updateData: any = {};
    if (profile.email !== undefined) updateData.email = profile.email;
    if (profile.fullName !== undefined) updateData.fullName = profile.fullName;
    if (profile.country !== undefined) updateData.country = profile.country;
    if (profile.telegramAccount !== undefined) updateData.telegramAccount = profile.telegramAccount;
    if (profile.phoneNumber !== undefined) updateData.phoneNumber = profile.phoneNumber;
    // Only include instagramUsername if it's provided (column may not exist yet)
    if (profile.instagramUsername !== undefined) {
      updateData.instagramUsername = profile.instagramUsername;
    }
    
    try {
      const [affiliate] = await db
        .update(affiliates)
        .set(updateData)
        .where(eq(affiliates.username, username))
        .returning();
      return affiliate || undefined;
    } catch (error: any) {
      // If instagramUsername column doesn't exist, try without it
      if (error?.code === '42703' && updateData.instagramUsername !== undefined) {
        console.warn("instagramUsername column doesn't exist yet, updating without it");
        delete updateData.instagramUsername;
        const [affiliate] = await db
          .update(affiliates)
          .set(updateData)
          .where(eq(affiliates.username, username))
          .returning();
        return affiliate || undefined;
      }
      throw error;
    }
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
    
    // Get affiliate username to find bookings
    const affiliate = await this.getAffiliate(affiliateId);
    if (!affiliate) {
      return {
        totalClicks,
        totalConversions,
        totalCommission: 0,
      };
    }
    
    // Calculate commission ONLY from bookings marked as "sold"
    // Commission is not automatically added when booking is created
    const allBookings = await this.getBookings();
    const soldBookings = allBookings.filter(
      (booking) => 
        booking.affiliateUsername && 
        booking.affiliateUsername.toLowerCase() === affiliate.username.toLowerCase() &&
        booking.saleStatus === "sold"
    );
    
    // Calculate total commission from sold bookings
    const tierCommissions: Record<string, number> = {
      "Growth": 100000, // $1,000 in cents
      "Domination": 175000, // $1,750 in cents
      "Empire": 336875, // $3,368.75 in cents
    };
    
    let totalCommission = 0;
    soldBookings.forEach((booking) => {
      const commissionAmount = booking.commissionAmount || 
        (booking.tier ? (tierCommissions[booking.tier] || 0) : 0);
      totalCommission += commissionAmount;
    });

    return {
      totalClicks,
      totalConversions,
      totalCommission,
    };
  }

  async getAllAffiliates(): Promise<Affiliate[]> {
    try {
      return await db.select().from(affiliates).orderBy(desc(affiliates.createdAt));
    } catch (error: any) {
      // If column doesn't exist, try selecting only known columns
      if (error?.code === '42703' || error?.message?.includes('does not exist')) {
        console.warn("Some columns may not exist yet. Attempting fallback query...");
        // Try selecting without the problematic column
        try {
          // Select all columns except potentially missing ones
          const result = await db.select({
            id: affiliates.id,
            username: affiliates.username,
            email: affiliates.email,
            passwordHash: affiliates.passwordHash,
            fullName: affiliates.fullName,
            country: affiliates.country,
            telegramAccount: affiliates.telegramAccount,
            phoneNumber: affiliates.phoneNumber,
            paymentMethod: affiliates.paymentMethod,
            paymentDetails: affiliates.paymentDetails,
            createdAt: affiliates.createdAt,
          }).from(affiliates).orderBy(desc(affiliates.createdAt));
          
          // Add missing fields as null
          return result.map(aff => ({
            ...aff,
            instagramUsername: null as string | null,
          })) as Affiliate[];
        } catch (fallbackError) {
          console.error("Fallback query also failed:", fallbackError);
          // Return empty array if everything fails
          return [];
        }
      }
      throw error;
    }
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
    // Check if booking already exists
    const existingBooking = await this.getBookingById(bookingData.id);
    
    // Try to find affiliate from utmSource if provided
    let affiliateUsername: string | undefined = undefined;
    let referralId: string | undefined = undefined;
    
    // Only auto-assign affiliate if:
    // 1. Booking doesn't exist yet, OR
    // 2. Booking exists but doesn't have an affiliate assigned yet
    const shouldAutoAssignAffiliate = !existingBooking || !existingBooking.affiliateUsername;
    
    if (shouldAutoAssignAffiliate) {
      // Method 1: Try to find affiliate from utmSource
      if (bookingData.utmSource) {
        console.log(`[upsertBooking] Attempting to auto-assign affiliate from utmSource: ${bookingData.utmSource}`);
        const affiliate = await this.getAffiliateByUsername(bookingData.utmSource);
        if (affiliate) {
          console.log(`[upsertBooking] ✅ Found affiliate via utmSource: ${affiliate.username} (ID: ${affiliate.id})`);
          affiliateUsername = affiliate.username;
          
          // Find the most recent unconverted referral for this affiliate
          const allReferrals = await db
            .select()
            .from(referrals)
            .where(eq(referrals.affiliateId, affiliate.id))
            .orderBy(desc(referrals.timestamp));
          
          // Find unconverted referral (prefer most recent)
          const unconvertedReferral = allReferrals.find(r => !r.converted);
          if (unconvertedReferral) {
            referralId = unconvertedReferral.id;
            console.log(`[upsertBooking] Linking booking to referral ${referralId} and marking as converted`);
            // Mark referral as converted
            await this.markReferralConverted(unconvertedReferral.id);
          } else {
            console.log(`[upsertBooking] No unconverted referral found for affiliate ${affiliate.username}`);
          }
        } else {
          console.log(`[upsertBooking] ⚠️ No affiliate found with username: ${bookingData.utmSource}`);
        }
      }
      
      // Method 2: If no utmSource or affiliate not found, try to match by email
      // Find recent referrals and check if booking email matches any recent referral's context
      // This is a fallback for cases where UTM tracking didn't work
      if (!affiliateUsername && bookingData.attendeeEmail) {
        console.log(`[upsertBooking] Attempting fallback: matching by email ${bookingData.attendeeEmail}`);
        // Get all recent unconverted referrals (within last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentReferrals = await db
          .select()
          .from(referrals)
          .where(eq(referrals.converted, false))
          .orderBy(desc(referrals.timestamp));
        
        // If there's only one recent unconverted referral, it's likely the one
        // This is a heuristic - ideally UTM tracking should work
        if (recentReferrals.length === 1) {
          const referral = recentReferrals[0];
          const affiliate = await this.getAffiliate(referral.affiliateId);
          if (affiliate) {
            console.log(`[upsertBooking] ✅ Fallback match: Found affiliate ${affiliate.username} via single recent referral`);
            affiliateUsername = affiliate.username;
            referralId = referral.id;
            await this.markReferralConverted(referral.id);
          }
        } else if (recentReferrals.length > 1) {
          console.log(`[upsertBooking] ⚠️ Multiple recent referrals found (${recentReferrals.length}), cannot auto-assign via email fallback`);
        }
      }
    }
    
    // Prepare booking data
    const eventTime = bookingData.appointmentTime || bookingData.eventTime;
    if (!eventTime) {
      throw new Error(`Missing eventTime/appointmentTime for booking ${bookingData.id}`);
    }
    
    const bookingValues: any = {
      id: bookingData.id,
      attendeeName: bookingData.attendeeName,
      attendeeEmail: bookingData.attendeeEmail,
      eventTime: new Date(eventTime),
      status: existingBooking?.status || bookingData.status || "pending"
    };
    
    // Set affiliateUsername and referralId if found
    if (affiliateUsername) {
      bookingValues.affiliateUsername = affiliateUsername;
    }
    if (referralId) {
      bookingValues.referralId = referralId;
    }
    
    // Try to insert, if it conflicts on ID, update it
    const [booking] = await db
      .insert(bookings)
      .values(bookingValues)
      .onConflictDoUpdate({
        target: bookings.id,
        set: {
          attendeeName: bookingData.attendeeName,
          attendeeEmail: bookingData.attendeeEmail,
          eventTime: new Date(bookingData.appointmentTime || bookingData.eventTime),
          // Only update affiliateUsername/referralId if they should be auto-assigned
          // This preserves manual assignments
          ...(shouldAutoAssignAffiliate && affiliateUsername ? { affiliateUsername } : {}),
          ...(shouldAutoAssignAffiliate && referralId ? { referralId } : {}),
          // Preserve existing tier and saleStatus if booking already exists
          ...(existingBooking?.tier ? { tier: existingBooking.tier } : {}),
          ...(existingBooking?.saleStatus ? { saleStatus: existingBooking.saleStatus } : {}),
          ...(existingBooking?.commissionAmount ? { commissionAmount: existingBooking.commissionAmount } : {}),
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

  // Affiliate Transactions Methods
  async createAffiliateTransaction(transaction: InsertAffiliateTransaction): Promise<AffiliateTransaction> {
    const [created] = await db
      .insert(affiliateTransactions)
      .values(transaction)
      .returning();
    return created;
  }

  async getAffiliateTransactions(affiliateId: string): Promise<AffiliateTransaction[]> {
    try {
      return await db
        .select()
        .from(affiliateTransactions)
        .where(eq(affiliateTransactions.affiliateId, affiliateId))
        .orderBy(desc(affiliateTransactions.createdAt));
    } catch (error) {
      console.error(`Error fetching transactions for affiliate ${affiliateId}:`, error);
      // Return empty array if table doesn't exist or query fails
      return [];
    }
  }

  async getAffiliateCommissionStats(affiliateId: string): Promise<{ currentBalance: number; totalEarned: number; totalPaid: number }> {
    try {
      // Get affiliate first
      const affiliate = await this.getAffiliate(affiliateId);
      if (!affiliate) {
        return { currentBalance: 0, totalEarned: 0, totalPaid: 0 };
      }

      // Get all bookings for this affiliate that are sold
      const allBookings = await this.getBookings();
      const affiliateBookings = allBookings.filter(
        (booking) => booking.affiliateUsername && 
        booking.affiliateUsername.toLowerCase() === affiliate.username.toLowerCase() &&
        booking.saleStatus === "sold"
      );

      // Calculate commission amounts based on tier
      const tierCommissions: Record<string, number> = {
        "Growth": 100000, // $1,000 in cents
        "Domination": 175000, // $1,750 in cents
        "Empire": 336875, // $3,368.75 in cents
      };

      let totalEarned = 0; // Total commission earned (in cents)
      affiliateBookings.forEach((booking) => {
        // Prefer commissionAmount if it exists and is not null, otherwise calculate from tier
        const commissionAmount = (booking.commissionAmount !== null && booking.commissionAmount !== undefined) 
          ? booking.commissionAmount 
          : (booking.tier ? (tierCommissions[booking.tier] || 0) : 0);
        totalEarned += commissionAmount;
      });

      // Get all paid transactions for this affiliate
      const transactions = await this.getAffiliateTransactions(affiliateId);
      // Filter for paid transactions (case-insensitive to handle any status variations)
      const paidTransactions = transactions.filter(t => t.status && t.status.toLowerCase() === "paid");
      const totalPaid = paidTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      
      // Debug logging for transaction filtering
      if (affiliate.username.toLowerCase() === 'mojgan') {
        console.log(`[getAffiliateCommissionStats] Transaction details:`);
        console.log(`  Total transactions retrieved: ${transactions.length}`);
        transactions.forEach((tx, idx) => {
          console.log(`    ${idx + 1}. Amount: ${tx.amount}, Status: "${tx.status}" (type: ${typeof tx.status})`);
        });
        console.log(`  Paid transactions after filter: ${paidTransactions.length}`);
        console.log(`  Total paid calculated: ${totalPaid} cents ($${(totalPaid / 100).toFixed(2)})`);
      }

      const currentBalance = totalEarned - totalPaid;

      // Debug logging for Mojgan specifically
      if (affiliate.username.toLowerCase() === 'mojgan') {
        console.log(`[Commission Stats] Affiliate: ${affiliate.username}`);
        console.log(`[Commission Stats] Bookings count: ${affiliateBookings.length}`);
        console.log(`[Commission Stats] Total Earned (cents): ${totalEarned} ($${(totalEarned / 100).toFixed(2)})`);
        console.log(`[Commission Stats] Transactions count: ${paidTransactions.length}`);
        console.log(`[Commission Stats] Total Paid (cents): ${totalPaid} ($${(totalPaid / 100).toFixed(2)})`);
        console.log(`[Commission Stats] Current Balance (cents): ${currentBalance} ($${(currentBalance / 100).toFixed(2)})`);
      }

      return {
        currentBalance,
        totalEarned,
        totalPaid,
      };
    } catch (error) {
      console.error(`Error getting commission stats for affiliate ${affiliateId}:`, error);
      // Return zeros if there's an error
      return { currentBalance: 0, totalEarned: 0, totalPaid: 0 };
    }
  }

  async markBookingsAsPaid(affiliateId: string, amount: number): Promise<void> {
    // Get affiliate to find username
    const affiliate = await this.getAffiliate(affiliateId);
    if (!affiliate) return;

    // Get all unpaid bookings for this affiliate
    const allBookings = await this.getBookings();
    const unpaidBookings = allBookings.filter(
      (booking) => booking.affiliateUsername && 
      booking.affiliateUsername.toLowerCase() === affiliate.username.toLowerCase() &&
      booking.saleStatus === "sold" &&
      !booking.commissionPaid
    ).sort((a, b) => new Date(a.soldAt || a.createdAt).getTime() - new Date(b.soldAt || b.createdAt).getTime());

    // Mark bookings as paid until we've covered the amount
    let remainingAmount = amount;
    for (const booking of unpaidBookings) {
      if (remainingAmount <= 0) break;
      
      const commissionAmount = booking.commissionAmount || 0;
      if (commissionAmount > 0) {
        // Mark this booking as paid
        await db
          .update(bookings)
          .set({ commissionPaid: true })
          .where(eq(bookings.id, booking.id));
        
        remainingAmount -= commissionAmount;
      }
    }
  }

  // Projects
  async getAllProjects(): Promise<any[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async createProject(projectData: any): Promise<any> {
    const [project] = await db.insert(projects).values(projectData).returning();
    return project;
  }

  async updateProject(projectId: string, updates: any): Promise<any | undefined> {
    const [updated] = await db.update(projects).set(updates).where(eq(projects.id, projectId)).returning();
    return updated || undefined;
  }

  async deleteProject(projectId: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, projectId));
  }

  async getProjectById(projectId: string): Promise<any | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    return project || undefined;
  }

  // Issues
  async getIssuesByProject(projectId: string): Promise<any[]> {
    try {
      console.log(`[Storage] getIssuesByProject called for projectId: ${projectId}`);
      
      // Fetch issues - sort manually to avoid orderBy issues with null values
      const issuesList = await db.select().from(issues).where(eq(issues.projectId, projectId));
      // Sort manually
      issuesList.sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        return orderA - orderB;
      });
      console.log(`[Storage] Found ${issuesList.length} issues`);
      
      // If no issues, return early
      if (issuesList.length === 0) {
        return [];
      }
      
      // Fetch tasks for all issues - but don't fail if this fails
      const issueIds = issuesList.map(issue => issue.id).filter(id => id);
      let allTasks: any[] = [];
      
      if (issueIds.length > 0) {
        try {
          // Use Drizzle's inArray for proper parameterized queries
          allTasks = await db.select().from(tasks).where(inArray(tasks.issueId, issueIds));
          // Sort tasks manually
          allTasks.sort((a, b) => {
            const orderA = a.order ?? 0;
            const orderB = b.order ?? 0;
            return orderA - orderB;
          });
          console.log(`[Storage] Found ${allTasks.length} total tasks for ${issueIds.length} issues`);
        } catch (taskError: any) {
          // Log but don't fail - return issues without tasks
          console.warn(`[Storage] Could not fetch tasks (non-critical):`, taskError?.message);
          console.warn(`[Storage] Task error details:`, taskError?.code, taskError?.detail);
          allTasks = [];
        }
      }
      
      // Group tasks by issueId (handle both camelCase and snake_case)
      const tasksByIssueId = new Map<string, any[]>();
      for (const task of allTasks) {
        const taskIssueId = task.issueId || task.issue_id;
        if (taskIssueId) {
          if (!tasksByIssueId.has(taskIssueId)) {
            tasksByIssueId.set(taskIssueId, []);
          }
          tasksByIssueId.get(taskIssueId)!.push(task);
        }
      }
      
      // Attach tasks to their issues and transform task field names
      const result = issuesList.map(issue => {
        const issueTasks = tasksByIssueId.get(issue.id) || [];
        const transformedTasks = issueTasks.map((task: any) => ({
          id: task.id,
          name: task.name || task.title || "Untitled Task",
          title: task.name || task.title || "Untitled Task",
          points: task.points || 0,
          assignedTo: task.assigned_to || task.assignedTo || null,
          memberId: task.assigned_to || task.assignedTo || null,
          priority: task.priority || "no_priority",
          order: task.order || 0,
          isCompleted: task.is_completed || task.isCompleted || false,
          status: task.status || "pending",
          issueId: task.issue_id || task.issueId,
        }));
        
        console.log(`[Storage] Issue ${issue.id} "${issue.title}" has ${transformedTasks.length} tasks`);
        if (transformedTasks.length > 0) {
          console.log(`[Storage] Task names:`, transformedTasks.map((t: any) => t.name));
        }
        
        return {
          ...issue,
          tasks: transformedTasks
        };
      });
      
      console.log(`[Storage] Successfully returning ${result.length} issues`);
      // Log total tasks across all issues
      const totalTasks = result.reduce((sum, issue) => sum + (issue.tasks?.length || 0), 0);
      console.log(`[Storage] Total tasks across all issues: ${totalTasks}`);
      return result;
    } catch (error: any) {
      console.error(`[Storage] CRITICAL Error in getIssuesByProject:`, error);
      console.error(`[Storage] Error message:`, error?.message);
      console.error(`[Storage] Error code:`, error?.code);
      console.error(`[Storage] Error detail:`, error?.detail);
      throw error;
    }
  }

  async getIssueById(issueId: string): Promise<any | undefined> {
    try {
      const [issue] = await db.select().from(issues).where(eq(issues.id, issueId));
      if (!issue) return undefined;
      
      // Fetch tasks for this issue
      let issueTasks: any[] = [];
      try {
        // Use raw SQL to ensure we query by issue_id column (Drizzle might not map issueId correctly)
        console.log(`[Storage] Fetching tasks for issue ${issueId}`);
        const taskResult = await db.execute(sql`
          SELECT * FROM tasks 
          WHERE issue_id = ${issueId}
          ORDER BY COALESCE("order", 0) ASC, created_at ASC
        `);
        issueTasks = taskResult.rows || [];
        console.log(`[Storage] Fetched ${issueTasks.length} tasks for issue ${issueId}`);
        if (issueTasks.length > 0) {
          console.log(`[Storage] Task names:`, issueTasks.map((t: any) => t.name || t.title));
        }
      } catch (taskError: any) {
        console.error(`[Storage] Error fetching tasks for issue ${issueId}:`, taskError);
        console.error(`[Storage] Error details:`, taskError?.message, taskError?.code, taskError?.detail);
        // Continue without tasks if there's an error
        issueTasks = [];
      }
      
      // Transform tasks to ensure consistent field names
      const transformedTasks = issueTasks.map((task: any) => ({
        id: task.id,
        name: task.name || task.title || "Untitled Task",
        title: task.name || task.title || "Untitled Task",
        points: task.points || 0,
        assignedTo: task.assigned_to || task.assignedTo || null,
        memberId: task.assigned_to || task.assignedTo || null,
        priority: task.priority || "no_priority",
        order: task.order || 0,
        isCompleted: task.is_completed || task.isCompleted || false,
        status: task.status || "pending",
        issueId: task.issue_id || task.issueId,
      }));

      return {
        ...issue,
        tasks: transformedTasks
      };
    } catch (error: any) {
      console.error(`[Storage] Error in getIssueById:`, error);
      throw error;
    }
  }

  async createIssue(issueData: any): Promise<any> {
    try {
      const { tasks: tasksData, assigneeId, assignedTo, ...issueFields } = issueData;
      console.log(`[Storage] createIssue called with fields:`, Object.keys(issueFields));
      console.log(`[Storage] Tasks to create: ${tasksData?.length || 0}`);
      
      // Map assigneeId/assignedTo to assignee_id for database
      const insertData: any = { ...issueFields };
      if (assigneeId || assignedTo) {
        insertData.assigneeId = assigneeId || assignedTo;
      }
      
      const [issue] = await db.insert(issues).values(insertData).returning();
      console.log(`[Storage] Created issue: ${issue.id}`);
      
      // Create tasks if provided
      if (tasksData && Array.isArray(tasksData) && tasksData.length > 0) {
        console.log(`[Storage] Processing ${tasksData.length} tasks for issue ${issue.id}`);
        const tasksToCreate = tasksData
          .filter((task: any) => task.name && task.name.trim())
          .map((task: any, index: number) => ({
            issueId: issue.id,
            // Don't set memberId - it's optional and might cause issues
            name: task.name.trim(),
            title: task.name.trim(), // Also set title for compatibility
            points: task.points || 0,
            priority: task.priority || "no_priority",
            assignedTo: task.assignedTo || null,
            order: task.order !== undefined ? task.order : index,
            isCompleted: false,
            status: "pending",
          }));
        
        console.log(`[Storage] Filtered to ${tasksToCreate.length} valid tasks:`, tasksToCreate.map(t => ({ name: t.name, points: t.points, assignedTo: t.assignedTo })));
        
        if (tasksToCreate.length > 0) {
          try {
            console.log(`[Storage] Creating ${tasksToCreate.length} tasks for issue ${issue.id}`);
            console.log(`[Storage] Task data sample:`, tasksToCreate[0]);
            console.log(`[Storage] Issue ID being used: ${issue.id}`);
            
            // Insert tasks using raw SQL to ensure correct column mapping
            // This guarantees issue_id is set correctly in the database
            const insertedTaskIds: string[] = [];
            
            for (const task of tasksToCreate) {
              try {
                const insertResult = await db.execute(sql`
                  INSERT INTO tasks (
                    issue_id, 
                    name, 
                    title, 
                    points, 
                    priority, 
                    assigned_to, 
                    "order", 
                    is_completed, 
                    status, 
                    created_at
                  )
                  VALUES (
                    ${issue.id},
                    ${task.name},
                    ${task.name},
                    ${task.points},
                    ${task.priority},
                    ${task.assignedTo || null},
                    ${task.order},
                    false,
                    'pending',
                    NOW()
                  )
                  RETURNING id, name, issue_id
                `);
                
                if (insertResult.rows && insertResult.rows.length > 0) {
                  const insertedTask = insertResult.rows[0] as any;
                  const taskId = String(insertedTask.id);
                  insertedTaskIds.push(taskId);
                  console.log(`[Storage] ✓ Created task "${task.name}" (ID: ${taskId}, issue_id: ${insertedTask.issue_id})`);
                }
              } catch (singleTaskError: any) {
                const errorMessage = singleTaskError?.message || String(singleTaskError) || "Unknown error";
                console.error(`[Storage] ✗ ERROR creating task "${task.name}":`, errorMessage);
                console.error(`[Storage] Error code:`, singleTaskError?.code);
                console.error(`[Storage] Error detail:`, singleTaskError?.detail);
                // Continue with other tasks
              }
            }
            
            console.log(`[Storage] Successfully created ${insertedTaskIds.length} out of ${tasksToCreate.length} tasks`);
            
            // Immediately verify tasks were saved correctly
            const verifyResult = await db.execute(sql`
              SELECT id, name, issue_id, points FROM tasks WHERE issue_id = ${issue.id} ORDER BY "order" ASC
            `);
            const verifiedCount = verifyResult.rows?.length || 0;
            console.log(`[Storage] Verification query: Found ${verifiedCount} tasks for issue ${issue.id}`);
            
            if (verifiedCount > 0) {
              console.log(`[Storage] ✓ Tasks verified in database:`, verifyResult.rows?.map((r: any) => ({ 
                id: r.id, 
                name: r.name || r.title, 
                issue_id: r.issue_id,
                points: r.points
              })));
            } else {
              console.error(`[Storage] ✗ CRITICAL: Verification query found NO tasks for issue ${issue.id}!`);
              console.error(`[Storage] This means tasks were NOT saved to the database.`);
            }
          } catch (taskInsertError: any) {
            console.error(`[Storage] ERROR creating tasks:`, taskInsertError);
            console.error(`[Storage] Error message:`, taskInsertError?.message);
            console.error(`[Storage] Error code:`, taskInsertError?.code);
            console.error(`[Storage] Error detail:`, taskInsertError?.detail);
            console.error(`[Storage] Error stack:`, taskInsertError?.stack);
            // Don't throw - continue with issue creation even if tasks fail
            // This allows the issue to be created, and tasks can be added later
          }
        } else {
          console.warn(`[Storage] No valid tasks to create after filtering`);
        }
      } else {
        console.log(`[Storage] No tasks data provided or empty array`);
      }
      
      // Return issue with tasks attached
      // Add a small delay to ensure tasks are committed to database
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Fetch tasks directly using raw SQL to ensure we get them
      let fetchedTasks: any[] = [];
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries && fetchedTasks.length === 0 && tasksData && tasksData.length > 0) {
        try {
          const taskResult = await db.execute(sql`
            SELECT * FROM tasks 
            WHERE issue_id = ${issue.id}
            ORDER BY COALESCE("order", 0) ASC, created_at ASC
          `);
          fetchedTasks = taskResult.rows || [];
          console.log(`[Storage] Direct query (attempt ${retryCount + 1}) found ${fetchedTasks.length} tasks for issue ${issue.id}`);
          
          if (fetchedTasks.length === 0 && retryCount < maxRetries - 1) {
            console.log(`[Storage] No tasks found, retrying in 200ms...`);
            await new Promise(resolve => setTimeout(resolve, 200));
            retryCount++;
          } else {
            break;
          }
        } catch (taskFetchError: any) {
          console.error(`[Storage] Error fetching tasks directly (attempt ${retryCount + 1}):`, taskFetchError?.message);
          if (retryCount < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
            retryCount++;
          } else {
            break;
          }
        }
      }
      
      // Transform tasks to ensure consistent field names
      const transformedTasks = fetchedTasks.map((task: any) => ({
        id: task.id,
        name: task.name || task.title || "Untitled Task",
        title: task.name || task.title || "Untitled Task",
        points: task.points || 0,
        assignedTo: task.assigned_to || task.assignedTo || null,
        memberId: task.assigned_to || task.assignedTo || null,
        priority: task.priority || "no_priority",
        order: task.order || 0,
        isCompleted: task.is_completed || task.isCompleted || false,
        status: task.status || "pending",
        issueId: task.issue_id || task.issueId,
      }));
      
      const issueWithTasks = {
        ...issue,
        tasks: transformedTasks
      };
      
      console.log(`[Storage] Returning issue ${issue.id} with ${transformedTasks.length} tasks`);
      if (transformedTasks.length > 0) {
        console.log(`[Storage] ✓ Task details:`, transformedTasks.map((t: any) => ({ id: t.id, name: t.name, points: t.points, assignedTo: t.assignedTo })));
      } else if (tasksData && tasksData.length > 0) {
        console.error(`[Storage] ✗ WARNING: Expected ${tasksData.length} tasks but found 0 in database!`);
      }
      
      return issueWithTasks;
    } catch (error: any) {
      console.error(`[Storage] Error in createIssue:`, error);
      console.error(`[Storage] Error message:`, error?.message);
      console.error(`[Storage] Error code:`, error?.code);
      console.error(`[Storage] Error detail:`, error?.detail);
      throw error;
    }
  }

  async updateIssue(issueId: string, updates: any): Promise<any | undefined> {
    const [updated] = await db.update(issues).set(updates).where(eq(issues.id, issueId)).returning();
    return updated || undefined;
  }

  async deleteIssue(issueId: string): Promise<void> {
    // Delete associated tasks first
    await db.delete(tasks).where(eq(tasks.issueId, issueId));
    await db.delete(issues).where(eq(issues.id, issueId));
  }

  // Issue Tasks
  async getIssueTasks(issueId: string): Promise<any[]> {
    try {
      const taskResult = await db.execute(sql`
        SELECT * FROM tasks 
        WHERE issue_id = ${issueId}
        ORDER BY COALESCE("order", 0) ASC, created_at ASC
      `);
      return taskResult.rows || [];
    } catch (error: any) {
      console.error(`[Storage] Error in getIssueTasks:`, error);
      return [];
    }
  }

  async createIssueTask(issueId: string, taskData: any): Promise<any> {
    // Don't set memberId - it's optional and might cause database errors if column doesn't exist
    const taskValues: any = {
      issueId: issueId,
      name: taskData.name,
      title: taskData.name, // Also set title for compatibility
      points: taskData.points || 0,
      priority: taskData.priority || "no_priority",
      assignedTo: taskData.assignedTo || null,
      order: taskData.order || 0,
      status: "pending",
      isCompleted: false,
    };
    const [task] = await db.insert(tasks).values(taskValues).returning();
    return task;
  }

  // Clips
  async getClipsByProject(projectId: string): Promise<any[]> {
    return await db.select().from(clips).where(eq(clips.projectId, projectId)).orderBy(clips.clipNumber);
  }

  async getPendingClips(projectId?: string): Promise<any[]> {
    if (projectId) {
      return await db.select().from(clips)
        .where(and(eq(clips.projectId, projectId), eq(clips.status, "pending")))
        .orderBy(clips.clipNumber);
    }
    return await db.select().from(clips)
      .where(eq(clips.status, "pending"))
      .orderBy(clips.clipNumber);
  }

  async getValidClips(projectId?: string): Promise<any[]> {
    if (projectId) {
      return await db.select().from(clips)
        .where(and(eq(clips.projectId, projectId), eq(clips.status, "valid")))
        .orderBy(clips.clipNumber);
    }
    return await db.select().from(clips)
      .where(eq(clips.status, "valid"))
      .orderBy(clips.clipNumber);
  }

  async getInvalidClips(projectId?: string): Promise<any[]> {
    if (projectId) {
      return await db.select().from(clips)
        .where(and(eq(clips.projectId, projectId), eq(clips.status, "invalid")))
        .orderBy(clips.clipNumber);
    }
    return await db.select().from(clips)
      .where(eq(clips.status, "invalid"))
      .orderBy(clips.clipNumber);
  }

  async createClip(clipData: any): Promise<any> {
    try {
      // Build insert data - use exact field names from schema
      // Drizzle automatically maps camelCase (schema) to snake_case (database)
      const insertData: any = {
        projectId: String(clipData.projectId),
        clipNumber: parseInt(String(clipData.clipNumber)),
        status: String(clipData.status || "pending"),
        filePath: clipData.filePath !== undefined && clipData.filePath !== null 
          ? String(clipData.filePath) 
          : "", // Always include filePath, use empty string if not provided
      };
      
      console.log("Storage createClip - input:", JSON.stringify(clipData, null, 2));
      console.log("Storage createClip - insertData:", JSON.stringify(insertData, null, 2));
      
      // Insert using Drizzle - it will map projectId -> project_id, clipNumber -> clip_number, etc.
      const [clip] = await db.insert(clips).values(insertData).returning();
      console.log("✓ Storage createClip - success, created clip:", clip.id);
      return clip;
    } catch (error: any) {
      console.error("❌ Storage createClip - error:", error);
      console.error("   Error code:", error?.code);
      console.error("   Error message:", error?.message);
      console.error("   Error detail:", error?.detail);
      console.error("   Error position:", error?.position);
      console.error("   Error constraint:", error?.constraint);
      console.error("   Error table:", error?.table);
      console.error("   Error column:", error?.column);
      console.error("   Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      throw error;
    }
  }

  async updateClip(clipId: string, updates: any): Promise<any | undefined> {
    // Transform isValid to status if provided
    if (updates.isValid !== undefined) {
      if (updates.isValid === true) {
        updates.status = "valid";
      } else if (updates.isValid === false) {
        updates.status = "invalid";
      } else if (updates.isValid === null) {
        updates.status = "pending";
      }
      delete updates.isValid;
    }
    // Transform rejectionNote to invalidNote if provided
    if (updates.rejectionNote !== undefined) {
      updates.invalidNote = updates.rejectionNote;
      delete updates.rejectionNote;
    }
    const [updated] = await db.update(clips).set(updates).where(eq(clips.id, clipId)).returning();
    return updated || undefined;
  }

  async deleteClip(clipId: string): Promise<void> {
    await db.delete(clips).where(eq(clips.id, clipId));
  }

  // Issue Templates
  async getAllTemplates(): Promise<any[]> {
    return await db.select().from(issueTemplates).orderBy(desc(issueTemplates.createdAt));
  }

  async createTemplate(templateData: any): Promise<any> {
    try {
      // Build insert data with only required fields first
      const issueTitleValue = templateData.issueTitle || templateData.title || templateData.name;
      const insertData: any = {
        name: templateData.name,
        issueTitle: issueTitleValue,
      };
      
      // Add optional fields only if provided
      if (templateData.description !== undefined && templateData.description !== null && templateData.description !== "") {
        insertData.description = templateData.description;
      }
      if (templateData.videoUrl !== undefined && templateData.videoUrl !== null && templateData.videoUrl !== "") {
        insertData.videoUrl = templateData.videoUrl;
      }
      if (templateData.videoDuration !== undefined && templateData.videoDuration !== null) {
        insertData.videoDuration = templateData.videoDuration;
      }
      if (templateData.teamId !== undefined && templateData.teamId !== null && templateData.teamId !== "") {
        insertData.teamId = templateData.teamId;
      }
      if (templateData.defaultStatus !== undefined && templateData.defaultStatus !== null && templateData.defaultStatus !== "") {
        insertData.defaultStatus = templateData.defaultStatus;
      }
      if (templateData.defaultPriority !== undefined && templateData.defaultPriority !== null && templateData.defaultPriority !== "") {
        insertData.defaultPriority = templateData.defaultPriority;
      }
      if (templateData.defaultAssigneeId !== undefined && templateData.defaultAssigneeId !== null && templateData.defaultAssigneeId !== "") {
        insertData.defaultAssigneeId = templateData.defaultAssigneeId;
      }
      if (templateData.defaultProjectId !== undefined && templateData.defaultProjectId !== null && templateData.defaultProjectId !== "") {
        insertData.defaultProjectId = templateData.defaultProjectId;
      }
      
      // Check if title column exists in database
      let hasTitleColumn = false;
      try {
        const checkTitle = await db.execute(sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'issue_templates' AND column_name = 'title'
        `);
        hasTitleColumn = checkTitle && checkTitle.rows.length > 0;
      } catch (err) {
        // Ignore - assume no title column
      }
      
      // If title column exists, use raw SQL to insert both title and issue_title
      if (hasTitleColumn) {
        const issueTitleValue = insertData.issueTitle;
        const result = await db.execute(sql`
          INSERT INTO issue_templates (
            name, issue_title, title, description, video_url, video_duration,
            team_id, default_status, default_priority, default_assignee_id, default_project_id
          ) VALUES (
            ${insertData.name},
            ${issueTitleValue},
            ${issueTitleValue},
            ${insertData.description || null},
            ${insertData.videoUrl || null},
            ${insertData.videoDuration || null},
            ${insertData.teamId || null},
            ${insertData.defaultStatus || 'todo'},
            ${insertData.defaultPriority || 'no_priority'},
            ${insertData.defaultAssigneeId || null},
            ${insertData.defaultProjectId || null}
          )
          RETURNING *
        `);
        return result.rows[0];
      } else {
        // No title column, use normal drizzle insert
        const [template] = await db.insert(issueTemplates).values(insertData).returning();
        return template;
      }
    } catch (error: any) {
      console.error("Error in createTemplate:", error);
      console.error("Error details:", error.message);
      console.error("Template data:", JSON.stringify(templateData, null, 2));
      throw error;
    }
  }

  async updateTemplate(templateId: string, updates: any): Promise<any | undefined> {
    const [updated] = await db.update(issueTemplates).set({
      ...updates,
      updatedAt: new Date(),
    }).where(eq(issueTemplates.id, templateId)).returning();
    return updated || undefined;
  }

  async deleteTemplate(templateId: string): Promise<void> {
    // Also delete all template tasks
    await db.delete(templateTasks).where(eq(templateTasks.templateId, templateId));
    await db.delete(issueTemplates).where(eq(issueTemplates.id, templateId));
  }

  // Template Tasks
  async getTemplateTasks(templateId: string): Promise<any[]> {
    return await db.select().from(templateTasks)
      .where(eq(templateTasks.templateId, templateId))
      .orderBy(templateTasks.order);
  }

  async createTemplateTask(templateId: string, taskData: any): Promise<any> {
    const [task] = await db.insert(templateTasks).values({
      ...taskData,
      templateId,
    }).returning();
    return task;
  }

  async updateTemplateTask(templateId: string, taskId: string, updates: any): Promise<any | undefined> {
    const [updated] = await db.update(templateTasks)
      .set(updates)
      .where(and(
        eq(templateTasks.id, taskId),
        eq(templateTasks.templateId, templateId)
      ))
      .returning();
    return updated || undefined;
  }

  async deleteTemplateTask(templateId: string, taskId: string): Promise<void> {
    await db.delete(templateTasks).where(and(
      eq(templateTasks.id, taskId),
      eq(templateTasks.templateId, templateId)
    ));
  }

  // Teams
  async getAllTeams(): Promise<any[]> {
    return await db.select().from(teams).orderBy(teams.name);
  }

  async createTeam(teamData: any): Promise<any> {
    const [team] = await db.insert(teams).values(teamData).returning();
    return team;
  }

  async updateTeam(teamId: string, updates: any): Promise<any | undefined> {
    const [updated] = await db.update(teams).set(updates).where(eq(teams.id, teamId)).returning();
    return updated || undefined;
  }

  async deleteTeam(teamId: string): Promise<void> {
    await db.delete(teams).where(eq(teams.id, teamId));
  }

  async getTeamById(teamId: string): Promise<any | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
    return team || undefined;
  }

  // Income & Expenses
  async getAllIncome(filters?: any): Promise<any[]> {
    const conditions = [];
    if (filters?.startDate) {
      conditions.push(gte(income.date, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(income.date, filters.endDate));
    }
    if (filters?.source) {
      conditions.push(eq(income.source, filters.source));
    }
    if (conditions.length > 0) {
      return await db.select().from(income).where(and(...conditions)).orderBy(desc(income.date));
    }
    return await db.select().from(income).orderBy(desc(income.date));
  }

  async createIncome(incomeData: any): Promise<any> {
    const [incomeRecord] = await db.insert(income).values(incomeData).returning();
    return incomeRecord;
  }

  async getAllExpenses(filters?: any): Promise<any[]> {
    const conditions = [];
    if (filters?.startDate) {
      conditions.push(gte(expenses.date, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(expenses.date, filters.endDate));
    }
    if (filters?.category) {
      conditions.push(eq(expenses.category, filters.category));
    }
    if (conditions.length > 0) {
      return await db.select().from(expenses).where(and(...conditions)).orderBy(desc(expenses.date));
    }
    return await db.select().from(expenses).orderBy(desc(expenses.date));
  }

  async createExpense(expenseData: any): Promise<any> {
    const [expenseRecord] = await db.insert(expenses).values(expenseData).returning();
    return expenseRecord;
  }

  // Member Stats & Transactions
  async getMemberStats(memberId: string): Promise<any | undefined> {
    const [stats] = await db.select().from(memberStats).where(eq(memberStats.memberId, memberId));
    return stats || undefined;
  }

  async updateMemberStats(memberId: string, updates: any): Promise<any> {
    const existing = await this.getMemberStats(memberId);
    if (existing) {
      const [updated] = await db
        .update(memberStats)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(memberStats.memberId, memberId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(memberStats)
        .values({ memberId, ...updates, updatedAt: new Date() })
        .returning();
      return created;
    }
  }

  async getMemberTransactions(memberId: string, filters?: any): Promise<any[]> {
    const conditions = [eq(transactions.memberId, memberId)];
    if (filters?.search) {
      conditions.push(like(transactions.description, `%${filters.search}%`));
    }
    return await db.select().from(transactions).where(and(...conditions)).orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transactionData: any): Promise<any> {
    const [transaction] = await db.insert(transactions).values(transactionData).returning();
    return transaction;
  }

  // Social Media Accounts
  async getSocialMediaAccountsByClient(clientId: string): Promise<any[]> {
    return await db.select().from(socialMediaAccounts).where(eq(socialMediaAccounts.clientId, clientId));
  }

  async createSocialMediaAccount(accountData: any): Promise<any> {
    const [account] = await db.insert(socialMediaAccounts).values(accountData).returning();
    return account;
  }

  async updateSocialMediaAccount(accountId: string, updates: any): Promise<any | undefined> {
    const [updated] = await db.update(socialMediaAccounts).set(updates).where(eq(socialMediaAccounts.id, accountId)).returning();
    return updated || undefined;
  }

  async deleteSocialMediaAccount(accountId: string): Promise<void> {
    await db.delete(socialMediaAccounts).where(eq(socialMediaAccounts.id, accountId));
  }

  // Invoices
  async getAllInvoices(filters?: any): Promise<any[]> {
    try {
      const conditions = [];
      if (filters?.clientId) {
        conditions.push(eq(invoices.clientId, filters.clientId));
      }
      if (filters?.status) {
        conditions.push(eq(invoices.status, filters.status));
      }
      if (conditions.length > 0) {
        return await db.select().from(invoices).where(and(...conditions)).orderBy(desc(invoices.createdAt));
      }
      return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
    } catch (error: any) {
      // If invoices table doesn't exist, return empty array
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        console.warn('[Storage] Invoices table does not exist, returning empty array');
        return [];
      }
      // Re-throw other errors
      throw error;
    }
  }

  async createInvoice(invoiceData: any): Promise<any> {
    const [invoice] = await db.insert(invoices).values(invoiceData).returning();
    return invoice;
  }

  async updateInvoice(invoiceId: string, updates: any): Promise<any | undefined> {
    const [updated] = await db.update(invoices).set(updates).where(eq(invoices.id, invoiceId)).returning();
    return updated || undefined;
  }

  // Notes
  async getNotes(filters?: any): Promise<any[]> {
    const conditions = [];
    if (filters?.clientId) {
      conditions.push(eq(notes.clientId, filters.clientId));
    }
    if (filters?.projectId) {
      conditions.push(eq(notes.projectId, filters.projectId));
    }
    if (filters?.taskId) {
      conditions.push(eq(notes.taskId, filters.taskId));
    }
    if (conditions.length > 0) {
      return await db.select().from(notes).where(and(...conditions)).orderBy(desc(notes.createdAt));
    }
    return await db.select().from(notes).orderBy(desc(notes.createdAt));
  }

  async createNote(noteData: any): Promise<any> {
    const [note] = await db.insert(notes).values(noteData).returning();
    return note;
  }

  async deleteNote(noteId: string): Promise<void> {
    await db.delete(notes).where(eq(notes.id, noteId));
  }

  // Recurring Subscriptions
  async getAllSubscriptions(): Promise<any[]> {
    return await db.select().from(recurringSubscriptions).orderBy(desc(recurringSubscriptions.createdAt));
  }

  async createSubscription(subscriptionData: any): Promise<any> {
    const [subscription] = await db.insert(recurringSubscriptions).values(subscriptionData).returning();
    return subscription;
  }

  async updateSubscription(subscriptionId: string, updates: any): Promise<any | undefined> {
    const [updated] = await db.update(recurringSubscriptions).set(updates).where(eq(recurringSubscriptions.id, subscriptionId)).returning();
    return updated || undefined;
  }

  async deleteSubscription(subscriptionId: string): Promise<void> {
    await db.delete(recurringSubscriptions).where(eq(recurringSubscriptions.id, subscriptionId));
  }
}

export const storage = new DatabaseStorage();
