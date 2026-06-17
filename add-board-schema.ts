import { pool } from "./server/db";

export async function addBoardSchema() {
  const client = await pool.connect();
  try {
    // 1. Extend issues table with new columns
    await client.query(`
      ALTER TABLE issues
        ADD COLUMN IF NOT EXISTS priority         TEXT DEFAULT 'no_priority',
        ADD COLUMN IF NOT EXISTS assignee_id      VARCHAR,
        ADD COLUMN IF NOT EXISTS due_date         TIMESTAMP,
        ADD COLUMN IF NOT EXISTS publish_date     TIMESTAMP,
        ADD COLUMN IF NOT EXISTS team_id          VARCHAR,
        ADD COLUMN IF NOT EXISTS creator_id       VARCHAR
    `);
    console.log("[Board Migration] ✓ issues table extended");

    // 2. Create project_statuses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_statuses (
        id          VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id  VARCHAR NOT NULL,
        key         TEXT NOT NULL,
        label       TEXT NOT NULL,
        color       TEXT NOT NULL DEFAULT '#6B7280',
        "order"     INTEGER NOT NULL DEFAULT 0,
        created_at  TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE(project_id, key)
      )
    `);
    console.log("[Board Migration] ✓ project_statuses table ready");

    // 3. Seed default statuses for every project that doesn't already have them
    const defaultStatuses = [
      { key: "backlog",            label: "Backlog",            color: "#F97316", order: 0 },
      { key: "ready_for_editing",  label: "Ready for Editing",  color: "#EAB308", order: 1 },
      { key: "editing",            label: "Editing",            color: "#3B82F6", order: 2 },
      { key: "ready_for_caption",  label: "Ready for Caption",  color: "#8B5CF6", order: 3 },
      { key: "ready_for_upload",   label: "Ready for Upload",   color: "#10B981", order: 4 },
    ];

    const { rows: projects } = await client.query(`SELECT id, status_labels FROM projects`);

    for (const project of projects) {
      // Check if statuses already seeded
      const { rows: existing } = await client.query(
        `SELECT id FROM project_statuses WHERE project_id = $1 LIMIT 1`,
        [project.id]
      );
      if (existing.length > 0) continue; // already seeded

      // Try to parse existing statusLabels JSON for custom labels
      let customLabels: Record<string, string> = {};
      if (project.status_labels) {
        try { customLabels = JSON.parse(project.status_labels); } catch {}
      }

      for (const s of defaultStatuses) {
        const label = customLabels[s.key] || s.label;
        await client.query(
          `INSERT INTO project_statuses (project_id, key, label, color, "order")
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (project_id, key) DO NOTHING`,
          [project.id, s.key, label, s.color, s.order]
        );
      }
    }
    console.log(`[Board Migration] ✓ seeded default statuses for ${projects.length} projects`);

  } finally {
    client.release();
  }
}
