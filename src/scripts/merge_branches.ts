import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";

// Load environment variables
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Configuration
const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE = process.argv.includes("--verbose");

interface Branch {
    id?: number;
    name: string;
    isMain: boolean;
    address?: string;
    status?: "Pending" | "Installing" | "Completed";
}

interface DuplicateGroup {
    subdomain: string;
    customers: {
        id: number;
        name: string;
        clientCode: string | null;
        productType: string | null;
        package: string | null;
        usageStatus: string | null;
        contactName: string | null;
        contactPhone: string | null;
        branches: Branch[];
    }[];
    suggestedMainId: number;
    branchesToAdd: string[];
}

async function loadDuplicateData(): Promise<DuplicateGroup[]> {
    const filePath = "duplicate_subdomains.json";
    if (!fs.existsSync(filePath)) {
        console.error("❌ File duplicate_subdomains.json not found. Please run check_duplicate_subdomain.ts first.");
        process.exit(1);
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
}

function selectMainCustomer(customers: DuplicateGroup["customers"]): DuplicateGroup["customers"][0] {
    // Priority: Active status > has contact info > has client code > lowest ID
    const sorted = [...customers].sort((a, b) => {
        // Active status first
        const aActive = a.usageStatus === "Active" ? 1 : 0;
        const bActive = b.usageStatus === "Active" ? 1 : 0;
        if (aActive !== bActive) return bActive - aActive;

        // Has contact info
        const aHasContact = (a.contactName || a.contactPhone) ? 1 : 0;
        const bHasContact = (b.contactName || b.contactPhone) ? 1 : 0;
        if (aHasContact !== bHasContact) return bHasContact - aHasContact;

        // Has client code
        const aHasCode = a.clientCode ? 1 : 0;
        const bHasCode = b.clientCode ? 1 : 0;
        if (aHasCode !== bHasCode) return bHasCode - aHasCode;

        // Lowest ID (oldest record)
        return a.id - b.id;
    });

    return sorted[0];
}

function extractBranchName(fullName: string): string {
    // Extract branch name from patterns like "ชื่อคลินิก (สาขาXXX)"
    const match = fullName.match(/\(สาขา(.+?)\)$/);
    if (match) {
        return `สาขา${match[1]}`;
    }
    // If no pattern found, use the full name
    return fullName;
}

async function mergeBranches() {
    console.log("=".repeat(80));
    console.log("🔄 BRANCH MERGE MIGRATION SCRIPT");
    console.log("=".repeat(80));

    if (DRY_RUN) {
        console.log("⚠️  DRY RUN MODE - No changes will be made to the database\n");
    } else {
        console.log("🚨 LIVE MODE - Changes WILL be made to the database\n");
    }

    const duplicateGroups = await loadDuplicateData();
    console.log(`📋 Found ${duplicateGroups.length} groups to merge\n`);

    let totalMerged = 0;
    let totalBranchesAdded = 0;
    let totalDeleted = 0;
    const errors: string[] = [];
    const successLog: string[] = [];

    for (const group of duplicateGroups) {
        console.log("-".repeat(60));
        console.log(`🏢 Processing: ${group.subdomain}`);
        console.log(`   Customers in group: ${group.customers.length}`);

        // Select the main customer
        const mainCustomer = selectMainCustomer(group.customers);
        const otherCustomers = group.customers.filter(c => c.id !== mainCustomer.id);

        console.log(`   ✓ Main customer: ID ${mainCustomer.id} - ${mainCustomer.name}`);
        console.log(`   ✓ Branches to add: ${otherCustomers.length}`);

        if (VERBOSE) {
            for (const other of otherCustomers) {
                console.log(`     - ID ${other.id}: ${other.name}`);
            }
        }

        // Prepare new branches array
        const existingBranches: Branch[] = mainCustomer.branches || [];
        const hasMainBranch = existingBranches.some(b => b.isMain);

        // If no main branch, make the current one the main
        if (!hasMainBranch) {
            existingBranches.unshift({
                name: extractBranchName(mainCustomer.name) === mainCustomer.name
                    ? "สาขาหลัก"
                    : extractBranchName(mainCustomer.name),
                isMain: true,
                status: "Completed"
            });
        }

        // Add branches from other customers
        for (const other of otherCustomers) {
            const branchName = extractBranchName(other.name);
            // Check if branch already exists
            if (!existingBranches.some(b => b.name === branchName)) {
                existingBranches.push({
                    name: branchName,
                    isMain: false,
                    status: "Completed"
                });
                totalBranchesAdded++;
            }
        }

        if (!DRY_RUN) {
            try {
                // Step 1: Update the main customer with new branches
                const { error: updateError } = await supabase
                    .from("customers")
                    .update({
                        branches: JSON.stringify(existingBranches),
                        modified_at: new Date().toISOString(),
                        modified_by: "migration_script"
                    })
                    .eq("id", mainCustomer.id);

                if (updateError) {
                    throw new Error(`Update customer ${mainCustomer.id}: ${updateError.message}`);
                }

                // Step 2: Update foreign keys in related tables
                for (const other of otherCustomers) {
                    // Update issues
                    const { error: issueError } = await supabase
                        .from("issues")
                        .update({
                            customer_id: mainCustomer.id,
                            branch_name: extractBranchName(other.name)
                        })
                        .eq("customer_id", other.id);

                    if (issueError) {
                        console.warn(`   ⚠️ Warning updating issues for ${other.id}: ${issueError.message}`);
                    }

                    // Update installations
                    const { error: instError } = await supabase
                        .from("installations")
                        .update({
                            customer_id: mainCustomer.id,
                            branch_name: extractBranchName(other.name)
                        })
                        .eq("customer_id", other.id);

                    if (instError) {
                        console.warn(`   ⚠️ Warning updating installations for ${other.id}: ${instError.message}`);
                    }

                    // Update activities
                    const { error: actError } = await supabase
                        .from("activities")
                        .update({
                            customer_id: mainCustomer.id,
                            customer_name: mainCustomer.name
                        })
                        .eq("customer_id", other.id);

                    if (actError) {
                        console.warn(`   ⚠️ Warning updating activities for ${other.id}: ${actError.message}`);
                    }
                }

                // Step 3: Delete the merged customers
                for (const other of otherCustomers) {
                    const { error: deleteError } = await supabase
                        .from("customers")
                        .delete()
                        .eq("id", other.id);

                    if (deleteError) {
                        throw new Error(`Delete customer ${other.id}: ${deleteError.message}`);
                    }
                    totalDeleted++;
                }

                totalMerged++;
                successLog.push(`${group.subdomain}: Merged ${otherCustomers.length + 1} → 1 (main: ${mainCustomer.id})`);
                console.log(`   ✅ Successfully merged!`);

            } catch (err: any) {
                errors.push(`${group.subdomain}: ${err.message}`);
                console.error(`   ❌ Error: ${err.message}`);
            }
        } else {
            // Dry run - just log what would happen
            console.log(`   [DRY RUN] Would update customer ${mainCustomer.id} with ${existingBranches.length} branches`);
            console.log(`   [DRY RUN] Would delete customers: ${otherCustomers.map(c => c.id).join(", ")}`);
            totalMerged++;
            totalDeleted += otherCustomers.length;
        }
    }

    // Final Summary
    console.log("\n" + "=".repeat(80));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(80));
    console.log(`   Groups processed: ${duplicateGroups.length}`);
    console.log(`   Groups merged: ${totalMerged}`);
    console.log(`   Branches added: ${totalBranchesAdded}`);
    console.log(`   Records deleted: ${totalDeleted}`);
    console.log(`   Errors: ${errors.length}`);

    if (errors.length > 0) {
        console.log("\n❌ ERRORS:");
        for (const err of errors) {
            console.log(`   - ${err}`);
        }
    }

    if (!DRY_RUN && successLog.length > 0) {
        // Save success log
        fs.writeFileSync("migration_log.txt", successLog.join("\n"), "utf-8");
        console.log("\n📁 Migration log saved to migration_log.txt");
    }

    console.log("=".repeat(80));

    if (DRY_RUN) {
        console.log("\n💡 To execute the migration, run without --dry-run flag:");
        console.log("   npx tsx src/scripts/merge_branches.ts");
    }
}

// Run the migration
mergeBranches().catch(console.error);
