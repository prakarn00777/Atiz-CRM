import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function deleteDuplicates() {
    const idsToDelete = [559, 561, 65];

    console.log("🗑️  Deleting duplicate customers:", idsToDelete);

    const { error } = await supabase
        .from("customers")
        .delete()
        .in("id", idsToDelete);

    if (error) {
        console.error("❌ Error:", error);
    } else {
        console.log("✅ Successfully deleted", idsToDelete.length, "duplicate records");
    }

    // Verify
    const { count } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true });

    console.log("📊 Remaining customers:", count);
}

deleteDuplicates();
