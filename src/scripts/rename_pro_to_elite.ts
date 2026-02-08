import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function renameProToElite() {
    // Check how many have "Pro"
    const { data: proCusts, error: fetchErr } = await db
        .from("customers")
        .select("id, name, package")
        .eq("package", "Pro");

    if (fetchErr) {
        console.error("Error fetching:", fetchErr.message);
        return;
    }

    if (!proCusts || proCusts.length === 0) {
        console.log("No customers with package 'Pro' found. Nothing to update.");
        return;
    }

    console.log(`Found ${proCusts.length} customers with package 'Pro':`);
    proCusts.forEach(c => console.log(`  - [${c.id}] ${c.name}`));

    // Update Pro -> Elite
    const { data, error } = await db
        .from("customers")
        .update({ package: "Elite" })
        .eq("package", "Pro")
        .select("id, name, package");

    if (error) {
        console.error("Update error:", error.message);
        return;
    }

    console.log(`\nUpdated ${data?.length ?? 0} customers: Pro -> Elite`);
}

renameProToElite();
