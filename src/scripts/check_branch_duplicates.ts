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

async function checkBranchDuplicates() {
    console.log("🔍 Fetching customers from Supabase...\n");

    const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`📊 Total customers: ${data?.length}\n`);

    // Collect all customer names
    const customerNames = new Map<string, number[]>();
    for (const c of data || []) {
        const name = c.name?.trim();
        if (name) {
            if (!customerNames.has(name)) {
                customerNames.set(name, []);
            }
            customerNames.get(name)!.push(c.id);
        }
    }

    // Collect all branch names and check against customer names
    console.log("=".repeat(80));
    console.log("📋 BRANCH NAME vs CUSTOMER NAME COMPARISON");
    console.log("=".repeat(80));

    const duplicatesFound: any[] = [];

    for (const c of data || []) {
        if (!c.branches) continue;

        let branches: Branch[] = [];
        try {
            branches = JSON.parse(c.branches);
        } catch {
            continue;
        }

        for (const branch of branches) {
            const branchName = branch.name?.trim();
            if (!branchName) continue;

            // Check if branch name matches any customer name
            if (customerNames.has(branchName)) {
                const matchingCustomerIds = customerNames.get(branchName)!;
                // Exclude self
                const otherIds = matchingCustomerIds.filter(id => id !== c.id);

                if (otherIds.length > 0) {
                    duplicatesFound.push({
                        customerId: c.id,
                        customerName: c.name,
                        branchName: branchName,
                        matchingCustomerIds: otherIds
                    });
                }
            }

            // Also check partial matches (branch name contains customer name or vice versa)
            for (const [custName, ids] of customerNames) {
                if (custName === branchName) continue; // Already checked
                if (ids.includes(c.id)) continue; // Skip self

                // Check if branch name contains the customer name (likely a branch)
                if (branchName.includes(custName) || custName.includes(branchName)) {
                    // Skip common generic words
                    if (branchName.length < 5 || custName.length < 5) continue;
                    if (["สาขา", "หลัก", "ใหญ่"].some(w => branchName === w)) continue;

                    duplicatesFound.push({
                        customerId: c.id,
                        customerName: c.name,
                        branchName: branchName,
                        matchingCustomerIds: ids,
                        matchType: "partial",
                        matchedName: custName
                    });
                }
            }
        }
    }

    if (duplicatesFound.length === 0) {
        console.log("\n✅ ไม่พบชื่อสาขาที่ซ้ำกับชื่อลูกค้า!\n");
    } else {
        console.log(`\n⚠️  พบ ${duplicatesFound.length} รายการที่อาจซ้ำกัน:\n`);

        for (const dup of duplicatesFound) {
            console.log("-".repeat(60));
            console.log(`🏢 ลูกค้า ID ${dup.customerId}: ${dup.customerName}`);
            console.log(`   📍 ชื่อสาขา: "${dup.branchName}"`);
            console.log(`   🔗 ตรงกับลูกค้า ID: ${dup.matchingCustomerIds.join(", ")}`);
            if (dup.matchType === "partial") {
                console.log(`   📝 ประเภท: Partial match กับ "${dup.matchedName}"`);
            }
        }
    }

    // Also list all branches for review
    console.log("\n" + "=".repeat(80));
    console.log("📋 รายการสาขาทั้งหมด (เรียงตามจำนวนสาขา)");
    console.log("=".repeat(80));

    const customersWithBranches = (data || [])
        .filter(c => c.branches)
        .map(c => {
            let branches: Branch[] = [];
            try {
                branches = JSON.parse(c.branches);
            } catch {
                branches = [];
            }
            return { ...c, parsedBranches: branches };
        })
        .filter(c => c.parsedBranches.length > 0)
        .sort((a, b) => b.parsedBranches.length - a.parsedBranches.length);

    console.log(`\nพบ ${customersWithBranches.length} ลูกค้าที่มีสาขา:\n`);

    for (const c of customersWithBranches.slice(0, 20)) { // Show top 20
        console.log(`\n🏢 ID ${c.id}: ${c.name} (${c.parsedBranches.length} สาขา)`);
        console.log(`   Subdomain: ${c.subdomain || "ไม่มี"}`);
        console.log(`   สาขา:`);
        for (const b of c.parsedBranches) {
            const mainTag = b.isMain ? " [หลัก]" : "";
            console.log(`     - ${b.name}${mainTag}`);
        }
    }

    if (customersWithBranches.length > 20) {
        console.log(`\n... และอีก ${customersWithBranches.length - 20} ลูกค้า`);
    }

    console.log("\n" + "=".repeat(80));
    console.log("📊 SUMMARY");
    console.log("=".repeat(80));
    console.log(`   - ลูกค้าทั้งหมด: ${data?.length}`);
    console.log(`   - ลูกค้าที่มีสาขา: ${customersWithBranches.length}`);
    console.log(`   - ชื่อสาขาที่อาจซ้ำกับลูกค้า: ${duplicatesFound.length}`);
}

checkBranchDuplicates();
