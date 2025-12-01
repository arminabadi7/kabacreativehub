import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { emailService } from "./email";
import { googleCalendarClient, googleSheetsClient, getGoogleCalendarClient } from "./integrations";
import { registerCalendlyRoutes } from "./calendly-routes";
import { getCalendlyService } from "./calendly-service";
import { 
  insertAffiliateSchema, 
  trackReferralSchema,
  insertReferralSchema,
  updatePaymentSchema,
  registerAffiliateSchema,
  loginAffiliateSchema,
  insertBookingSchema,
  confirmBookingSchema,
  updateBookingSchema,
  type Affiliate
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import bcrypt from "bcrypt";

const referralTrackingStore = new Map<string, { count: number; timestamp: number }>();

function getRateLimitKey(req: Request): string {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  return String(ip);
}

function checkRateLimit(key: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const record = referralTrackingStore.get(key);
  
  if (!record || now - record.timestamp > windowMs) {
    referralTrackingStore.set(key, { count: 1, timestamp: now });
    cleanupExpiredRateLimits(now, windowMs);
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

function cleanupExpiredRateLimits(now: number, windowMs: number): void {
  for (const [key, record] of Array.from(referralTrackingStore.entries())) {
    if (now - record.timestamp > windowMs) {
      referralTrackingStore.delete(key);
    }
  }
}

function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.affiliateId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

function requireOwnership(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.username) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const { username } = req.params;
  if (req.session.username !== username) {
    return res.status(403).json({ error: "Access denied" });
  }
  
  next();
}

function requireFounderAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.isFounder) {
    return res.status(401).json({ error: "Founder authentication required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerAffiliateSchema.parse(req.body);
      
      const existingAffiliate = await storage.getAffiliateByUsername(validatedData.username);
      if (existingAffiliate) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      const passwordHash = await bcrypt.hash(validatedData.password, 10);
      
      const affiliateData = {
        username: validatedData.username,
        email: validatedData.email,
        passwordHash: passwordHash,
      };
      
      const affiliate = await storage.createAffiliate(affiliateData);
      
      req.session.affiliateId = affiliate.id;
      req.session.username = affiliate.username;
      
      const { passwordHash: _, ...affiliateWithoutPassword } = affiliate;
      return res.status(201).json(affiliateWithoutPassword);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error registering affiliate:", error);
      return res.status(500).json({ error: "Failed to register affiliate" });
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginAffiliateSchema.parse(req.body);
      
      const affiliate = await storage.getAffiliateByUsername(validatedData.username);
      if (!affiliate || !affiliate.passwordHash) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      
      const validPassword = await bcrypt.compare(validatedData.password, affiliate.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      
      req.session.affiliateId = affiliate.id;
      req.session.username = affiliate.username;
      
      const { passwordHash: _, ...affiliateWithoutPassword } = affiliate;
      return res.json(affiliateWithoutPassword);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error logging in:", error);
      return res.status(500).json({ error: "Failed to login" });
    }
  });
  
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      return res.json({ success: true });
    });
  });

  app.post("/api/founder/login", async (req, res) => {
    try {
      const { password } = req.body;
      const founderPassword = process.env.FOUNDER_PASSWORD;
      
      if (!founderPassword) {
        return res.status(500).json({ error: "Founder authentication not configured" });
      }
      
      if (password !== founderPassword) {
        return res.status(401).json({ error: "Invalid founder password" });
      }
      
      req.session.isFounder = true;
      return res.json({ success: true });
    } catch (error) {
      console.error("Error logging in as founder:", error);
      return res.status(500).json({ error: "Failed to authenticate" });
    }
  });

  app.get("/api/founder/session", (req, res) => {
    if (!req.session?.isFounder) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    return res.json({ isFounder: true });
  });

  app.get("/api/founder/affiliates", requireFounderAuth, async (req, res) => {
    try {
      const allAffiliates = await storage.getAllAffiliates();
      
      const affiliatesWithStats = await Promise.all(
        allAffiliates.map(async (affiliate) => {
          const stats = await storage.getAffiliateStats(affiliate.id);
          const { passwordHash: _, ...affiliateWithoutPassword } = affiliate;
          return {
            ...affiliateWithoutPassword,
            ...stats,
          };
        })
      );
      
      return res.json(affiliatesWithStats);
    } catch (error) {
      console.error("Error fetching affiliates:", error);
      return res.status(500).json({ error: "Failed to fetch affiliates" });
    }
  });

  app.post("/api/founder/logout", (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Error destroying founder session:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      return res.json({ success: true });
    });
  });

  app.post("/api/founder/bookings", requireFounderAuth, async (req, res) => {
    try {
      const validatedData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(validatedData);
      return res.status(201).json(booking);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error creating booking:", error);
      return res.status(500).json({ error: "Failed to create booking" });
    }
  });

  app.get("/api/founder/bookings", requireFounderAuth, async (req, res) => {
    try {
      const calendly = getCalendlyService();
      if (calendly) {
        // Fetch from Calendly API and sync to database
        const calendlyBookings = await calendly.syncBookings();
        
        // Upsert each Calendly booking into the database so they can be updated
        for (const booking of calendlyBookings) {
          await storage.upsertBooking(booking);
        }
      }
      
      // Return all database bookings (includes synced Calendly + manually created)
      const { status } = req.query;
      const allBookings = await storage.getBookings(status as string | undefined);
      return res.json(allBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      return res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.post("/api/founder/bookings/:bookingId/confirm", requireFounderAuth, async (req, res) => {
    try {
      const { bookingId } = req.params;
      const validatedData = confirmBookingSchema.parse({ ...req.body, bookingId });
      
      const booking = await storage.confirmBooking(bookingId, validatedData.tier);
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      return res.json(booking);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error confirming booking:", error);
      return res.status(500).json({ error: "Failed to confirm booking" });
    }
  });

  app.patch("/api/founder/bookings/:bookingId", requireFounderAuth, async (req, res) => {
    try {
      const { bookingId } = req.params;
      const validatedData = updateBookingSchema.parse(req.body);
      
      const booking = await storage.updateBooking(bookingId, validatedData);
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      return res.json(booking);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error updating booking:", error);
      return res.status(500).json({ error: "Failed to update booking" });
    }
  });

  app.get("/api/founder/calendar-events", requireFounderAuth, async (req, res) => {
    try {
      const calendar = await getGoogleCalendarClient();
      if (!calendar) {
        console.warn("Google Calendar client not available");
        return res.json([]);
      }

      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // KabaContent Google Calendar ID
      const calendarId = '917c18cec506eb1481e1deb5156a6d561900a80fdea4b234e72820460c74fc4230c@group.calendar.google.com';

      const response = await calendar.events.list({
        calendarId: calendarId,
        timeMin: now.toISOString(),
        timeMax: thirtyDaysFromNow.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 100,
      });

      const events = response.data.items || [];
      console.log(`✓ Fetched ${events.length} calendar events`);
      return res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      return res.json([]);
    }
  });
  
  app.get("/api/auth/session", async (req, res) => {
    if (!req.session?.affiliateId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const affiliate = await storage.getAffiliate(req.session.affiliateId);
      if (!affiliate) {
        req.session.destroy(() => {});
        return res.status(401).json({ error: "Session invalid" });
      }
      
      const { passwordHash: _, ...affiliateWithoutPassword } = affiliate;
      return res.json(affiliateWithoutPassword);
    } catch (error) {
      console.error("Error fetching session:", error);
      return res.status(500).json({ error: "Failed to fetch session" });
    }
  });
  
  app.post("/api/affiliates", async (req, res) => {
    try {
      const validatedData = insertAffiliateSchema.parse(req.body);
      
      const existingAffiliate = await storage.getAffiliateByUsername(validatedData.username);
      if (existingAffiliate) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      const affiliate = await storage.createAffiliate(validatedData);
      
      return res.status(201).json(affiliate);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error creating affiliate:", error);
      return res.status(500).json({ error: "Failed to create affiliate" });
    }
  });
  
  app.get("/api/affiliates/:username", requireOwnership, async (req, res) => {
    try {
      const { username } = req.params;
      
      const affiliate = await storage.getAffiliateByUsername(username);
      
      if (!affiliate) {
        return res.status(404).json({ error: "Affiliate not found" });
      }
      
      const { passwordHash: _, ...affiliateWithoutPassword } = affiliate;
      return res.json(affiliateWithoutPassword);
    } catch (error) {
      console.error("Error fetching affiliate:", error);
      return res.status(500).json({ error: "Failed to fetch affiliate" });
    }
  });
  
  app.put("/api/affiliates/:username/payment", requireOwnership, async (req, res) => {
    try {
      const { username } = req.params;
      const validatedData = updatePaymentSchema.parse(req.body);
      
      const sanitizedPayment = {
        paymentMethod: validatedData.paymentMethod,
        paymentDetails: sanitizeInput(validatedData.paymentDetails),
      };
      
      const affiliate = await storage.updateAffiliatePayment(username, sanitizedPayment);
      
      if (!affiliate) {
        return res.status(404).json({ error: "Affiliate not found" });
      }
      
      return res.json(affiliate);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error updating payment:", error);
      return res.status(500).json({ error: "Failed to update payment information" });
    }
  });
  
  app.post("/api/referrals/track", async (req, res) => {
    try {
      const rateLimitKey = getRateLimitKey(req);
      
      if (!checkRateLimit(rateLimitKey, 20, 60000)) {
        return res.status(429).json({ error: "Too many requests. Please try again later." });
      }
      
      const validatedData = trackReferralSchema.parse(req.body);
      
      const affiliate = await storage.getAffiliateByUsername(validatedData.referrerUsername);
      if (!affiliate) {
        return res.status(404).json({ error: "Affiliate not found" });
      }
      
      const visitorIP = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                       req.socket.remoteAddress || 
                       'unknown';
      
      const referralDataToInsert = {
        affiliateId: affiliate.id,
        referrerUsername: validatedData.referrerUsername,
        visitorIP: visitorIP,
      };
      
      const validatedReferral = insertReferralSchema.parse(referralDataToInsert);
      
      const referral = await storage.createReferral(validatedReferral);
      
      return res.status(201).json({ success: true, referralId: referral.id });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error tracking referral:", error);
      return res.status(500).json({ error: "Failed to track referral" });
    }
  });
  
  app.post("/api/referrals/convert", async (req, res) => {
    try {
      const { referralId } = req.body;
      
      if (!referralId) {
        return res.status(400).json({ error: "Referral ID is required" });
      }
      
      const referral = await storage.markReferralConverted(referralId);
      
      if (!referral) {
        return res.status(404).json({ error: "Referral not found" });
      }
      
      return res.json({ success: true, referral });
    } catch (error) {
      console.error("Error converting referral:", error);
      return res.status(500).json({ error: "Failed to convert referral" });
    }
  });
  
  app.get("/api/affiliates/:username/stats", requireOwnership, async (req, res) => {
    try {
      const { username } = req.params;
      
      const affiliate = await storage.getAffiliateByUsername(username);
      
      if (!affiliate) {
        return res.status(404).json({ error: "Affiliate not found" });
      }
      
      const stats = await storage.getAffiliateStats(affiliate.id);
      
      return res.json(stats);
    } catch (error) {
      console.error("Error fetching affiliate stats:", error);
      return res.status(500).json({ error: "Failed to fetch affiliate statistics" });
    }
  });
  
  app.get("/api/affiliates/:username/referrals", requireOwnership, async (req, res) => {
    try {
      const { username } = req.params;
      
      const affiliate = await storage.getAffiliateByUsername(username);
      
      if (!affiliate) {
        return res.status(404).json({ error: "Affiliate not found" });
      }
      
      const referrals = await storage.getReferralsByAffiliate(affiliate.id);
      
      return res.json(referrals);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      return res.status(500).json({ error: "Failed to fetch referrals" });
    }
  });

  // Scheduling System API Routes
  app.get("/api/scheduling/availability", async (req, res) => {
    try {
      const availability = await storage.getAvailability();
      return res.json(availability);
    } catch (error) {
      console.error("Error fetching availability:", error);
      return res.status(500).json({ error: "Failed to fetch availability" });
    }
  });

  app.put("/api/founder/scheduling/availability", requireFounderAuth, async (req, res) => {
    try {
      const { dayOfWeek, startTime, endTime, isEnabled } = req.body;
      const updated = await storage.updateAvailability(dayOfWeek, startTime, endTime, isEnabled);
      return res.json(updated);
    } catch (error) {
      console.error("Error updating availability:", error);
      return res.status(500).json({ error: "Failed to update availability" });
    }
  });

  app.get("/api/scheduling/questions", async (req, res) => {
    try {
      const questions = await storage.getBookingQuestions();
      return res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      return res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  app.post("/api/founder/scheduling/questions", requireFounderAuth, async (req, res) => {
    try {
      const question = await storage.createBookingQuestion(req.body);
      return res.status(201).json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      return res.status(500).json({ error: "Failed to create question" });
    }
  });

  app.put("/api/founder/scheduling/questions/:id", requireFounderAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await storage.updateBookingQuestion(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Question not found" });
      }
      return res.json(updated);
    } catch (error) {
      console.error("Error updating question:", error);
      return res.status(500).json({ error: "Failed to update question" });
    }
  });

  app.delete("/api/founder/scheduling/questions/:id", requireFounderAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBookingQuestion(id);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting question:", error);
      return res.status(500).json({ error: "Failed to delete question" });
    }
  });

  app.get("/api/founder/scheduling/appointments", requireFounderAuth, async (req, res) => {
    try {
      const appointments = await storage.getAppointments();
      return res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      return res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.post("/api/scheduling/appointments", async (req, res) => {
    try {
      const appointment = await storage.createAppointment(req.body);
      const settings = await storage.getFounderSettings();

      // Send confirmation email
      await emailService.sendConfirmationEmail(
        appointment.attendeeName,
        appointment.attendeeEmail,
        new Date(appointment.appointmentTime),
        settings?.timezone || "America/Toronto"
      );

      // Create Google Calendar event
      const calendarEventId = await googleCalendarClient.createEvent(
        appointment,
        settings?.timezone || "America/Toronto"
      );
      if (calendarEventId) {
        await storage.updateAppointment(appointment.id, { googleCalendarEventId: calendarEventId });
      }

      // Append to Google Sheets
      const formResponses = appointment.formResponses ? JSON.parse(appointment.formResponses) : {};
      const sheetRowId = await googleSheetsClient.appendBooking(appointment, formResponses);
      if (sheetRowId) {
        await storage.updateAppointment(appointment.id, { googleSheetRowId: sheetRowId });
      }

      // Schedule 24-hour reminder
      const reminderTime = new Date(appointment.appointmentTime).getTime() - 24 * 60 * 60 * 1000;
      const timeUntilReminder = reminderTime - Date.now();
      if (timeUntilReminder > 0) {
        setTimeout(async () => {
          await emailService.sendReminderEmail(
            appointment.attendeeName,
            appointment.attendeeEmail,
            new Date(appointment.appointmentTime),
            settings?.timezone || "America/Toronto"
          );
        }, timeUntilReminder);
      }

      return res.status(201).json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      return res.status(500).json({ error: "Failed to create appointment" });
    }
  });

  app.get("/api/affiliates/:username/appointments", async (req, res) => {
    try {
      const { username } = req.params;
      const appointments = await storage.getAppointments();
      const affiliateAppointments = appointments.filter(apt => apt.affiliateUsername === username);
      return res.json(affiliateAppointments);
    } catch (error) {
      console.error("Error fetching affiliate appointments:", error);
      return res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.get("/api/founder/scheduling/settings", requireFounderAuth, async (req, res) => {
    try {
      const settings = await storage.getFounderSettings();
      return res.json(settings || { timeFormat: "12h", meetingDuration: 30, bufferTime: 20, timezone: "America/Toronto" });
    } catch (error) {
      console.error("Error fetching settings:", error);
      return res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/founder/scheduling/settings", requireFounderAuth, async (req, res) => {
    try {
      const updated = await storage.updateFounderSettings(req.body);
      return res.json(updated);
    } catch (error) {
      console.error("Error updating settings:", error);
      return res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Template Routes
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getAllTemplates();
      return res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      return res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const { name, title, description, videoUrl, videoDuration } = req.body;
      if (!name || !title) {
        return res.status(400).json({ error: "Name and title are required" });
      }
      const template = await storage.createTemplate({ name, title, description, videoUrl, videoDuration });
      return res.status(201).json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      return res.status(500).json({ error: "Failed to create template" });
    }
  });

  app.put("/api/templates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, title, description, videoUrl, videoDuration } = req.body;
      const updated = await storage.updateTemplate(id, { name, title, description, videoUrl, videoDuration });
      if (!updated) {
        return res.status(404).json({ error: "Template not found" });
      }
      return res.json(updated);
    } catch (error) {
      console.error("Error updating template:", error);
      return res.status(500).json({ error: "Failed to update template" });
    }
  });

  app.delete("/api/templates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTemplate(id);
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting template:", error);
      return res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // Template Tasks Routes
  app.get("/api/templates/:templateId/tasks", async (req, res) => {
    try {
      const { templateId } = req.params;
      const tasks = await storage.getTemplateTasks(templateId);
      return res.json(tasks);
    } catch (error) {
      console.error("Error fetching template tasks:", error);
      return res.status(500).json({ error: "Failed to fetch template tasks" });
    }
  });

  app.post("/api/templates/:templateId/tasks", async (req, res) => {
    try {
      const { templateId } = req.params;
      const { name, points, priority, assignedTo, order } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Task name is required" });
      }
      const task = await storage.createTemplateTask(templateId, {
        name,
        points: points || 0,
        priority: priority || "no_priority",
        assignedTo: assignedTo || null,
        order: order || 0,
      });
      return res.status(201).json(task);
    } catch (error) {
      console.error("Error creating template task:", error);
      return res.status(500).json({ error: "Failed to create template task" });
    }
  });

  app.patch("/api/templates/:templateId/tasks/:taskId", async (req, res) => {
    try {
      const { templateId, taskId } = req.params;
      const updates = req.body;
      const updated = await storage.updateTemplateTask(templateId, taskId, updates);
      if (!updated) {
        return res.status(404).json({ error: "Template task not found" });
      }
      return res.json(updated);
    } catch (error) {
      console.error("Error updating template task:", error);
      return res.status(500).json({ error: "Failed to update template task" });
    }
  });

  app.delete("/api/templates/:templateId/tasks/:taskId", async (req, res) => {
    try {
      const { templateId, taskId } = req.params;
      await storage.deleteTemplateTask(templateId, taskId);
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting template task:", error);
      return res.status(500).json({ error: "Failed to delete template task" });
    }
  });

  // Member Authentication Routes
  app.post("/api/members/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const member = await storage.getMemberByUsername(username) || await storage.getMemberByEmail(username);
      if (!member) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, member.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.memberId = member.id;
      const { passwordHash: _, ...memberWithoutPassword } = member;
      return res.json(memberWithoutPassword);
    } catch (error) {
      console.error("Error logging in member:", error);
      return res.status(500).json({ error: "Failed to authenticate" });
    }
  });

  app.get("/api/members/session", async (req, res) => {
    try {
      if (!req.session?.memberId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const member = await storage.getMember(req.session.memberId);
      if (!member) {
        req.session.destroy(() => {});
        return res.status(401).json({ error: "Member not found" });
      }

      const { passwordHash: _, ...memberWithoutPassword } = member;
      return res.json(memberWithoutPassword);
    } catch (error) {
      console.error("Error fetching member session:", error);
      return res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  app.post("/api/members/logout", (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Error destroying member session:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      return res.json({ success: true });
    });
  });

  // Member Profile Routes
  app.put("/api/members/:id/profile", async (req, res) => {
    try {
      const { id } = req.params;
      if (req.session?.memberId !== id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { fullName, profilePicture } = req.body;
      const updated = await storage.updateMember(id, { fullName, profilePicture });
      if (!updated) {
        return res.status(404).json({ error: "Member not found" });
      }

      const { passwordHash: _, ...memberWithoutPassword } = updated;
      return res.json(memberWithoutPassword);
    } catch (error) {
      console.error("Error updating member profile:", error);
      return res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.put("/api/members/:id/password", async (req, res) => {
    try {
      const { id } = req.params;
      if (req.session?.memberId !== id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new passwords are required" });
      }

      const member = await storage.getMember(id);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      const isValid = await bcrypt.compare(currentPassword, member.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await storage.updateMember(id, { passwordHash });
      return res.json({ success: true });
    } catch (error) {
      console.error("Error changing password:", error);
      return res.status(500).json({ error: "Failed to change password" });
    }
  });

  // Member Stats Route
  app.get("/api/members/:id/stats", async (req, res) => {
    try {
      const { id } = req.params;
      const stats = await storage.getMemberStats(id);
      if (!stats) {
        // Return default stats if none exist
        return res.json({
          currentBalance: 0,
          totalEarned: 0,
          totalPaid: 0,
          thisMonth: 0,
        });
      }
      return res.json(stats);
    } catch (error) {
      console.error("Error fetching member stats:", error);
      return res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Member Activity Route
  app.get("/api/members/:id/activity", async (req, res) => {
    try {
      const { id } = req.params;
      const stats = await storage.getMemberStats(id);
      if (!stats) {
        return res.json({
          tasksCompleted: 0,
          bonusesReceived: 0,
          paymentsProcessed: 0,
          tasksIncomplete: 0,
          penaltiesApplied: 0,
        });
      }
      return res.json({
        tasksCompleted: stats.tasksCompleted,
        bonusesReceived: stats.bonusesReceived,
        paymentsProcessed: stats.paymentsProcessed,
        tasksIncomplete: stats.tasksIncomplete,
        penaltiesApplied: stats.penaltiesApplied,
      });
    } catch (error) {
      console.error("Error fetching member activity:", error);
      return res.status(500).json({ error: "Failed to fetch activity" });
    }
  });

  // Member Transactions Route
  app.get("/api/members/:id/transactions", async (req, res) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const transactions = await storage.getMemberTransactions(id, limit, offset);
      return res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Member Billing Route
  app.get("/api/members/:id/billing", async (req, res) => {
    try {
      const { id } = req.params;
      const billing = await storage.getMemberBillingInfo(id);
      return res.json(billing || { cardNumber: null, shebah: null, fullNameOnCard: null });
    } catch (error) {
      console.error("Error fetching billing info:", error);
      return res.status(500).json({ error: "Failed to fetch billing info" });
    }
  });

  app.put("/api/members/:id/billing", async (req, res) => {
    try {
      const { id } = req.params;
      if (req.session?.memberId !== id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { cardNumber, shebah, fullNameOnCard } = req.body;
      const billing = await storage.createOrUpdateBillingInfo(id, { cardNumber, shebah, fullNameOnCard });
      return res.json(billing);
    } catch (error) {
      console.error("Error updating billing info:", error);
      return res.status(500).json({ error: "Failed to update billing info" });
    }
  });

  // Members list route (for template assignment)
  app.get("/api/members/list", async (req, res) => {
    try {
      const allMembers = await storage.getAllMembers();
      const membersWithoutPasswords = allMembers.map(({ passwordHash: _, ...member }) => member);
      return res.json(membersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching members:", error);
      return res.status(500).json({ error: "Failed to fetch members" });
    }
  });

  // Projects Routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      return res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      return res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const { name, description, fileLocation } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Project name is required" });
      }
      const project = await storage.createProject({ name, description, fileLocation });
      return res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      return res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = await storage.updateProject(id, updates);
      if (!updated) {
        return res.status(404).json({ error: "Project not found" });
      }
      return res.json(updated);
    } catch (error) {
      console.error("Error updating project:", error);
      return res.status(500).json({ error: "Failed to update project" });
    }
  });

  // Clips Routes
  app.get("/api/clips/pending", async (req, res) => {
    try {
      const projectId = req.query.projectId as string;
      const clips = await storage.getPendingClips(projectId);
      return res.json(clips);
    } catch (error) {
      console.error("Error fetching pending clips:", error);
      return res.status(500).json({ error: "Failed to fetch clips" });
    }
  });

  app.post("/api/clips", async (req, res) => {
    try {
      const { projectId, clipNumber, filePath } = req.body;
      if (!projectId || !clipNumber || !filePath) {
        return res.status(400).json({ error: "projectId, clipNumber and filePath are required" });
      }
      const clip = await storage.createClip({ projectId, clipNumber, filePath });
      return res.status(201).json(clip);
    } catch (error) {
      console.error("Error creating clip:", error);
      return res.status(500).json({ error: "Failed to create clip" });
    }
  });

  app.patch("/api/clips/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { clipNumber, filePath, isValid, rejectionNote } = req.body;

      const clip = await storage.getClip(id);
      if (!clip) {
        return res.status(404).json({ error: "Clip not found" });
      }

      const updateData: any = {};
      if (clipNumber !== undefined) updateData.clipNumber = clipNumber;
      if (filePath !== undefined) updateData.filePath = filePath;
      if (isValid !== undefined) {
        updateData.isValid = isValid;
        updateData.rejectionNote = rejectionNote;
        updateData.reviewedBy = req.session?.memberId;
      }

      const updated = await storage.updateClip(id, updateData);

      // If clip is approved (valid), create an issue from it
      if (isValid === true) {
        await storage.createIssue({
          projectId: clip.projectId,
          title: `Clip ${clip.clipNumber}`,
          description: `Clip from: ${clip.filePath}`,
          videoUrl: clip.filePath,
          status: "backlog",
        });
      }

      return res.json(updated);
    } catch (error) {
      console.error("Error updating clip:", error);
      return res.status(500).json({ error: "Failed to update clip" });
    }
  });

  // Issues/Projects Routes
  app.get("/api/issues", async (req, res) => {
    try {
      const projectId = req.query.projectId as string;
      const issues = await storage.getIssues(projectId);
      return res.json(issues);
    } catch (error) {
      console.error("Error fetching issues:", error);
      return res.status(500).json({ error: "Failed to fetch issues" });
    }
  });

  app.patch("/api/issues/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = await storage.updateIssue(id, updates);
      if (!updated) {
        return res.status(404).json({ error: "Issue not found" });
      }
      return res.json(updated);
    } catch (error) {
      console.error("Error updating issue:", error);
      return res.status(500).json({ error: "Failed to update issue" });
    }
  });

  app.get("/api/issues/:id/tasks", async (req, res) => {
    try {
      const { id } = req.params;
      const tasks = await storage.getIssueTasks(id);
      return res.json(tasks);
    } catch (error) {
      console.error("Error fetching issue tasks:", error);
      return res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
