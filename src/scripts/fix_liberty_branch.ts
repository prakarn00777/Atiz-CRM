import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function fixLibertyBranch() {
    // Find customer
    const { data: cust, error } = await db
        .from("customers")
        .select("id, name")
        .ilike("name", "%liberty%")
        .single();

    if (error || !cust) {
        console.error("Customer not found:", error?.message);
        return;
    }

    console.log(`Found: ${cust.name} (ID: ${cust.id})`);

    // Check existing branches
    const { data: branches } = await db
        .from("branches")
        .select("id, name, is_main, status")
        .eq("customer_id", cust.id);

    console.log("Current branches:", branches);

    if (branches?.some(b => b.name === "สาขา 1")) {
        console.log('"สาขา 1" already exists. Nothing to do.');
        return;
    }

    // Insert สาขา 1
    const { data: inserted, error: insertErr } = await db
        .from("branches")
        .insert({
            customer_id: cust.id,
            name: "สาขา 1",
            is_main: false,
            status: "Pending"
        })
        .select();

    if (insertErr) {
        console.error("Insert error:", insertErr.message);
        return;
    }

    console.log(`Added "สาขา 1" to branches table:`, inserted);
}

fixLibertyBranch();
