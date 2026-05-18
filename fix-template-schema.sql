-- Add missing columns to issue_templates table
-- Run this SQL directly in your database if db:push doesn't work

-- Add issue_title column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'issue_templates' AND column_name = 'issue_title') THEN
        ALTER TABLE issue_templates ADD COLUMN issue_title TEXT NOT NULL DEFAULT '';
        -- Update existing rows to use name as issue_title
        UPDATE issue_templates SET issue_title = name WHERE issue_title = '';
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'issue_templates' AND column_name = 'updated_at') THEN
        ALTER TABLE issue_templates ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW();
    END IF;
END $$;

-- Add optional columns (nullable)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'issue_templates' AND column_name = 'team_id') THEN
        ALTER TABLE issue_templates ADD COLUMN team_id VARCHAR;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'issue_templates' AND column_name = 'default_status') THEN
        ALTER TABLE issue_templates ADD COLUMN default_status TEXT DEFAULT 'todo';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'issue_templates' AND column_name = 'default_priority') THEN
        ALTER TABLE issue_templates ADD COLUMN default_priority TEXT DEFAULT 'no_priority';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'issue_templates' AND column_name = 'default_assignee_id') THEN
        ALTER TABLE issue_templates ADD COLUMN default_assignee_id VARCHAR;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'issue_templates' AND column_name = 'default_project_id') THEN
        ALTER TABLE issue_templates ADD COLUMN default_project_id VARCHAR;
    END IF;
END $$;

-- Create template_tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS template_tasks (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id VARCHAR NOT NULL,
    name TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    priority TEXT DEFAULT 'no_priority',
    assigned_to VARCHAR,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create teams table if it doesn't exist
CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);


