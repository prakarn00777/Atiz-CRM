
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

// Manually provided from .env read
const supabaseUrl = "https://okrpxwezzddpnjeukjex.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rcnB4d2V6emRkcG5qZXVramV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzUwMTgsImV4cCI6MjA4NDQxMTAxOH0._M4b-ujwZbEWhux4KYa8d00dSTXZfIEt5uz6UHGYHKU";

const db = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
    console.log("Seeding Admin User...");

    // 1. Upsert Admin Role
    console.log("Ensuring 'admin' role exists...");
    const { error: roleError } = await db.from('roles').upsert({
        id: 'admin',
        name: 'Admin',
        description: 'Administrator with full access',
        permissions: {
            dashboard: { read: true, write: true },
            customers: { read: true, write: true },
            installations: { read: true, write: true },
            issues: { read: true, write: true },
            user_management: { read: true, write: true },
            role_management: { read: true, write: true }
        }
    });

    if (roleError) {
        console.error("Error creating role:", roleError);
        // Continue anyway as it might exist
    }

    // 2. Upsert Admin User
    const hashedPassword = await bcrypt.hash("1234", 10);

    // Check if user exists
    const { data: existingUser } = await db.from('users').select('id').eq('username', 'admin').single();

    let result;
    if (existingUser) {
        console.log("Updating existing admin user...");
        result = await db.from('users').update({
            password: hashedPassword,
            role_id: 'admin',
            name: 'System Admin'
        }).eq('username', 'admin');
    } else {
        console.log("Creating new admin user...");
        result = await db.from('users').insert({
            username: 'admin',
            password: hashedPassword,
            name: 'System Admin',
            role_id: 'admin'
        });
    }

    if (result.error) {
        console.error("Error creating user:", result.error);
    } else {
        console.log("✅ Success! Login with: admin / 1234");
    }
}

main();
