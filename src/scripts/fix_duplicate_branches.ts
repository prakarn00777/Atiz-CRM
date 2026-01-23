import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Branch {
    name: string;
    isMain: boolean;
    address?: string;
    status?: string;
}

async function fixDuplicateBranches() {
    console.log("🔧 แก้ไขสาขาที่ชื่อซ้ำกับชื่อลูกค้า...\n");

    const { data, error } = await supabase
        .from("customers")
        .select("*")
        .not("branches", "is", null);

    if (error) {
        console.error("Error:", error);
        return;
    }

    let fixedCount = 0;
    let errorCount = 0;

    for (const c of data || []) {
        if (!c.branches) continue;

        let branches: Branch[] = [];
        try {
            branches = JSON.parse(c.branches);
        } catch {
            continue;
        }

        const customerName = c.name?.trim();
        if (!customerName) continue;

        // Check if any branch name matches customer name
        const hasDuplicate = branches.some(b => b.name?.trim() === customerName);

        if (!hasDuplicate) continue;

        // Filter out branches with same name as customer
        const filteredBranches = branches.filter(b => b.name?.trim() !== customerName);

        console.log(`🏢 ID ${c.id}: ${customerName}`);
        console.log(`   ก่อนแก้ไข: ${branches.length} สาขา`);
        console.log(`   หลังแก้ไข: ${filteredBranches.length} สาขา`);
        console.log(`   ลบ: "${customerName}"`);

        // Update in database
        const { error: updateError } = await supabase
            .from("customers")
            .update({
                branches: JSON.stringify(filteredBranches),
                modified_at: new Date().toISOString(),
                modified_by: "fix_duplicate_script"
            })
            .eq("id", c.id);

        if (updateError) {
            console.log(`   ❌ Error: ${updateError.message}`);
            errorCount++;
        } else {
            console.log(`   ✅ แก้ไขสำเร็จ`);
            fixedCount++;
        }
        console.log("");
    }

    console.log("=".repeat(60));
    console.log("📊 SUMMARY");
    console.log("=".repeat(60));
    console.log(`   - แก้ไขสำเร็จ: ${fixedCount} รายการ`);
    console.log(`   - Error: ${errorCount} รายการ`);
}

fixDuplicateBranches();
