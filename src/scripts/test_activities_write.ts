
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://okrpxwezzddpnjeukjex.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rcnB4d2V6emRkcG5qZXVramV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzUwMTgsImV4cCI6MjA4NDQxMTAxOH0._M4b-ujwZbEWhux4KYa8d00dSTXZfIEt5uz6UHGYHKU";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    const { error } = await supabase.from('activities').insert({ title: 'test_delete_me' });
    if (error) {
        console.log("❌ Table 'activities' DOES NOT EXIST or INSERT failed:", error.message);
    } else {
        console.log("✅ Table 'activities' EXISTS and IS WRITABLE.");
        await supabase.from('activities').delete().eq('title', 'test_delete_me');
    }
}

test();
