import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  console.log("=== Checking Liberty Wellness ===\n");

  // 1. Find customer
  const { data: customers, error: custErr } = await db
    .from("customers")
    .select("id, name, subdomain, product_type, package, usage_status")
    .ilike("name", "%liberty%");

  if (custErr) {
    console.error("Error fetching customers:", custErr.message);
    return;
  }

  if (!customers || customers.length === 0) {
    console.log("No customers found matching 'liberty'");
    return;
  }

  console.log(`Found ${customers.length} customer(s):\n`);
  for (const c of customers) {
    console.log(`  ID: ${c.id}`);
    console.log(`  Name: ${c.name}`);
    console.log(`  Subdomain: ${c.subdomain}`);
    console.log(`  Product: ${c.product_type}`);
    console.log(`  Package: ${c.package}`);
    console.log(`  Status: ${c.usage_status}`);

    // 1b. Find branches for this customer
    const { data: branches, error: brErr } = await db
      .from("branches")
      .select("id, name, is_main, address, status")
      .eq("customer_id", c.id);

    if (brErr) {
      console.error(`  Branches error: ${brErr.message}`);
    } else if (!branches || branches.length === 0) {
      console.log("  Branches: (none)");
    } else {
      console.log(`  Branches (${branches.length}):`);
      for (const b of branches) {
        console.log(`    - [${b.id}] ${b.name}${b.is_main ? " (main)" : ""} | status: ${b.status || "-"} | address: ${b.address || "-"}`);
      }
    }

    // 2. Find installations for this customer (select all to avoid missing columns)
    const { data: installs, error: instErr } = await db
      .from("installations")
      .select("*")
      .eq("customer_id", c.id);

    if (instErr) {
      console.error(`  Installations error: ${instErr.message}`);
    } else if (!installs || installs.length === 0) {
      console.log("  Installations: (none)");
    } else {
      console.log(`  Installations (${installs.length}):`);
      for (const inst of installs) {
        console.log(`    - [${inst.id}]`, JSON.stringify(inst, null, 6));
      }
    }

    console.log("");
  }
}

main().catch(console.error);
