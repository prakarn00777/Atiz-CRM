import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { createClient } from "@supabase/supabase-js";
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  console.log("=== Migration: Add usage_status to branches ===\n");

  // 1. Check if column already exists by fetching one branch
  const { data: sample } = await db.from("branches").select("*").limit(1);
  const hasColumn = sample && sample.length > 0 && "usage_status" in sample[0];

  if (hasColumn) {
    console.log("Column usage_status already exists in branches table.");

    // Check current values
    const { data: branches } = await db.from("branches").select("id, customer_id, name, usage_status");
    const groups: Record<string, number> = {};
    for (const b of branches || []) {
      const key = b.usage_status === null ? "(null)" : b.usage_status === "" ? "(empty)" : b.usage_status;
      groups[key] = (groups[key] || 0) + 1;
    }
    console.log("\nCurrent usage_status distribution:");
    for (const [val, count] of Object.entries(groups).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${val}: ${count}`);
    }

    // Fix null values from customer data
    const nullBranches = (branches || []).filter(b => !b.usage_status);
    if (nullBranches.length > 0) {
      console.log(`\nFixing ${nullBranches.length} null branches from customer data...`);

      // Get customer usage statuses
      const customerIds = [...new Set(nullBranches.map(b => b.customer_id))];
      const { data: customers } = await db
        .from("customers")
        .select("id, usage_status")
        .in("id", customerIds);

      const custMap = new Map((customers || []).map(c => [c.id, c.usage_status || "Active"]));

      for (const b of nullBranches) {
        const status = custMap.get(b.customer_id) || "Active";
        await db.from("branches").update({ usage_status: status }).eq("id", b.id);
      }
      console.log("Done fixing null values.");
    }
  } else {
    console.log("Column does NOT exist. Please run this SQL in Supabase Dashboard:\n");
    console.log("  ALTER TABLE branches ADD COLUMN usage_status TEXT DEFAULT 'Active';");
    console.log("  UPDATE branches b SET usage_status = c.usage_status FROM customers c WHERE b.customer_id = c.id;\n");
    console.log("After running the SQL, run this script again to verify.");
    process.exit(1);
  }

  // 2. Verification — compute customer-level from branches and compare
  console.log("\n--- Verification ---");
  const { data: allBranches } = await db.from("branches").select("customer_id, usage_status");
  const { data: allCustomers } = await db.from("customers").select("id, name, usage_status");

  const branchesByCustomer: Record<number, string[]> = {};
  for (const b of allBranches || []) {
    if (!branchesByCustomer[b.customer_id]) branchesByCustomer[b.customer_id] = [];
    branchesByCustomer[b.customer_id].push(b.usage_status || "Active");
  }

  let mismatches = 0;
  for (const c of allCustomers || []) {
    const branchStatuses = branchesByCustomer[c.id];
    if (!branchStatuses) continue; // customer has no branches

    // Compute aggregate
    let computed: string;
    if (branchStatuses.includes("Active")) computed = "Active";
    else if (branchStatuses.includes("Training")) computed = "Training";
    else if (branchStatuses.includes("Pending")) computed = "Pending";
    else if (branchStatuses.every(s => s === "Canceled")) computed = "Canceled";
    else computed = "Inactive";

    // After migration, computed should match customer-level (since all branches got same value)
    if (computed !== (c.usage_status || "Active")) {
      // This is expected to match since we just populated from customer
      // Only log if truly different
      mismatches++;
      if (mismatches <= 5) {
        console.log(`  Mismatch: ${c.name} — customer=${c.usage_status}, computed=${computed}`);
      }
    }
  }

  if (mismatches === 0) {
    console.log("All customer statuses match their branch aggregates!");
  } else {
    console.log(`${mismatches} mismatches found (expected after initial migration — will be correct once code computes from branches)`);
  }

  console.log("\nMigration complete!");
}

main().catch(console.error);
