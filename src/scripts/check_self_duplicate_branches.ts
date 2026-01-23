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

async function checkSelfDuplicateBranches() {
    console.log("🔍 ตรวจสอบชื่อสาขาที่ซ้ำกับชื่อลูกค้าเจ้าของเอง...\n");

    const { data, error } = await supabase
        .from("customers")
        .select("*")
        .not("branches", "is", null)
        .order("name", { ascending: true });

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`📊 ลูกค้าที่มีสาขา: ${data?.length}\n`);

    console.log("=".repeat(80));
    console.log("📋 ชื่อสาขาที่ซ้ำกับชื่อลูกค้าเจ้าของเอง (EXACT MATCH)");
    console.log("=".repeat(80));

    const duplicates: any[] = [];

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

        for (const branch of branches) {
            const branchName = branch.name?.trim();
            if (!branchName) continue;

            // Exact match
            if (branchName === customerName) {
                duplicates.push({
                    customerId: c.id,
                    customerName: customerName,
                    subdomain: c.subdomain,
                    branchName: branchName,
                    isMain: branch.isMain,
                    allBranches: branches
                });
            }
        }
    }

    if (duplicates.length === 0) {
        console.log("\n✅ ไม่พบชื่อสาขาที่ซ้ำกับชื่อลูกค้าเจ้าของเอง!\n");
    } else {
        console.log(`\n⚠️  พบ ${duplicates.length} รายการที่ชื่อสาขาซ้ำกับชื่อลูกค้า:\n`);

        for (const dup of duplicates) {
            console.log("-".repeat(60));
            console.log(`🏢 ID ${dup.customerId}: ${dup.customerName}`);
            console.log(`   Subdomain: ${dup.subdomain || "ไม่มี"}`);
            console.log(`   📍 สาขาที่ซ้ำ: "${dup.branchName}" ${dup.isMain ? "[หลัก]" : ""}`);
            console.log(`   📋 สาขาทั้งหมด:`);
            for (const b of dup.allBranches) {
                const tag = b.isMain ? " [หลัก]" : "";
                const dupTag = b.name === dup.customerName ? " ⚠️ ซ้ำ" : "";
                console.log(`      - ${b.name}${tag}${dupTag}`);
            }
        }
    }

    console.log("\n" + "=".repeat(80));
    console.log("📊 SUMMARY");
    console.log("=".repeat(80));
    console.log(`   - ลูกค้าที่มีสาขา: ${data?.length}`);
    console.log(`   - สาขาที่ชื่อซ้ำกับลูกค้าเจ้าของ: ${duplicates.length}`);

    if (duplicates.length > 0) {
        console.log("\n💡 คำแนะนำ: ควรลบสาขาที่ชื่อซ้ำออก หรือเปลี่ยนชื่อเป็น 'สาขาหลัก'");

        // Export for fixing
        const fs = require("fs");
        fs.writeFileSync(
            "self_duplicate_branches.json",
            JSON.stringify(duplicates, null, 2),
            "utf-8"
        );
        console.log("📁 Exported to self_duplicate_branches.json\n");
    }
}

checkSelfDuplicateBranches();
