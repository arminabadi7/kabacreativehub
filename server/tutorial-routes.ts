import type { Express, Request, Response } from "express";
import { db } from "./db";
import { tutorialVideos, tutorialProgress } from "@shared/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage as appStorage } from "./storage";
import { isAdminRole } from "@shared/permissions";

// ─── Multer for thumbnail uploads ────────────────────────────────────────────
const thumbnailStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), "uploads", "tutorial-thumbnails");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `thumb-${suffix}${path.extname(file.originalname)}`);
  },
});

const thumbnailUpload = multer({
  storage: thumbnailStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Only PNG, JPG, and WebP images are allowed"));
  },
});

// ─── Auth guards ─────────────────────────────────────────────────────────────
function requireClientAuth(req: Request, res: Response, next: () => void) {
  if (!req.session?.clientId) {
    return res.status(401).json({ error: "Client authentication required" });
  }
  next();
}

function requireFounderAuth(req: Request, res: Response, next: () => void) {
  // Allow password-based founder session
  if (req.session?.isFounder) return next();
  // Allow member accounts with admin/founder roles
  if (req.session?.role && isAdminRole(req.session.role)) return next();
  // Fall back to DB role check when session role isn't populated yet
  if (req.session?.memberId) {
    appStorage.getMember(req.session.memberId).then((member) => {
      if (member && isAdminRole(member.role)) return next();
      return res.status(401).json({ error: "Founder authentication required" });
    }).catch(() => res.status(401).json({ error: "Founder authentication required" }));
    return;
  }
  return res.status(401).json({ error: "Founder authentication required" });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns true if this video targets the given client (tier + id checks). */
function videoTargetsClient(
  video: { targetTiers: string | null; targetClientIds: string | null },
  clientId: string,
  clientTier: string | null
): boolean {
  // Check specific client list
  if (video.targetClientIds) {
    try {
      const ids: string[] = JSON.parse(video.targetClientIds);
      if (ids.length > 0 && !ids.includes(clientId)) return false;
    } catch {
      // malformed JSON — treat as "all"
    }
  }

  // Check tier list
  if (video.targetTiers) {
    try {
      const tiers: string[] = JSON.parse(video.targetTiers);
      if (tiers.length > 0 && clientTier && !tiers.includes(clientTier)) return false;
    } catch {
      // malformed JSON — treat as "all"
    }
  }

  return true;
}

/** Format seconds to "m:ss" display string. */
function formatDuration(seconds: number | null): string | null {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Route registration ───────────────────────────────────────────────────────
export function registerTutorialRoutes(app: Express) {

  // ═══════════════════════════════════════════════════════════════════════════
  // CLIENT-FACING ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/tutorials
   * Returns all published tutorials visible to the logged-in client,
   * with their individual progress merged in.
   */
  app.get("/api/tutorials", requireClientAuth, async (req, res) => {
    try {
      const clientId = req.session.clientId!;

      // Fetch client tier for targeting
      const tierResult = await db.execute(
        sql`SELECT tier FROM clients WHERE id = ${clientId} LIMIT 1`
      ) as any;
      // db.execute with Neon serverless returns { rows: [...] }
      const tierRows = tierResult?.rows ?? tierResult ?? [];
      const clientTier: string | null = (Array.isArray(tierRows) ? tierRows[0] : tierRows)?.tier ?? null;

      // Fetch all published, non-archived videos in order
      const videos = await db
        .select()
        .from(tutorialVideos)
        .where(
          and(
            eq(tutorialVideos.isPublished, true),
            eq(tutorialVideos.isArchived, false)
          )
        )
        .orderBy(asc(tutorialVideos.order));

      // Filter by targeting
      const visible = videos.filter((v) =>
        videoTargetsClient(v, clientId, clientTier)
      );

      if (visible.length === 0) return res.json([]);

      // Fetch all progress rows for this client in one query
      const progressRows = await db
        .select()
        .from(tutorialProgress)
        .where(eq(tutorialProgress.clientId, clientId));

      const progressMap = new Map(progressRows.map((p) => [p.videoId, p]));

      const result = visible.map((v) => {
        const prog = progressMap.get(v.id) ?? null;
        return {
          id: v.id,
          title: v.title,
          description: v.description,
          videoUrl: v.videoUrl,
          thumbnailUrl: v.thumbnailUrl,
          durationSeconds: v.durationSeconds,
          durationFormatted: formatDuration(v.durationSeconds),
          order: v.order,
          progress: prog
            ? {
                watchPercentage: prog.watchPercentage ?? 0,
                watchPositionSeconds: prog.watchPositionSeconds ?? 0,
                isCompleted: prog.isCompleted,
                completedAt: prog.completedAt,
                lastWatchedAt: prog.lastWatchedAt,
              }
            : {
                watchPercentage: 0,
                watchPositionSeconds: 0,
                isCompleted: false,
                completedAt: null,
                lastWatchedAt: null,
              },
        };
      });

      return res.json(result);
    } catch (err: any) {
      console.error("[Tutorials] GET /api/tutorials error:", err);
      return res.status(500).json({ error: "Failed to fetch tutorials" });
    }
  });

  /**
   * PUT /api/tutorials/:videoId/progress
   * Upsert watch position + percentage (debounced saves from the player).
   * Uses high-watermark: watchPercentage only ever increases.
   */
  app.put("/api/tutorials/:videoId/progress", requireClientAuth, async (req, res) => {
    try {
      const clientId = req.session.clientId!;
      const { videoId } = req.params;

      const body = z
        .object({
          watchPositionSeconds: z.number().int().min(0),
          watchPercentage: z.number().int().min(0).max(100),
        })
        .parse(req.body);

      await db.execute(sql`
        INSERT INTO tutorial_progress
          (id, client_id, video_id, watch_position_seconds, watch_percentage, last_watched_at)
        VALUES
          (gen_random_uuid(), ${clientId}, ${videoId},
           ${body.watchPositionSeconds}, ${body.watchPercentage}, now())
        ON CONFLICT (client_id, video_id) DO UPDATE SET
          watch_position_seconds = tutorial_progress.watch_position_seconds,
          watch_percentage       = GREATEST(tutorial_progress.watch_percentage, EXCLUDED.watch_percentage),
          last_watched_at        = now()
      `);

      return res.json({ success: true });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      console.error("[Tutorials] PUT progress error:", err);
      return res.status(500).json({ error: "Failed to save progress" });
    }
  });

  /**
   * POST /api/tutorials/:videoId/complete
   * Mark a video as complete (manual button or auto-complete at 90%).
   */
  app.post("/api/tutorials/:videoId/complete", requireClientAuth, async (req, res) => {
    try {
      const clientId = req.session.clientId!;
      const { videoId } = req.params;

      await db.execute(sql`
        INSERT INTO tutorial_progress
          (id, client_id, video_id, watch_percentage, is_completed, completed_at, last_watched_at)
        VALUES
          (gen_random_uuid(), ${clientId}, ${videoId}, 100, true, now(), now())
        ON CONFLICT (client_id, video_id) DO UPDATE SET
          is_completed  = true,
          completed_at  = COALESCE(tutorial_progress.completed_at, now()),
          watch_percentage = 100,
          last_watched_at  = now()
      `);

      return res.json({ success: true });
    } catch (err: any) {
      console.error("[Tutorials] POST complete error:", err);
      return res.status(500).json({ error: "Failed to mark complete" });
    }
  });

  /**
   * DELETE /api/tutorials/:videoId/complete
   * Unmark complete — lets client rewatch from scratch.
   */
  app.delete("/api/tutorials/:videoId/complete", requireClientAuth, async (req, res) => {
    try {
      const clientId = req.session.clientId!;
      const { videoId } = req.params;

      await db.execute(sql`
        UPDATE tutorial_progress
        SET is_completed = false, completed_at = null, watch_percentage = 0, watch_position_seconds = 0
        WHERE client_id = ${clientId} AND video_id = ${videoId}
      `);

      return res.json({ success: true });
    } catch (err: any) {
      console.error("[Tutorials] DELETE complete error:", err);
      return res.status(500).json({ error: "Failed to unmark complete" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FOUNDER / ADMIN ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/founder/tutorials
   * List ALL tutorials (including unpublished + archived) for admin management.
   */
  app.get("/api/founder/tutorials", requireFounderAuth, async (req, res) => {
    try {
      const videos = await db
        .select()
        .from(tutorialVideos)
        .orderBy(asc(tutorialVideos.order));

      return res.json(
        videos.map((v) => ({
          ...v,
          durationFormatted: formatDuration(v.durationSeconds),
        }))
      );
    } catch (err: any) {
      console.error("[Tutorials] GET founder/tutorials error:", err);
      return res.status(500).json({ error: "Failed to fetch tutorials" });
    }
  });

  /**
   * POST /api/founder/tutorials
   * Create a new tutorial video.
   */
  app.post("/api/founder/tutorials", requireFounderAuth, async (req, res) => {
    try {
      const body = z
        .object({
          title: z.string().min(1, "Title is required"),
          description: z.string().nullable().optional(),
          videoUrl: z.string().url("Must be a valid URL"),
          thumbnailUrl: z.string().nullable().optional(),
          durationSeconds: z.number().int().positive().nullable().optional(),
          order: z.number().int().min(0).optional(),
          isPublished: z.boolean().optional(),
          targetTiers: z.string().nullable().optional(),
          targetClientIds: z.string().nullable().optional(),
        })
        .parse(req.body);

      // Default order to end of list
      let order = body.order;
      if (order === undefined) {
        const [last] = await db
          .select({ maxOrder: sql<number>`COALESCE(MAX("order"), -1)` })
          .from(tutorialVideos);
        order = (last?.maxOrder ?? -1) + 1;
      }

      const [video] = await db
        .insert(tutorialVideos)
        .values({
          title: body.title,
          description: body.description ?? null,
          videoUrl: body.videoUrl,
          thumbnailUrl: body.thumbnailUrl ?? null,
          durationSeconds: body.durationSeconds ?? null,
          order,
          isPublished: body.isPublished ?? false,
          isArchived: false,
          targetTiers: body.targetTiers ?? null,
          targetClientIds: body.targetClientIds ?? null,
        })
        .returning();

      return res.status(201).json({ ...video, durationFormatted: formatDuration(video.durationSeconds) });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      console.error("[Tutorials] POST founder/tutorials error:", err);
      return res.status(500).json({ error: "Failed to create tutorial" });
    }
  });

  /**
   * PUT /api/founder/tutorials/reorder
   * Bulk update the `order` field. Body: [{ id, order }, ...]
   * MUST be registered before /:id to prevent "reorder" matching as an id.
   */
  app.put("/api/founder/tutorials/reorder", requireFounderAuth, async (req, res) => {
    try {
      const items = z
        .array(z.object({ id: z.string(), order: z.number().int().min(0) }))
        .min(1)
        .parse(req.body);

      for (const item of items) {
        await db
          .update(tutorialVideos)
          .set({ order: item.order, updatedAt: new Date() })
          .where(eq(tutorialVideos.id, item.id));
      }

      return res.json({ success: true });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      console.error("[Tutorials] PUT reorder error:", err);
      return res.status(500).json({ error: "Failed to reorder tutorials" });
    }
  });

  /**
   * PUT /api/founder/tutorials/:id
   * Update tutorial metadata.
   */
  app.put("/api/founder/tutorials/:id", requireFounderAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const body = z
        .object({
          title: z.string().min(1).optional(),
          description: z.string().nullable().optional(),
          videoUrl: z.string().url().optional(),
          thumbnailUrl: z.string().nullable().optional(),
          durationSeconds: z.number().int().positive().nullable().optional(),
          order: z.number().int().min(0).nullable().optional(),
          isPublished: z.boolean().optional(),
          isArchived: z.boolean().optional(),
          targetTiers: z.string().nullable().optional(),
          targetClientIds: z.string().nullable().optional(),
        })
        .parse(req.body);

      const [video] = await db
        .update(tutorialVideos)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(tutorialVideos.id, id))
        .returning();

      if (!video) return res.status(404).json({ error: "Tutorial not found" });

      return res.json({ ...video, durationFormatted: formatDuration(video.durationSeconds) });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      console.error("[Tutorials] PUT founder/tutorials/:id error:", err);
      return res.status(500).json({ error: "Failed to update tutorial" });
    }
  });

  /**
   * DELETE /api/founder/tutorials/:id
   * Soft-delete (archive) a tutorial.
   */
  app.delete("/api/founder/tutorials/:id", requireFounderAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const [video] = await db
        .update(tutorialVideos)
        .set({ isArchived: true, isPublished: false, updatedAt: new Date() })
        .where(eq(tutorialVideos.id, id))
        .returning();

      if (!video) return res.status(404).json({ error: "Tutorial not found" });

      return res.json({ success: true });
    } catch (err: any) {
      console.error("[Tutorials] DELETE founder/tutorials/:id error:", err);
      return res.status(500).json({ error: "Failed to archive tutorial" });
    }
  });

  /**
   * POST /api/founder/tutorials/:id/thumbnail
   * Upload a custom thumbnail image (multipart/form-data, field name: "thumbnail").
   */
  app.post(
    "/api/founder/tutorials/:id/thumbnail",
    requireFounderAuth,
    thumbnailUpload.single("thumbnail"),
    async (req, res) => {
      try {
        const { id } = req.params;
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const url = `/uploads/tutorial-thumbnails/${req.file.filename}`;

        const [video] = await db
          .update(tutorialVideos)
          .set({ thumbnailUrl: url, updatedAt: new Date() })
          .where(eq(tutorialVideos.id, id))
          .returning();

        if (!video) return res.status(404).json({ error: "Tutorial not found" });

        return res.json({ thumbnailUrl: url });
      } catch (err: any) {
        console.error("[Tutorials] POST thumbnail error:", err);
        return res.status(500).json({ error: "Failed to upload thumbnail" });
      }
    }
  );

  /**
   * GET /api/founder/tutorials/:id/stats
   * Per-video completion stats across all clients.
   */
  app.get("/api/founder/tutorials/:id/stats", requireFounderAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const rows = await db.execute(sql`
        SELECT
          COUNT(*)                                          AS total_clients,
          COUNT(*) FILTER (WHERE is_completed = true)      AS completed,
          COUNT(*) FILTER (WHERE watch_percentage > 0
                           AND is_completed = false)       AS in_progress,
          COUNT(*) FILTER (WHERE watch_percentage = 0)     AS not_started,
          ROUND(AVG(watch_percentage), 1)                  AS avg_percentage
        FROM tutorial_progress
        WHERE video_id = ${id}
      `);

      return res.json((rows as any[])[0] ?? {
        total_clients: 0,
        completed: 0,
        in_progress: 0,
        not_started: 0,
        avg_percentage: 0,
      });
    } catch (err: any) {
      console.error("[Tutorials] GET stats error:", err);
      return res.status(500).json({ error: "Failed to fetch stats" });
    }
  });
}
