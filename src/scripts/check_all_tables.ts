
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://okrpxwezzddpnjeukjex.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rcnB4d2V6emRkcG5qZXVramV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzUwMTgsImV4cCI6MjA4NDQxMTAxOH0._M4b-ujwZbEWhux4KYa8d00dSTXZfIEt5uz6UHGYHKU";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAll() {
    const tables = ["roles", "users", "customers", "branches", "installations", "issues", "activities"];
    console.log("Status of required tables:");

    for (const table of tables) {
        const { error } = await supabase.from(table).select("*").limit(1);
        if (error) {
            if (error.code === 'PGRST204') {
                console.log(`❌ ${table}: Missing`);
            } else if (error.code === '42P01') {
                console.log(`❌ ${table}: Missing (Undefined Table)`);
            } else {
                console.log(`✅ ${table}: Exists (but returned error: ${error.message})`);
            }
        } else {
            console.log(`✅ ${table}: Exists`);
        }
    }
}

checkAll();
