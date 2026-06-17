import { pool } from "./server/db";

export async function addTutorialTables() {
  const client = await pool.connect();
  try {
    // Create tutorial_videos table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tutorial_videos (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        video_url TEXT NOT NULL,
        thumbnail_url TEXT,
        duration_seconds INTEGER,
        "order" INTEGER NOT NULL DEFAULT 0,
        is_published BOOLEAN NOT NULL DEFAULT false,
        is_archived BOOLEAN NOT NULL DEFAULT false,
        target_tiers TEXT,
        target_client_ids TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    console.log("[Tutorial Migration] ✓ tutorial_videos table ready");

    // Create tutorial_progress table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tutorial_progress (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id VARCHAR NOT NULL,
        video_id VARCHAR NOT NULL,
        watch_position_seconds INTEGER DEFAULT 0,
        watch_percentage INTEGER DEFAULT 0,
        is_completed BOOLEAN NOT NULL DEFAULT false,
        completed_at TIMESTAMP,
        last_watched_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE(client_id, video_id)
      )
    `);
    console.log("[Tutorial Migration] ✓ tutorial_progress table ready");
  } finally {
    client.release();
  }
}
