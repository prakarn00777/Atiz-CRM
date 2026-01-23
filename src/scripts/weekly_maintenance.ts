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
}

async function weeklyMaintenance() {
    console.log("=".repeat(80));
    console.log("🔧 WEEKLY MAINTENANCE REPORT");
    console.log("=".repeat(80));
    console.log(`📅 ${new Date().toLocaleDateString("th-TH", { dateStyle: "full" })}\n`);

    const { data: customers, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");

    if (error) {
        console.error("❌ Error fetching customers:", error);
        return;
    }

    console.log(`📊 Total Customers: ${customers?.length}\n`);

    // 1. Check duplicate subdomains
    console.log("-".repeat(60));
    console.log("1️⃣ ตรวจสอบ Subdomain ซ้ำ");
    console.log("-".repeat(60));

    const subdomainGroups: Record<string, any[]> = {};
    for (const c of customers || []) {
        if (!c.subdomain) continue;
        const normalized = c.subdomain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
        if (!subdomainGroups[normalized]) subdomainGroups[normalized] = [];
        subdomainGroups[normalized].push(c);
    }
    const dupSubdomains = Object.entries(subdomainGroups).filter(([_, arr]) => arr.length > 1);

    if (dupSubdomains.length === 0) {
        console.log("✅ ไม่พบ subdomain ซ้ำ\n");
    } else {
        console.log(`⚠️  พบ ${dupSubdomains.length} subdomain ที่ซ้ำกัน:`);
        for (const [sub, arr] of dupSubdomains) {
            console.log(`   - ${sub}: ${arr.map(c => `ID ${c.id}`).join(", ")}`);
        }
        console.log("");
    }

    // 2. Check duplicate names
    console.log("-".repeat(60));
    console.log("2️⃣ ตรวจสอบชื่อลูกค้าซ้ำ");
    console.log("-".repeat(60));

    const nameGroups: Record<string, any[]> = {};
    for (const c of customers || []) {
        const name = c.name?.trim();
        if (!name) continue;
        if (!nameGroups[name]) nameGroups[name] = [];
        nameGroups[name].push(c);
    }
    const dupNames = Object.entries(nameGroups).filter(([_, arr]) => arr.length > 1);

    if (dupNames.length === 0) {
        console.log("✅ ไม่พบชื่อลูกค้าซ้ำ\n");
    } else {
        console.log(`⚠️  พบ ${dupNames.length} ชื่อที่ซ้ำกัน:`);
        for (const [name, arr] of dupNames) {
            console.log(`   - "${name}": ${arr.map(c => `ID ${c.id}`).join(", ")}`);
        }
        console.log("");
    }

    // 3. Check self-duplicate branches
    console.log("-".repeat(60));
    console.log("3️⃣ ตรวจสอบสาขาซ้ำกับชื่อลูกค้า");
    console.log("-".repeat(60));

    let selfDupCount = 0;
    for (const c of customers || []) {
        if (!c.branches) continue;
        let branches: Branch[] = [];
        try { branches = JSON.parse(c.branches); } catch { continue; }
        const hasSelfDup = branches.some(b => b.name?.trim() === c.name?.trim());
        if (hasSelfDup) {
            selfDupCount++;
            console.log(`   - ID ${c.id}: ${c.name}`);
        }
    }

    if (selfDupCount === 0) {
        console.log("✅ ไม่พบสาขาที่ชื่อซ้ำกับลูกค้า\n");
    } else {
        console.log(`\n⚠️  พบ ${selfDupCount} รายการที่มีสาขาซ้ำ\n`);
    }

    // 4. Statistics
    console.log("-".repeat(60));
    console.log("4️⃣ สถิติ");
    console.log("-".repeat(60));

    const withBranches = (customers || []).filter(c => {
        if (!c.branches) return false;
        try {
            const b = JSON.parse(c.branches);
            return b.length > 0;
        } catch { return false; }
    });

    const byStatus: Record<string, number> = {};
    for (const c of customers || []) {
        const status = c.usage_status || "Unknown";
        byStatus[status] = (byStatus[status] || 0) + 1;
    }

    console.log(`   ลูกค้าทั้งหมด: ${customers?.length}`);
    console.log(`   ลูกค้าที่มีสาขา: ${withBranches.length}`);
    console.log(`   สถานะ:`);
    for (const [status, count] of Object.entries(byStatus)) {
        console.log(`     - ${status}: ${count}`);
    }

    // Summary
    console.log("\n" + "=".repeat(80));
    console.log("📋 SUMMARY");
    console.log("=".repeat(80));

    const issues = dupSubdomains.length + dupNames.length + selfDupCount;
    if (issues === 0) {
        console.log("✅ ไม่พบปัญหา - ระบบปกติ");
    } else {
        console.log(`⚠️  พบ ${issues} ปัญหาที่ต้องแก้ไข`);
        if (dupSubdomains.length > 0) console.log(`   - รัน: npx tsx src/scripts/merge_branches.ts`);
        if (dupNames.length > 0) console.log(`   - รัน: npx tsx src/scripts/check_duplicate_names.ts`);
        if (selfDupCount > 0) console.log(`   - รัน: npx tsx src/scripts/fix_duplicate_branches.ts`);
    }
    console.log("=".repeat(80));
}

weeklyMaintenance();
