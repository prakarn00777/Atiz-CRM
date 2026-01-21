
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://okrpxwezzddpnjeukjex.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rcnB4d2V6emRkcG5qZXVramV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzUwMTgsImV4cCI6MjA4NDQxMTAxOH0._M4b-ujwZbEWhux4KYa8d00dSTXZfIEt5uz6UHGYHKU";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
    console.log("Checking for 'activities' table...");

    const { error } = await supabase.from('activities').select("count", { count: "exact", head: true });

    if (error) {
        if (error.code === 'PGRST204' || error.message.toLowerCase().includes("does not exist") || error.message.toLowerCase().includes("404")) {
            console.log("❌ Table 'activities' is MISSING.");
        } else {
            console.log(`⚠️ Table 'activities' returned error (might exist but have RLS): ${error.message}`);
        }
    } else {
        console.log("✅ Table 'activities' EXISTS.");
    }
}

checkTables();
