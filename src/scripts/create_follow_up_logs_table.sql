-- Create follow_up_logs table for tracking follow-up history
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS follow_up_logs (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    branch_name VARCHAR(255),
    cs_owner VARCHAR(100) NOT NULL,
    round INTEGER NOT NULL CHECK (round IN (7, 14, 30, 60, 90)),
    due_date DATE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    feedback TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_follow_up_logs_customer_id ON follow_up_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_logs_created_at ON follow_up_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follow_up_logs_cs_owner ON follow_up_logs(cs_owner);

-- Enable Row Level Security (optional, depends on your setup)
-- ALTER TABLE follow_up_logs ENABLE ROW LEVEL SECURITY;

-- Grant permissions (adjust based on your Supabase setup)
-- GRANT ALL ON follow_up_logs TO authenticated;
-- GRANT ALL ON follow_up_logs TO service_role;

COMMENT ON TABLE follow_up_logs IS 'Stores history of completed follow-up rounds with feedback';
COMMENT ON COLUMN follow_up_logs.round IS 'Follow-up round: 7, 14, 30, 60, or 90 days';
COMMENT ON COLUMN follow_up_logs.feedback IS 'Feedback notes from CS team after follow-up call';
