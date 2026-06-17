-- Fix social_media_accounts table by adding missing columns and fixing conflicts
-- Run this SQL script in your database

-- Step 1: Add platforms column if it doesn't exist
ALTER TABLE social_media_accounts 
ADD COLUMN IF NOT EXISTS platforms TEXT NOT NULL DEFAULT '[]';

-- Step 2: Fix the old 'platform' (singular) column - make it nullable first
ALTER TABLE social_media_accounts 
ALTER COLUMN platform DROP NOT NULL;

-- Step 3: Drop the old 'platform' column since we're using 'platforms' now
ALTER TABLE social_media_accounts 
DROP COLUMN IF EXISTS platform;

-- Step 4: Add account_name column if it doesn't exist (optional field)
ALTER TABLE social_media_accounts 
ADD COLUMN IF NOT EXISTS account_name TEXT;

-- Step 5: Add created_at column if it doesn't exist
ALTER TABLE social_media_accounts 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Step 6: Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'social_media_accounts'
ORDER BY ordinal_position;

