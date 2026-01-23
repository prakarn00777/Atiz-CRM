import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
    // Check the duplicate IDs
    const ids = [67, 561, 63, 559, 65, 560];

    const { data, error } = await supabase
        .from("customers")
        .select("*")
        .in("id", ids);

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("=".repeat(80));
    console.log("รายละเอียดลูกค้าที่ซ้ำ:");
    console.log("=".repeat(80));

    for (const c of data || []) {
        const branches = c.branches ? JSON.parse(c.branches) : [];
        console.log(`
ID: ${c.id}
ชื่อ: ${c.name}
Subdomain: ${c.subdomain || "ไม่มี"}
Client Code: ${c.client_code || "ไม่มี"}
Product: ${c.product_type}
Package: ${c.package}
Status: ${c.usage_status}
Branches: ${branches.length > 0 ? JSON.stringify(branches, null, 2) : "ไม่มี"}
Created: ${c.created_at}
Modified By: ${c.modified_by || "ไม่มี"}
Modified At: ${c.modified_at || "ไม่มี"}
${"─".repeat(60)}`);
    }
}

check();
