import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface CustomerRow {
    id: number;
    name: string;
    subdomain: string | null;
    client_code: string | null;
    product_type: string | null;
    package: string | null;
    usage_status: string | null;
    branches: string | null;
    created_at: string | null;
}

async function checkDuplicateNames() {
    console.log("🔍 Fetching customers from Supabase...\n");

    const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        console.error("Error fetching customers:", error);
        return;
    }

    if (!data || data.length === 0) {
        console.log("No customers found in database");
        return;
    }

    console.log(`📊 Total customers: ${data.length}\n`);

    // Group customers by exact name
    const nameGroups: Record<string, CustomerRow[]> = {};

    for (const customer of data as CustomerRow[]) {
        const name = customer.name?.trim() || "";
        if (!name) continue;

        if (!nameGroups[name]) {
            nameGroups[name] = [];
        }
        nameGroups[name].push(customer);
    }

    // Find exact duplicates (same name)
    const exactDuplicates = Object.entries(nameGroups).filter(
        ([_, customers]) => customers.length > 1
    );

    console.log("=".repeat(80));
    console.log("📋 DUPLICATE NAME REPORT (EXACT MATCH)");
    console.log("=".repeat(80));

    if (exactDuplicates.length === 0) {
        console.log("\n✅ No exact duplicate names found!\n");
    } else {
        console.log(`\n⚠️  Found ${exactDuplicates.length} name(s) with duplicates:\n`);

        for (const [name, customers] of exactDuplicates) {
            console.log("-".repeat(80));
            console.log(`🏢 Name: "${name}"`);
            console.log(`   จำนวนรายการซ้ำ: ${customers.length} รายการ`);
            console.log("-".repeat(80));

            for (const c of customers) {
                const branches = c.branches ? JSON.parse(c.branches) : [];
                console.log(`
   📌 ID: ${c.id}
      Subdomain: ${c.subdomain || "-"}
      Client Code: ${c.client_code || "-"}
      ประเภท: ${c.product_type || "-"}
      แพ็คเกจ: ${c.package || "-"}
      สถานะ: ${c.usage_status || "-"}
      สาขา: ${branches.length > 0 ? `${branches.length} สาขา` : "ไม่มี"}
      สร้างเมื่อ: ${c.created_at ? new Date(c.created_at).toLocaleDateString("th-TH") : "-"}
`);
            }

            // Check if they have different subdomains
            const subdomains = customers.map(c => c.subdomain).filter(Boolean);
            const uniqueSubdomains = [...new Set(subdomains)];

            if (uniqueSubdomains.length > 1) {
                console.log(`   ⚠️  มี subdomain ต่างกัน: ${uniqueSubdomains.join(", ")}`);
                console.log(`   💡 อาจเป็นลูกค้าคนละรายจริงๆ\n`);
            } else if (uniqueSubdomains.length === 1) {
                console.log(`   🔴 Subdomain เดียวกัน: ${uniqueSubdomains[0]}`);
                console.log(`   💡 น่าจะเป็นข้อมูลซ้ำจากบั๊ก - ควรลบออก\n`);
            } else {
                console.log(`   ❓ ไม่มี subdomain - ต้องตรวจสอบเพิ่มเติม\n`);
            }
        }
    }

    // Summary
    const totalDuplicateRecords = exactDuplicates.reduce((sum, [_, c]) => sum + c.length, 0);
    const recordsToDelete = totalDuplicateRecords - exactDuplicates.length; // Keep one of each

    console.log("=".repeat(80));
    console.log("📊 SUMMARY");
    console.log("=".repeat(80));
    console.log(`   - ลูกค้าทั้งหมด: ${data.length} รายการ`);
    console.log(`   - ชื่อที่ซ้ำกัน: ${exactDuplicates.length} ชื่อ`);
    console.log(`   - รายการที่ซ้ำทั้งหมด: ${totalDuplicateRecords} รายการ`);
    console.log(`   - รายการที่ควรลบ: ${recordsToDelete} รายการ`);
    console.log("=".repeat(80));

    // Export duplicates with same subdomain (likely bugs)
    const bugDuplicates = exactDuplicates.filter(([_, customers]) => {
        const subdomains = customers.map(c => c.subdomain).filter(Boolean);
        const uniqueSubdomains = [...new Set(subdomains)];
        return uniqueSubdomains.length <= 1; // Same subdomain or no subdomain
    });

    if (bugDuplicates.length > 0) {
        console.log(`\n🐛 Likely bug duplicates (same name & subdomain): ${bugDuplicates.length} groups`);

        const fs = require("fs");
        const exportData = bugDuplicates.map(([name, customers]) => ({
            name,
            customers: customers.map(c => ({
                id: c.id,
                subdomain: c.subdomain,
                clientCode: c.client_code,
                productType: c.product_type,
                usageStatus: c.usage_status,
                branches: c.branches ? JSON.parse(c.branches) : [],
                createdAt: c.created_at
            })),
            keepId: customers.sort((a, b) => a.id - b.id)[0].id, // Keep oldest
            deleteIds: customers.sort((a, b) => a.id - b.id).slice(1).map(c => c.id)
        }));

        fs.writeFileSync(
            "duplicate_names.json",
            JSON.stringify(exportData, null, 2),
            "utf-8"
        );
        console.log("📁 Exported to duplicate_names.json\n");
    }
}

checkDuplicateNames().catch(console.error);
