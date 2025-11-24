import { 
  users,
  affiliates,
  referrals,
  bookings,
  availability,
  bookingQuestions,
  appointments,
  founderSettings,
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
  type FounderSettings
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
}

export const storage = new DatabaseStorage();
