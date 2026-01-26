-- Migration: Add assignee column to activities table
-- Run this in Supabase SQL Editor

ALTER TABLE activities
ADD COLUMN IF NOT EXISTS assignee TEXT;

-- Optional: Add index for filtering by assignee
CREATE INDEX IF NOT EXISTS idx_activities_assignee ON activities(assignee);

-- Verify the column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'activities';
