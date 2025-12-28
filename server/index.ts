import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedInitialData } from "./seedData";
import { migrateTemplateSchema, migrateIssuesTasksColumn } from "./migrate";

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

declare module 'express-session' {
  interface SessionData {
    affiliateId?: string;
    username?: string;
    isFounder?: boolean;
    memberId?: string;
    clientId?: string;
    userType?: string; // 'member' | 'client' | 'affiliate' | 'founder'
    role?: string; // For members: 'admin' | 'manager' | 'editor' | 'clipper' | 'member'
  }
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'kaba-content-affiliate-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 60 * 1000, // 30 minutes in milliseconds
  },
  rolling: true, // Reset expiration on every request
}));

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Migrate template schema first
    await migrateTemplateSchema();
  } catch (error: any) {
    console.error("⚠️  Database migration failed. Continuing anyway...");
    console.error("Error:", error.message || error);
  }
  
  try {
    // Migrate issues.tasks JSONB column
    await migrateIssuesTasksColumn();
  } catch (error: any) {
    console.error("⚠️  Issues tasks column migration failed. Continuing anyway...");
    console.error("Error:", error.message || error);
  }
  
  try {
    // Fix social_media_accounts table if needed
    const { fixSocialMediaAccountsTable } = await import("../fix-social-media-table");
    await fixSocialMediaAccountsTable();
  } catch (error: any) {
    console.error("⚠️  Social media accounts table fix failed. Continuing anyway...");
    console.error("Error:", error.message || error);
  }
  
  try {
    // Add offerLink column to clients table if needed
    const { addOfferLinkColumn } = await import("../add-offer-link-column");
    await addOfferLinkColumn();
  } catch (error: any) {
    console.error("⚠️  Adding offer link column failed. Continuing anyway...");
    console.error("Error:", error.message || error);
  }
  
  try {
    // Add currency column to income table if needed
    const { addIncomeCurrencyColumn } = await import("../add-income-currency-column");
    await addIncomeCurrencyColumn();
  } catch (error: any) {
    console.error("⚠️  Adding income currency column failed. Continuing anyway...");
    console.error("Error:", error.message || error);
  }
  
  try {
    // Add next payment columns to clients table if needed
    const { addNextPaymentColumns } = await import("../add-next-payment-columns");
    await addNextPaymentColumns();
    
    const { addPaymentPlansTables } = await import("../add-payment-plans-tables");
    await addPaymentPlansTables();
  } catch (error: any) {
    console.error("⚠️  Adding next payment columns failed. Continuing anyway...");
    console.error("Error:", error.message || error);
  }
  
  try {
    // Seed initial data
    await seedInitialData();
  } catch (error: any) {
    console.error("⚠️  Database seeding failed. Server will start but some features may not work.");
    console.error("Error:", error.message || error);
  }

  try {
    // Seed clipping area data (projects and clips)
    const { seedClippingData } = await import("./seedClippingData");
    await seedClippingData();
  } catch (error: any) {
    console.error("⚠️  Clipping area seeding failed. Continuing anyway...");
    console.error("Error:", error.message || error);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 3002
  // This serves both the API and the client.
  const port = 3002;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
