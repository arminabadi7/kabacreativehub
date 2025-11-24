import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertAffiliateSchema, 
  trackReferralSchema,
  insertReferralSchema,
  updatePaymentSchema,
  registerAffiliateSchema,
  loginAffiliateSchema,
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

  const httpServer = createServer(app);

  return httpServer;
}
