/**
 * board-routes.ts
 * New API routes for the Project Boards system.
 * Handles: project statuses CRUD, issue field extensions, board data fetching.
 */
import type { Express, Request, Response, NextFunction } from "express";
import { pool } from "./db";
import { z } from "zod";
import { hasPermission, isAdminRole, PERMISSIONS } from "@shared/permissions";

// ─── Auth helpers ─────────────────────────────────────────────────────────────
function requireMember(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.memberId && !req.session?.isFounder) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

interface BoardActor { memberId: string | null; role: string | null; isFounder: boolean; }

/** Resolve the current actor (member account or founder env-bypass) via pool. */
async function resolveBoardActor(req: Request): Promise<BoardActor | null> {
  if (req.session?.memberId) {
    const { rows } = await pool.query(`SELECT id, role FROM members WHERE id = $1`, [req.session.memberId]);
    if (rows[0]) {
      return { memberId: rows[0].id, role: rows[0].role, isFounder: isAdminRole(rows[0].role) || !!req.session?.isFounder };
    }
  }
  if (req.session?.isFounder) return { memberId: null, role: "founder", isFounder: true };
  return null;
}

/** Full edit rights over an issue row (matches routes.ts canEditIssueRow). */
function boardCanEditIssue(actor: BoardActor, issueRow: { creator_id?: string | null }): boolean {
  if (hasPermission(actor.role, PERMISSIONS.EDIT_ANY_ISSUE, actor.isFounder)) return true;
  const creator = issueRow.creator_id ?? null;
  if (hasPermission(actor.role, PERMISSIONS.EDIT_OWN_ISSUE, actor.isFounder) && creator && actor.memberId && creator === actor.memberId) {
    return true;
  }
  return false;
}

// ─── Validation schemas ───────────────────────────────────────────────────────
const createStatusSchema = z.object({
  key:   z.string().min(1).regex(/^[a-z0-9_]+$/, "Key must be lowercase letters, numbers or underscores"),
  label: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6B7280"),
  order: z.number().int().default(0),
});

const updateStatusSchema = z.object({
  label: z.string().min(1).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  order: z.number().int().optional(),
});

const reorderStatusesSchema = z.object({
  // Array of { id, order } pairs
  statuses: z.array(z.object({ id: z.string(), order: z.number().int() })),
});

const updateIssueExtendedSchema = z.object({
  priority:     z.enum(["no_priority", "low", "medium", "high", "urgent"]).optional(),
  assigneeId:   z.string().nullable().optional(),
  dueDate:      z.string().nullable().optional(),
  publishDate:  z.string().nullable().optional(),
  teamId:       z.string().nullable().optional(),
});

export function registerBoardRoutes(app: Express) {

  // ─────────────────────────────────────────────────────────────────────────────
  // PROJECT STATUSES
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * GET /api/projects/:projectId/statuses
   * Returns ordered statuses for a project.
   * If none exist yet, seeds defaults and returns them.
   */
  app.get("/api/projects/:projectId/statuses", requireMember, async (req, res) => {
    const { projectId } = req.params;
    const client = await pool.connect();
    try {
      let { rows } = await client.query(
        `SELECT * FROM project_statuses WHERE project_id = $1 ORDER BY "order" ASC`,
        [projectId]
      );

      // Auto-seed if empty (project was created before the migration)
      if (rows.length === 0) {
        const defaults = [
          { key: "backlog",           label: "Backlog",           color: "#F97316", order: 0 },
          { key: "ready_for_editing", label: "Ready for Editing", color: "#EAB308", order: 1 },
          { key: "editing",           label: "Editing",           color: "#3B82F6", order: 2 },
          { key: "ready_for_caption", label: "Ready for Caption", color: "#8B5CF6", order: 3 },
          { key: "ready_for_upload",  label: "Ready for Upload",  color: "#10B981", order: 4 },
        ];

        // Also try to pull any custom labels from the old statusLabels JSON on projects
        const { rows: projectRows } = await client.query(
          `SELECT status_labels FROM projects WHERE id = $1`,
          [projectId]
        );
        let customLabels: Record<string, string> = {};
        if (projectRows[0]?.status_labels) {
          try { customLabels = JSON.parse(projectRows[0].status_labels); } catch {}
        }

        for (const s of defaults) {
          await client.query(
            `INSERT INTO project_statuses (project_id, key, label, color, "order")
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (project_id, key) DO NOTHING`,
            [projectId, s.key, customLabels[s.key] ?? s.label, s.color, s.order]
          );
        }

        const result = await client.query(
          `SELECT * FROM project_statuses WHERE project_id = $1 ORDER BY "order" ASC`,
          [projectId]
        );
        rows = result.rows;
      }

      return res.json(rows);
    } catch (err: any) {
      console.error("[BoardRoutes] GET statuses error:", err);
      return res.status(500).json({ error: "Failed to fetch statuses" });
    } finally {
      client.release();
    }
  });

  /**
   * POST /api/projects/:projectId/statuses
   * Add a new status column.
   */
  app.post("/api/projects/:projectId/statuses", requireMember, async (req, res) => {
    const { projectId } = req.params;
    const parsed = createStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }
    const { key, label, color, order } = parsed.data;

    const client = await pool.connect();
    try {
      // Get max order if not supplied
      const { rows: maxRows } = await client.query(
        `SELECT COALESCE(MAX("order"), -1) + 1 AS next_order FROM project_statuses WHERE project_id = $1`,
        [projectId]
      );
      const nextOrder = order ?? maxRows[0].next_order;

      const { rows } = await client.query(
        `INSERT INTO project_statuses (project_id, key, label, color, "order")
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (project_id, key) DO UPDATE SET label = EXCLUDED.label, color = EXCLUDED.color
         RETURNING *`,
        [projectId, key, label, color, nextOrder]
      );
      return res.json(rows[0]);
    } catch (err: any) {
      if (err.code === "23505") {
        return res.status(409).json({ error: `Status key "${key}" already exists for this project` });
      }
      console.error("[BoardRoutes] POST status error:", err);
      return res.status(500).json({ error: "Failed to create status" });
    } finally {
      client.release();
    }
  });

  /**
   * PATCH /api/projects/:projectId/statuses/:statusId
   * Edit label and/or color.
   */
  app.patch("/api/projects/:projectId/statuses/:statusId", requireMember, async (req, res) => {
    const { projectId, statusId } = req.params;
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const updates = parsed.data;
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const client = await pool.connect();
    try {
      const setClauses: string[] = [];
      const values: any[] = [projectId, statusId];
      let idx = 3;
      if (updates.label !== undefined)  { setClauses.push(`label = $${idx++}`);  values.push(updates.label); }
      if (updates.color !== undefined)  { setClauses.push(`color = $${idx++}`);  values.push(updates.color); }
      if (updates.order !== undefined)  { setClauses.push(`"order" = $${idx++}`); values.push(updates.order); }

      const { rows } = await client.query(
        `UPDATE project_statuses SET ${setClauses.join(", ")}
         WHERE project_id = $1 AND id = $2
         RETURNING *`,
        values
      );
      if (!rows[0]) return res.status(404).json({ error: "Status not found" });
      return res.json(rows[0]);
    } catch (err: any) {
      console.error("[BoardRoutes] PATCH status error:", err);
      return res.status(500).json({ error: "Failed to update status" });
    } finally {
      client.release();
    }
  });

  /**
   * DELETE /api/projects/:projectId/statuses/:statusId
   * Delete a status. Refuses if issues still use that status key.
   */
  app.delete("/api/projects/:projectId/statuses/:statusId", requireMember, async (req, res) => {
    const { projectId, statusId } = req.params;
    const client = await pool.connect();
    try {
      // Get the status key first
      const { rows: statusRows } = await client.query(
        `SELECT key FROM project_statuses WHERE id = $1 AND project_id = $2`,
        [statusId, projectId]
      );
      if (!statusRows[0]) return res.status(404).json({ error: "Status not found" });
      const key = statusRows[0].key;

      // Check if any issues use this status
      const { rows: issueRows } = await client.query(
        `SELECT COUNT(*) AS cnt FROM issues WHERE project_id = $1 AND status = $2`,
        [projectId, key]
      );
      if (parseInt(issueRows[0].cnt) > 0) {
        return res.status(409).json({
          error: `Cannot delete: ${issueRows[0].cnt} issue(s) are still in "${key}". Move them first.`,
        });
      }

      await client.query(
        `DELETE FROM project_statuses WHERE id = $1 AND project_id = $2`,
        [statusId, projectId]
      );
      return res.json({ success: true });
    } catch (err: any) {
      console.error("[BoardRoutes] DELETE status error:", err);
      return res.status(500).json({ error: "Failed to delete status" });
    } finally {
      client.release();
    }
  });

  /**
   * PUT /api/projects/:projectId/statuses/reorder
   * Bulk-reorder statuses.  Body: { statuses: [{ id, order }] }
   */
  app.put("/api/projects/:projectId/statuses/reorder", requireMember, async (req, res) => {
    const { projectId } = req.params;
    const parsed = reorderStatusesSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const client = await pool.connect();
    try {
      for (const { id, order } of parsed.data.statuses) {
        await client.query(
          `UPDATE project_statuses SET "order" = $1 WHERE id = $2 AND project_id = $3`,
          [order, id, projectId]
        );
      }
      const { rows } = await client.query(
        `SELECT * FROM project_statuses WHERE project_id = $1 ORDER BY "order" ASC`,
        [projectId]
      );
      return res.json(rows);
    } catch (err: any) {
      console.error("[BoardRoutes] reorder statuses error:", err);
      return res.status(500).json({ error: "Failed to reorder statuses" });
    } finally {
      client.release();
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // ISSUE EXTENDED FIELDS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * PATCH /api/board/issues/:issueId
   * Update priority, assigneeId, dueDate, publishDate, teamId.
   * Complementary to the existing PATCH /api/issues/:issueId (which handles status/order).
   */
  app.patch("/api/board/issues/:issueId", requireMember, async (req, res) => {
    const { issueId } = req.params;
    const parsed = updateIssueExtendedSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const updates = parsed.data;
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    // ── Phase 4 enforcement: only those who can edit the issue may change its fields ──
    const actor = await resolveBoardActor(req);
    if (!actor) return res.status(401).json({ error: "Authentication required" });
    const ownerCheck = await pool.query(`SELECT creator_id FROM issues WHERE id = $1`, [issueId]);
    if (!ownerCheck.rows[0]) return res.status(404).json({ error: "Issue not found" });
    if (!boardCanEditIssue(actor, ownerCheck.rows[0])) {
      return res.status(403).json({ error: "You can only edit issues you created" });
    }

    const client = await pool.connect();
    try {
      const setClauses: string[] = [];
      const values: any[] = [issueId];
      let idx = 2;
      if (updates.priority    !== undefined) { setClauses.push(`priority = $${idx++}`);     values.push(updates.priority); }
      if (updates.assigneeId  !== undefined) { setClauses.push(`assignee_id = $${idx++}`);  values.push(updates.assigneeId); }
      if (updates.dueDate     !== undefined) { setClauses.push(`due_date = $${idx++}`);     values.push(updates.dueDate); }
      if (updates.publishDate !== undefined) { setClauses.push(`publish_date = $${idx++}`); values.push(updates.publishDate); }
      if (updates.teamId      !== undefined) { setClauses.push(`team_id = $${idx++}`);      values.push(updates.teamId); }

      const { rows } = await client.query(
        `UPDATE issues SET ${setClauses.join(", ")} WHERE id = $1 RETURNING *`,
        values
      );
      if (!rows[0]) return res.status(404).json({ error: "Issue not found" });
      return res.json(rows[0]);
    } catch (err: any) {
      console.error("[BoardRoutes] PATCH issue extended error:", err);
      return res.status(500).json({ error: "Failed to update issue" });
    } finally {
      client.release();
    }
  });

  /**
   * GET /api/board/projects
   * Returns all projects enriched with their client name (for sidebar display).
   */
  app.get("/api/board/projects", requireMember, async (req, res) => {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT p.id, p.name, p.description,
               p.client_id AS "clientId", p.team_id AS "teamId", p.file_link AS "fileLink",
               c.username AS "clientUsername", c.full_name AS "clientFullName",
               t.name AS "teamName"
        FROM projects p
        LEFT JOIN clients c ON c.id = p.client_id
        LEFT JOIN teams t   ON t.id = p.team_id
        ORDER BY t.name ASC NULLS LAST, p.name ASC
      `);
      return res.json(rows);
    } catch (err: any) {
      console.error("[BoardRoutes] GET board projects error:", err);
      return res.status(500).json({ error: "Failed to fetch projects" });
    } finally {
      client.release();
    }
  });

  /**
   * GET /api/board/projects/:projectId/issues
   * Like the existing endpoint but also returns the extended fields and
   * resolves each issue's tasks from the tasks table (not JSONB).
   */
  app.get("/api/board/projects/:projectId/issues", requireMember, async (req, res) => {
    const { projectId } = req.params;
    const client = await pool.connect();
    try {
      // Fetch issues (members table has no profile_picture column)
      const { rows: issueRows } = await client.query(`
        SELECT i.*,
               m.full_name  AS assignee_name,
               m.username   AS assignee_username,
               cr.full_name AS creator_name
        FROM issues i
        LEFT JOIN members m  ON m.id = i.assignee_id
        LEFT JOIN members cr ON cr.id = i.creator_id
        WHERE i.project_id = $1
        ORDER BY i."order" ASC, i.created_at ASC
      `, [projectId]);

      if (issueRows.length === 0) return res.json([]);

      // Fetch all tasks for these issues in one query
      const issueIds = issueRows.map((r: any) => r.id);
      const { rows: taskRows } = await client.query(`
        SELECT t.*,
               m.full_name AS member_full_name,
               m.username  AS member_username
        FROM tasks t
        LEFT JOIN members m ON m.id = t.assigned_to
        WHERE t.issue_id = ANY($1::varchar[])
        ORDER BY t."order" ASC, t.created_at ASC
      `, [issueIds]);

      // Map tasks onto their issues
      const tasksByIssue: Record<string, any[]> = {};
      for (const task of taskRows) {
        if (!tasksByIssue[task.issue_id]) tasksByIssue[task.issue_id] = [];
        tasksByIssue[task.issue_id].push(task);
      }

      const issues = issueRows.map((issue: any) => {
        // Prefer tasks-table rows; fall back to JSONB column (may be string or array)
        let fallbackTasks: any[] = [];
        if (issue.tasks) {
          if (Array.isArray(issue.tasks)) {
            fallbackTasks = issue.tasks;
          } else if (typeof issue.tasks === "string") {
            try { fallbackTasks = JSON.parse(issue.tasks); } catch {}
          }
        }
        return {
          ...issue,
          createdAt: issue.created_at,
          creatorId: issue.creator_id ?? null,
          assigneeId: issue.assignee_id ?? null,
          tasks: tasksByIssue[issue.id] ?? fallbackTasks,
        };
      });

      return res.json(issues);
    } catch (err: any) {
      console.error("[BoardRoutes] GET board issues error:", err);
      return res.status(500).json({ error: "Failed to fetch issues" });
    } finally {
      client.release();
    }
  });
}
