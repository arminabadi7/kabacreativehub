import { db } from "./db";
import { sql } from "drizzle-orm";

export async function migrateTemplateSchema() {
  try {
    console.log("Checking and migrating issue_templates table...");
    
    // Test database connection first
    try {
      await db.execute(sql`SELECT 1`);
    } catch (connError: any) {
      console.error("❌ Cannot connect to database:", connError.message || connError);
      console.error("⚠️  Please check your DATABASE_URL in .env file");
      console.error("⚠️  If using Neon, make sure your database is not paused");
      throw new Error("Database connection failed");
    }
    
    // Check if issue_title column exists, if not add it
    const checkIssueTitle = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'issue_templates' AND column_name = 'issue_title'
    `);
    
    if (!checkIssueTitle || checkIssueTitle.rows.length === 0) {
      console.log("Adding issue_title column...");
      try {
        await db.execute(sql`
          ALTER TABLE issue_templates 
          ADD COLUMN issue_title TEXT NOT NULL DEFAULT ''
        `);
        // Update existing rows
        await db.execute(sql`
          UPDATE issue_templates 
          SET issue_title = name 
          WHERE issue_title = '' OR issue_title IS NULL
        `);
        console.log("✓ Added issue_title column");
      } catch (err: any) {
        // If column already exists or other error, log and continue
        if (err.message && err.message.includes('already exists')) {
          console.log("issue_title column already exists");
        } else {
          console.error("Error adding issue_title:", err.message);
        }
      }
    } else {
      console.log("✓ issue_title column already exists");
    }

    // Check if updated_at column exists
    const checkUpdatedAt = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'issue_templates' AND column_name = 'updated_at'
    `);
    
    if (!checkUpdatedAt || checkUpdatedAt.rows.length === 0) {
      console.log("Adding updated_at column...");
      try {
        await db.execute(sql`
          ALTER TABLE issue_templates 
          ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        `);
        console.log("✓ Added updated_at column");
      } catch (err: any) {
        if (err.message && err.message.includes('already exists')) {
          console.log("updated_at column already exists");
        } else {
          console.error("Error adding updated_at:", err.message);
        }
      }
    } else {
      console.log("✓ updated_at column already exists");
    }

    // Add optional columns
    const checkTeamId = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'issue_templates' AND column_name = 'team_id'
    `);
    if (!checkTeamId || checkTeamId.rows.length === 0) {
      try {
        await db.execute(sql`ALTER TABLE issue_templates ADD COLUMN team_id VARCHAR`);
        console.log("✓ Added team_id column");
      } catch (err: any) {
        if (!err.message?.includes('already exists')) {
          console.error("Error adding team_id:", err.message);
        }
      }
    }

    const checkDefaultStatus = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'issue_templates' AND column_name = 'default_status'
    `);
    if (!checkDefaultStatus || checkDefaultStatus.rows.length === 0) {
      try {
        await db.execute(sql`ALTER TABLE issue_templates ADD COLUMN default_status TEXT DEFAULT 'todo'`);
        console.log("✓ Added default_status column");
      } catch (err: any) {
        if (!err.message?.includes('already exists')) {
          console.error("Error adding default_status:", err.message);
        }
      }
    }

    const checkDefaultPriority = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'issue_templates' AND column_name = 'default_priority'
    `);
    if (!checkDefaultPriority || checkDefaultPriority.rows.length === 0) {
      try {
        await db.execute(sql`ALTER TABLE issue_templates ADD COLUMN default_priority TEXT DEFAULT 'no_priority'`);
        console.log("✓ Added default_priority column");
      } catch (err: any) {
        if (!err.message?.includes('already exists')) {
          console.error("Error adding default_priority:", err.message);
        }
      }
    }

    const checkDefaultAssigneeId = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'issue_templates' AND column_name = 'default_assignee_id'
    `);
    if (!checkDefaultAssigneeId || checkDefaultAssigneeId.rows.length === 0) {
      try {
        await db.execute(sql`ALTER TABLE issue_templates ADD COLUMN default_assignee_id VARCHAR`);
        console.log("✓ Added default_assignee_id column");
      } catch (err: any) {
        if (!err.message?.includes('already exists')) {
          console.error("Error adding default_assignee_id:", err.message);
        }
      }
    }

    const checkDefaultProjectId = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'issue_templates' AND column_name = 'default_project_id'
    `);
    if (!checkDefaultProjectId || checkDefaultProjectId.rows.length === 0) {
      try {
        await db.execute(sql`ALTER TABLE issue_templates ADD COLUMN default_project_id VARCHAR`);
        console.log("✓ Added default_project_id column");
      } catch (err: any) {
        if (!err.message?.includes('already exists')) {
          console.error("Error adding default_project_id:", err.message);
        }
      }
    }

    // Create template_tasks table if it doesn't exist
    const checkTemplateTasks = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'template_tasks'
    `);
    
    if (!checkTemplateTasks || checkTemplateTasks.rows.length === 0) {
      console.log("Creating template_tasks table...");
      try {
        await db.execute(sql`
          CREATE TABLE template_tasks (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            template_id VARCHAR NOT NULL,
            name TEXT NOT NULL,
            points INTEGER DEFAULT 0,
            priority TEXT DEFAULT 'no_priority',
            assigned_to VARCHAR,
            "order" INTEGER DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        console.log("✓ Created template_tasks table");
      } catch (err: any) {
        if (!err.message?.includes('already exists')) {
          console.error("Error creating template_tasks table:", err.message);
        }
      }
    }

    // Create teams table if it doesn't exist
    const checkTeams = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'teams'
    `);
    
    if (!checkTeams || checkTeams.rows.length === 0) {
      console.log("Creating teams table...");
      try {
        await db.execute(sql`
          CREATE TABLE teams (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        console.log("✓ Created teams table");
      } catch (err: any) {
        if (!err.message?.includes('already exists')) {
          console.error("Error creating teams table:", err.message);
        }
      }
    }

    console.log("✓ Template schema migration complete");

    // Check if projects table has client_id column
    const checkClientId = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND column_name = 'client_id'
    `);
    
    if (!checkClientId || checkClientId.rows.length === 0) {
      console.log("Adding client_id column to projects table...");
      try {
        // First add as nullable
        await db.execute(sql`
          ALTER TABLE projects 
          ADD COLUMN client_id VARCHAR
        `);
        
        // Check if there are any existing projects
        const existingProjects = await db.execute(sql`SELECT COUNT(*) as count FROM projects`);
        const count = existingProjects.rows[0]?.count || 0;
        
        // If no existing projects, we can make it NOT NULL
        // Otherwise, we'll leave it nullable for now (existing projects won't have a client)
        if (count === 0) {
          // No existing projects, make it NOT NULL
          await db.execute(sql`
            ALTER TABLE projects 
            ALTER COLUMN client_id SET NOT NULL
          `);
        }
        
        console.log("✓ Added client_id column to projects table");
      } catch (err: any) {
        if (!err.message?.includes('already exists')) {
          console.error("Error adding client_id:", err.message);
        }
      }
    } else {
      console.log("✓ client_id column already exists in projects table");
    }

    // Check if projects table has file_link column
    const checkFileLink = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND column_name = 'file_link'
    `);
    
    if (!checkFileLink || checkFileLink.rows.length === 0) {
      console.log("Adding file_link column to projects table...");
      try {
        await db.execute(sql`
          ALTER TABLE projects 
          ADD COLUMN file_link TEXT
        `);
        console.log("✓ Added file_link column to projects table");
      } catch (err: any) {
        if (!err.message?.includes('already exists')) {
          console.error("Error adding file_link:", err.message);
        }
      }
    } else {
      console.log("✓ file_link column already exists in projects table");
    }

    // Check if issue_templates table has title column (legacy column)
    const checkTitle = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'issue_templates' AND column_name = 'title'
    `);
    
    if (checkTitle && checkTitle.rows.length > 0) {
      // If title column exists, make sure it's populated from issue_title
      console.log("Found legacy title column, ensuring it's populated...");
      try {
        await db.execute(sql`
          UPDATE issue_templates 
          SET title = issue_title 
          WHERE title IS NULL OR title = ''
        `);
        console.log("✓ Updated title column from issue_title");
      } catch (err: any) {
        console.error("Error updating title column:", err.message);
      }
    }

    // Check if clips table has status column
    const checkClipStatus = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'clips' AND column_name = 'status'
    `);
    
    if (!checkClipStatus || checkClipStatus.rows.length === 0) {
      console.log("Adding status column to clips table...");
      try {
        await db.execute(sql`
          ALTER TABLE clips 
          ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'
        `);
        console.log("✓ Added status column to clips table");
      } catch (err: any) {
        if (!err.message?.includes('already exists')) {
          console.error("Error adding status column to clips:", err.message);
        }
      }
    } else {
      console.log("✓ status column already exists in clips table");
    }

    // Check if clips table has invalid_note column
    const checkInvalidNote = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'clips' AND column_name = 'invalid_note'
    `);
    
    if (!checkInvalidNote || checkInvalidNote.rows.length === 0) {
      console.log("Adding invalid_note column to clips table...");
      try {
        await db.execute(sql`
          ALTER TABLE clips 
          ADD COLUMN invalid_note TEXT
        `);
        console.log("✓ Added invalid_note column to clips table");
      } catch (err: any) {
        if (!err.message?.includes('already exists')) {
          console.error("Error adding invalid_note column to clips:", err.message);
        }
      }
    } else {
      console.log("✓ invalid_note column already exists in clips table");
    }

    // Add status_labels column to projects table for custom status labels per project
    const checkStatusLabels = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND column_name = 'status_labels'
    `);
    if (!checkStatusLabels || checkStatusLabels.rows.length === 0) {
      try {
        await db.execute(sql`
          ALTER TABLE projects 
          ADD COLUMN status_labels TEXT
        `);
        console.log("✓ Added status_labels column to projects table");
      } catch (err: any) {
        if (!err.message?.includes('already exists')) {
          console.error("Error adding status_labels to projects:", err.message);
        }
      }
    } else {
      console.log("✓ status_labels column already exists in projects table");
    }

    // Add plain_password columns to store passwords for founder access
    // Members
    const checkMemberPlainPassword = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'members' AND column_name = 'plain_password'
    `);
    if (!checkMemberPlainPassword || checkMemberPlainPassword.rows.length === 0) {
      try {
        await db.execute(sql`
          ALTER TABLE members 
          ADD COLUMN plain_password TEXT
        `);
        console.log("✓ Added plain_password column to members table");
      } catch (err: any) {
        if (!err.message?.includes('already exists')) {
          console.error("Error adding plain_password to members:", err.message);
        }
      }
    }

    // Clients
    const checkClientPlainPassword = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'clients' AND column_name = 'plain_password'
    `);
    if (!checkClientPlainPassword || checkClientPlainPassword.rows.length === 0) {
      try {
        await db.execute(sql`
          ALTER TABLE clients 
          ADD COLUMN plain_password TEXT
        `);
        console.log("✓ Added plain_password column to clients table");
      } catch (err: any) {
        if (!err.message?.includes('already exists')) {
          console.error("Error adding plain_password to clients:", err.message);
        }
      }
    }

    // Affiliates
    const checkAffiliatePlainPassword = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'affiliates' AND column_name = 'plain_password'
    `);
    if (!checkAffiliatePlainPassword || checkAffiliatePlainPassword.rows.length === 0) {
      try {
        await db.execute(sql`
          ALTER TABLE affiliates 
          ADD COLUMN plain_password TEXT
        `);
        console.log("✓ Added plain_password column to affiliates table");
      } catch (err: any) {
        if (!err.message?.includes('already exists')) {
          console.error("Error adding plain_password to affiliates:", err.message);
        }
      }
    }

    // Add issue_id column to tasks table if it doesn't exist
    const checkTaskIssueId = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'issue_id'
    `);
    if (!checkTaskIssueId || checkTaskIssueId.rows.length === 0) {
      try {
        await db.execute(sql`
          ALTER TABLE tasks 
          ADD COLUMN issue_id VARCHAR
        `);
        console.log("✓ Added issue_id column to tasks table");
      } catch (err: any) {
        if (!err.message?.includes('already exists')) {
          console.error("Error adding issue_id to tasks:", err.message);
        }
      }
    } else {
      console.log("✓ issue_id column already exists in tasks table");
    }

    // Make member_id nullable in tasks table (for issue tasks)
    const checkMemberIdNullable = await db.execute(sql`
      SELECT is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'member_id'
    `);
    if (checkMemberIdNullable && checkMemberIdNullable.rows.length > 0) {
      const isNullable = checkMemberIdNullable.rows[0]?.is_nullable === 'YES';
      if (!isNullable) {
        console.log("Making member_id nullable in tasks table...");
        try {
          await db.execute(sql`
            ALTER TABLE tasks 
            ALTER COLUMN member_id DROP NOT NULL
          `);
          console.log("✓ Made member_id nullable in tasks table");
        } catch (err: any) {
          console.error("Error making member_id nullable:", err.message);
        }
      } else {
        console.log("✓ member_id is already nullable in tasks table");
      }
    }

    // Add other optional columns to tasks table if they don't exist
    const taskOptionalColumns = [
      { name: 'name', type: 'TEXT' },
      { name: 'priority', type: 'TEXT DEFAULT \'no_priority\'' },
      { name: 'assigned_to', type: 'VARCHAR' },
      { name: '"order"', type: 'INTEGER DEFAULT 0' },
      { name: 'is_completed', type: 'BOOLEAN DEFAULT false' },
    ];

    for (const col of taskOptionalColumns) {
      const checkCol = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = ${col.name.replace('"', '').replace('"', '')}
      `);
      if (!checkCol || checkCol.rows.length === 0) {
        console.log(`Adding ${col.name} column to tasks table...`);
        try {
          await db.execute(sql.raw(`ALTER TABLE tasks ADD COLUMN ${col.name} ${col.type}`));
          console.log(`✓ Added ${col.name} column to tasks table`);
        } catch (err: any) {
          if (!err.message?.includes('already exists')) {
            console.error(`Error adding ${col.name} to tasks:`, err.message);
          }
        }
      }
    }

    // Make title nullable in tasks table (since we can use name instead)
    const checkTitleNullable = await db.execute(sql`
      SELECT is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'title'
    `);
    if (checkTitleNullable && checkTitleNullable.rows.length > 0) {
      const isNullable = checkTitleNullable.rows[0]?.is_nullable === 'YES';
      if (!isNullable) {
        console.log("Making title nullable in tasks table...");
        try {
          await db.execute(sql`
            ALTER TABLE tasks 
            ALTER COLUMN title DROP NOT NULL
          `);
          console.log("✓ Made title nullable in tasks table");
        } catch (err: any) {
          console.error("Error making title nullable:", err.message);
        }
      }
    }

    // Add team_id column to members table if it doesn't exist
    const checkMemberTeamId = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'members' AND column_name = 'team_id'
    `);
    if (!checkMemberTeamId || checkMemberTeamId.rows.length === 0) {
      try {
        await db.execute(sql`
          ALTER TABLE members 
          ADD COLUMN team_id VARCHAR
        `);
        console.log("✓ Added team_id column to members table");
      } catch (err: any) {
        if (!err.message?.includes('already exists')) {
          console.error("Error adding team_id to members:", err.message);
        }
      }
    } else {
      console.log("✓ team_id column already exists in members table");
    }

    // Ensure clips table has all required columns
    console.log("Checking and migrating clips table structure...");
    
    // Check if clips table exists
    const checkClipsTable = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'clips'
    `);
    
    if (!checkClipsTable || checkClipsTable.rows.length === 0) {
      console.log("Creating clips table...");
      try {
        await db.execute(sql`
          CREATE TABLE clips (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id VARCHAR NOT NULL,
            file_path TEXT,
            clip_number INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            invalid_note TEXT,
            validated_by VARCHAR,
            validated_at TIMESTAMP,
            issue_id VARCHAR,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        console.log("✓ Created clips table");
      } catch (err: any) {
        if (!err.message?.includes('already exists')) {
          console.error("Error creating clips table:", err.message);
        }
      }
    } else {
      // Table exists - ensure all required columns exist
      const columnsToCheck = [
        { name: 'project_id', sql: 'VARCHAR NOT NULL' },
        { name: 'file_path', sql: 'TEXT' },
        { name: 'clip_number', sql: 'INTEGER NOT NULL' },
        { name: 'status', sql: 'TEXT NOT NULL DEFAULT \'pending\'' },
        { name: 'invalid_note', sql: 'TEXT' },
        { name: 'validated_by', sql: 'VARCHAR' },
        { name: 'validated_at', sql: 'TIMESTAMP' },
        { name: 'issue_id', sql: 'VARCHAR' },
        { name: 'created_at', sql: 'TIMESTAMP NOT NULL DEFAULT NOW()' },
      ];
      
      for (const col of columnsToCheck) {
        const checkCol = await db.execute(sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'clips' AND column_name = ${col.name}
        `);
        
        if (!checkCol || checkCol.rows.length === 0) {
          console.log(`Adding ${col.name} column to clips table...`);
          try {
            // Extract just the type without NOT NULL and DEFAULT for ALTER TABLE
            const typeOnly = col.sql.replace(/NOT NULL/g, '').replace(/DEFAULT '[^']*'/g, '').replace(/DEFAULT NOW\(\)/g, '').trim();
            await db.execute(sql.raw(`ALTER TABLE clips ADD COLUMN ${col.name} ${typeOnly}`));
            console.log(`✓ Added ${col.name} column to clips table`);
          } catch (err: any) {
            if (!err.message?.includes('already exists') && !err.message?.includes('duplicate')) {
              console.error(`Error adding ${col.name}:`, err.message);
            }
          }
        }
      }
      
      // Make file_path nullable if it's not already
      const checkFilePath = await db.execute(sql`
        SELECT is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'clips' AND column_name = 'file_path'
      `);
      
      if (checkFilePath && checkFilePath.rows.length > 0) {
        const isNullable = checkFilePath.rows[0]?.is_nullable === 'YES';
        if (!isNullable) {
          console.log("Making file_path column nullable...");
          try {
            await db.execute(sql`ALTER TABLE clips ALTER COLUMN file_path DROP NOT NULL`);
            console.log("✓ Made file_path nullable");
          } catch (err: any) {
            console.error("Error making file_path nullable:", err.message);
          }
        }
      }
      
      console.log("✓ Clips table structure verified");
    }
    
    // Check and add other optional columns
    const optionalColumns = [
      { name: 'invalid_note', type: 'TEXT' },
      { name: 'validated_by', type: 'VARCHAR' },
      { name: 'validated_at', type: 'TIMESTAMP' },
      { name: 'issue_id', type: 'VARCHAR' },
    ];
    
    for (const col of optionalColumns) {
      const checkCol = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'clips' AND column_name = ${col.name}
      `);
      if (!checkCol || checkCol.rows.length === 0) {
        console.log(`Adding ${col.name} column to clips table...`);
        try {
          await db.execute(sql.raw(`
            ALTER TABLE clips 
            ADD COLUMN ${col.name} ${col.type}
          `));
          console.log(`✓ Added ${col.name} column to clips table`);
        } catch (err: any) {
          if (!err.message?.includes('already exists')) {
            console.error(`Error adding ${col.name} column:`, err.message);
          }
        }
      }
    }
    
    console.log("✓ Clips table migration complete");
  } catch (error: any) {
    console.error("Error migrating template schema:", error);
    // Don't throw - allow server to start even if migration fails
  }
}

