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
    contact_name: string | null;
    contact_phone: string | null;
    created_at: string | null;
}

async function checkDuplicateSubdomains() {
    console.log("🔍 Fetching customers from Supabase...\n");

    const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("subdomain", { ascending: true });

    if (error) {
        console.error("Error fetching customers:", error);
        return;
    }

    if (!data || data.length === 0) {
        console.log("No customers found in database");
        return;
    }

    console.log(`📊 Total customers: ${data.length}\n`);

    // Group customers by subdomain
    const subdomainGroups: Record<string, CustomerRow[]> = {};
    const noSubdomain: CustomerRow[] = [];

    for (const customer of data as CustomerRow[]) {
        if (!customer.subdomain || customer.subdomain.trim() === "") {
            noSubdomain.push(customer);
            continue;
        }

        // Normalize subdomain (remove protocol, trailing slashes, etc.)
        const normalizedSubdomain = customer.subdomain
            .toLowerCase()
            .replace(/^https?:\/\//, "")
            .replace(/\/$/, "")
            .trim();

        if (!subdomainGroups[normalizedSubdomain]) {
            subdomainGroups[normalizedSubdomain] = [];
        }
        subdomainGroups[normalizedSubdomain].push(customer);
    }

    // Find duplicates
    const duplicates = Object.entries(subdomainGroups).filter(
        ([_, customers]) => customers.length > 1
    );

    console.log("=".repeat(80));
    console.log("📋 DUPLICATE SUBDOMAIN REPORT");
    console.log("=".repeat(80));

    if (duplicates.length === 0) {
        console.log("\n✅ No duplicate subdomains found!\n");
    } else {
        console.log(`\n⚠️  Found ${duplicates.length} subdomain(s) with multiple customers:\n`);

        for (const [subdomain, customers] of duplicates) {
            console.log("-".repeat(80));
            console.log(`🏢 Subdomain: ${subdomain}`);
            console.log(`   จำนวนรายการ: ${customers.length} รายการ`);
            console.log("-".repeat(80));

            for (const c of customers) {
                const branches = c.branches ? JSON.parse(c.branches) : [];
                console.log(`
   📌 ID: ${c.id}
      ชื่อ: ${c.name}
      Client Code: ${c.client_code || "-"}
      ประเภท: ${c.product_type || "-"}
      แพ็คเกจ: ${c.package || "-"}
      สถานะ: ${c.usage_status || "-"}
      สาขาปัจจุบัน: ${branches.length > 0 ? branches.map((b: any) => b.name).join(", ") : "ไม่มี"}
      ผู้ติดต่อ: ${c.contact_name || "-"} (${c.contact_phone || "-"})
      สร้างเมื่อ: ${c.created_at ? new Date(c.created_at).toLocaleDateString("th-TH") : "-"}
`);
            }

            // Suggestion for merging
            console.log(`   💡 คำแนะนำในการรวม:`);
            console.log(`      - เก็บรายการ ID ${customers[0].id} (${customers[0].name}) เป็นหลัก`);
            console.log(`      - เพิ่มสาขาจากรายการอื่น:`);
            for (let i = 1; i < customers.length; i++) {
                console.log(`        • "${customers[i].name}" → เป็นสาขาใหม่`);
            }
            console.log("");
        }
    }

    // Summary
    console.log("=".repeat(80));
    console.log("📊 SUMMARY");
    console.log("=".repeat(80));
    console.log(`   - ลูกค้าทั้งหมด: ${data.length} รายการ`);
    console.log(`   - ลูกค้าที่มี subdomain: ${data.length - noSubdomain.length} รายการ`);
    console.log(`   - ลูกค้าที่ไม่มี subdomain: ${noSubdomain.length} รายการ`);
    console.log(`   - Subdomain ที่ซ้ำกัน: ${duplicates.length} กลุ่ม`);
    console.log(`   - รายการที่ต้องรวม: ${duplicates.reduce((sum, [_, c]) => sum + c.length, 0)} รายการ`);
    console.log("=".repeat(80));

    // Export data for review
    if (duplicates.length > 0) {
        console.log("\n📁 Exporting duplicate data to JSON...");
        const exportData = duplicates.map(([subdomain, customers]) => ({
            subdomain,
            customers: customers.map((c) => ({
                id: c.id,
                name: c.name,
                clientCode: c.client_code,
                productType: c.product_type,
                package: c.package,
                usageStatus: c.usage_status,
                contactName: c.contact_name,
                contactPhone: c.contact_phone,
                branches: c.branches ? JSON.parse(c.branches) : [],
            })),
            suggestedMainId: customers[0].id,
            branchesToAdd: customers.slice(1).map((c) => c.name),
        }));

        const fs = await import("fs");
        fs.writeFileSync(
            "duplicate_subdomains.json",
            JSON.stringify(exportData, null, 2),
            "utf-8"
        );
        console.log("✅ Exported to duplicate_subdomains.json\n");
    }
}

checkDuplicateSubdomains().catch(console.error);
