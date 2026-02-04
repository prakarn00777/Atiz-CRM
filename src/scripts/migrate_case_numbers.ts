import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function migrateCaseNumbers() {
    console.log("Fetching all issues ordered by id...");

    const { data, error } = await db
        .from("issues")
        .select("id, case_number")
        .order("id", { ascending: true });

    if (error) {
        console.error("Error fetching issues:", error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log("No issues found.");
        return;
    }

    console.log(`Found ${data.length} issues. Migrating...`);

    for (let i = 0; i < data.length; i++) {
        const newCaseNumber = `C-${String(i + 1).padStart(4, "0")}`;
        const issue = data[i];

        console.log(`  ${issue.case_number} → ${newCaseNumber}`);

        const { error: updateError } = await db
            .from("issues")
            .update({ case_number: newCaseNumber })
            .eq("id", issue.id);

        if (updateError) {
            console.error(`  ERROR updating id=${issue.id}:`, updateError.message);
        }
    }

    console.log("Migration complete!");
}

migrateCaseNumbers().catch(console.error);
