import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
    console.log("🔍 Checking issues table for assigned_to / assigned_at columns...\n");

    // Test if columns already exist by querying them
    const { data, error } = await supabase
        .from("issues")
        .select("assigned_to, assigned_at")
        .limit(1);

    if (!error) {
        console.log("✅ Columns already exist! No migration needed.");
        console.log("   Sample:", data);
        return;
    }

    if (error.message.includes("assigned_to") || error.message.includes("assigned_at")) {
        console.log("⚠️  Columns don't exist yet. Adding them now...\n");

        // Use rpc to run raw SQL (requires a DB function or direct SQL access)
        // Since Supabase anon key can't run DDL, we'll show the SQL to run manually
        console.log("📋 Run this SQL in Supabase Dashboard > SQL Editor:\n");
        console.log(`ALTER TABLE issues ADD COLUMN IF NOT EXISTS assigned_to TEXT;`);
        console.log(`ALTER TABLE issues ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;`);
        console.log(`CREATE INDEX IF NOT EXISTS idx_issues_assigned_to ON issues(assigned_to);`);
        console.log(`\n👉 Go to: https://supabase.com/dashboard > Your Project > SQL Editor`);
    } else {
        console.log("❌ Unexpected error:", error.message);
    }
}

main().catch(console.error);
