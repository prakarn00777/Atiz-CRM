
import { createClient } from "@supabase/supabase-js";

// Hardcoded for diagnostic run only
const supabaseUrl = "https://okrpxwezzddpnjeukjex.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rcnB4d2V6emRkcG5qZXVramV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzUwMTgsImV4cCI6MjA4NDQxMTAxOH0._M4b-ujwZbEWhux4KYa8d00dSTXZfIEt5uz6UHGYHKU";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
    console.log("Checking Supabase Connection & Tables...");

    const tables = ["roles", "users", "customers", "branches", "installations", "issues"];
    const missing = [];
    const existing = [];

    for (const table of tables) {
        const { error } = await supabase.from(table).select("count", { count: "exact", head: true });

        if (error) {
            if (error.code === 'PGRST204' || error.message.toLowerCase().includes("does not exist") || error.message.toLowerCase().includes("404")) {
                missing.push(table);
            } else {
                // console.log(`⚠️ Info for ${table}: ${error.message}`);
                // If permission denied (401), it exists.
                existing.push(table);
            }
        } else {
            existing.push(table);
        }
    }

    console.log("\n--- Results ---");
    if (missing.length === 0) {
        console.log("✅ All tables found.");
    } else {
        console.log("❌ Missing tables:", missing.join(", "));
    }
}

checkTables();
