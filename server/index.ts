import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedInitialData } from "./seedData";
import { migrateTemplateSchema, migrateIssuesTasksColumn } from "./migrate";
import path from "path";
import { fileURLToPath } from "url";

// Get directory name for ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const app = express();

// Trust proxy for production (required for secure cookies behind reverse proxy like Replit)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

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
    sameSite: 'lax', // Required for mobile browsers to properly handle session cookies
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
  console.log("🚀 Starting server...");
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Port: ${process.env.PORT || 5000}`);
  
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
  
  // Run optional migrations - these are non-critical and won't block server startup
  const migrations = [
    { path: "../fix-social-media-table", name: "social media accounts" },
    { path: "../add-offer-link-column", name: "offer link" },
    { path: "../add-google-drive-link-column", name: "google drive link" },
    { path: "../add-income-currency-column", name: "income currency" },
    { path: "../add-next-payment-columns", name: "next payment" },
    { path: "../add-payment-plans-tables", name: "payment plans" },
    { path: "../add-tutorial-tables", name: "tutorial tables" },
    { path: "../add-board-schema", name: "board schema (project_statuses + issue fields)" },
  ];

  for (const migration of migrations) {
    try {
      const module = await import(migration.path);
      const exports = Object.keys(module);
      for (const exportName of exports) {
        if (typeof module[exportName] === 'function') {
          await module[exportName]();
          console.log(`✓ Migration "${migration.name}" completed`);
          break;
        }
      }
    } catch (error: any) {
      // Silently continue - migrations are optional
    }
  }
  
  try {
    // Seed initial data
    await seedInitialData();
  } catch (error: any) {
    console.error("⚠️  Database seeding failed. Server will start but some features may not work.");
    console.error("Error:", error.message || error);
  }

  try {
    // Ensure a real founder member account exists (env-password bypass stays as backup)
    const { ensureFounderAccount } = await import("./seedFounder");
    await ensureFounderAccount();
  } catch (error: any) {
    console.error("⚠️  Founder account seeding failed. Env-password login still works.");
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

    console.error("Request error:", err);
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000 - other ports are firewalled on Replit
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`✓ Server started successfully on port ${port}`);
  });

  // Handle server errors
  server.on('error', (error: any) => {
    console.error('❌ Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Please use a different port.`);
    }
  });
})().catch((error) => {
  console.error('❌ Fatal error during server startup:', error);
  console.error('Error stack:', error.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  if (reason instanceof Error) {
    console.error('Error stack:', reason.stack);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Error stack:', error.stack);
});
