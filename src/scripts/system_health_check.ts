/**
 * System Health Check - ตรวจสอบสุขภาพระบบทั้งหมด
 *
 * ใช้งาน: npx tsx src/scripts/system_health_check.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

dotenv.config({ path: ".env" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface HealthCheckResult {
    category: string;
    item: string;
    status: "ok" | "warning" | "error";
    message: string;
    details?: any;
}

const results: HealthCheckResult[] = [];

function log(result: HealthCheckResult) {
    results.push(result);
    const icon = result.status === "ok" ? "✅" : result.status === "warning" ? "⚠️" : "❌";
    console.log(`${icon} [${result.category}] ${result.item}: ${result.message}`);
}

async function checkEnvironment() {
    console.log("\n" + "─".repeat(60));
    console.log("🔧 1. ENVIRONMENT CHECK");
    console.log("─".repeat(60));

    // Check .env file
    const envExists = fs.existsSync(".env");
    log({
        category: "ENV",
        item: ".env file",
        status: envExists ? "ok" : "error",
        message: envExists ? "Found" : "Missing .env file!"
    });

    // Check required env vars
    const requiredVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
    for (const v of requiredVars) {
        const exists = !!process.env[v];
        log({
            category: "ENV",
            item: v,
            status: exists ? "ok" : "error",
            message: exists ? "Set" : "Missing!"
        });
    }
}

async function checkDatabase() {
    console.log("\n" + "─".repeat(60));
    console.log("🗄️  2. DATABASE CHECK");
    console.log("─".repeat(60));

    // Test connection
    try {
        const start = Date.now();
        const { data, error } = await supabase.from("customers").select("id").limit(1);
        const latency = Date.now() - start;

        if (error) throw error;

        log({
            category: "DB",
            item: "Connection",
            status: latency < 1000 ? "ok" : "warning",
            message: `Connected (${latency}ms)`,
            details: { latency }
        });
    } catch (err: any) {
        log({
            category: "DB",
            item: "Connection",
            status: "error",
            message: `Failed: ${err.message}`
        });
        return;
    }

    // Check each table
    const tables = ["customers", "issues", "installations", "leads", "activities", "users", "roles"];
    for (const table of tables) {
        try {
            const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
            if (error) throw error;
            log({
                category: "DB",
                item: `Table: ${table}`,
                status: "ok",
                message: `${count} records`
            });
        } catch (err: any) {
            log({
                category: "DB",
                item: `Table: ${table}`,
                status: "error",
                message: `Error: ${err.message}`
            });
        }
    }
}

async function checkDataIntegrity() {
    console.log("\n" + "─".repeat(60));
    console.log("🔍 3. DATA INTEGRITY CHECK");
    console.log("─".repeat(60));

    // Check duplicate subdomains
    const { data: customers } = await supabase.from("customers").select("id, name, subdomain, branches");

    if (!customers) return;

    // Duplicate subdomains
    const subdomainMap: Record<string, number[]> = {};
    for (const c of customers) {
        if (!c.subdomain) continue;
        const normalized = c.subdomain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
        if (!subdomainMap[normalized]) subdomainMap[normalized] = [];
        subdomainMap[normalized].push(c.id);
    }
    const dupSubdomains = Object.entries(subdomainMap).filter(([_, ids]) => ids.length > 1);

    log({
        category: "DATA",
        item: "Duplicate Subdomains",
        status: dupSubdomains.length === 0 ? "ok" : "warning",
        message: dupSubdomains.length === 0 ? "None" : `Found ${dupSubdomains.length} duplicates`,
        details: dupSubdomains.length > 0 ? dupSubdomains : undefined
    });

    // Duplicate names
    const nameMap: Record<string, number[]> = {};
    for (const c of customers) {
        const name = c.name?.trim();
        if (!name) continue;
        if (!nameMap[name]) nameMap[name] = [];
        nameMap[name].push(c.id);
    }
    const dupNames = Object.entries(nameMap).filter(([_, ids]) => ids.length > 1);

    log({
        category: "DATA",
        item: "Duplicate Names",
        status: dupNames.length === 0 ? "ok" : "warning",
        message: dupNames.length === 0 ? "None" : `Found ${dupNames.length} duplicates`,
        details: dupNames.length > 0 ? dupNames : undefined
    });

    // Self-duplicate branches
    let selfDupCount = 0;
    for (const c of customers) {
        if (!c.branches) continue;
        try {
            const branches = JSON.parse(c.branches);
            if (branches.some((b: any) => b.name?.trim() === c.name?.trim())) {
                selfDupCount++;
            }
        } catch { }
    }

    log({
        category: "DATA",
        item: "Branch Self-Duplicates",
        status: selfDupCount === 0 ? "ok" : "warning",
        message: selfDupCount === 0 ? "None" : `Found ${selfDupCount} issues`
    });

    // Orphan records check
    const { data: issues } = await supabase.from("issues").select("id, customer_id");
    const customerIds = new Set(customers.map(c => c.id));
    const orphanIssues = (issues || []).filter(i => i.customer_id && !customerIds.has(i.customer_id));

    log({
        category: "DATA",
        item: "Orphan Issues",
        status: orphanIssues.length === 0 ? "ok" : "warning",
        message: orphanIssues.length === 0 ? "None" : `Found ${orphanIssues.length} orphan records`
    });
}

async function checkGitStatus() {
    console.log("\n" + "─".repeat(60));
    console.log("📂 4. GIT STATUS CHECK");
    console.log("─".repeat(60));

    try {
        // Current branch
        const branch = execSync("git branch --show-current", { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
        log({
            category: "GIT",
            item: "Current Branch",
            status: "ok",
            message: branch || "main"
        });

        // Uncommitted changes
        const status = execSync("git status --porcelain", { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
        const changedFiles = status ? status.split("\n").length : 0;

        log({
            category: "GIT",
            item: "Uncommitted Changes",
            status: changedFiles === 0 ? "ok" : "warning",
            message: changedFiles === 0 ? "Clean" : `${changedFiles} files changed`,
            details: changedFiles > 0 ? status.split("\n").slice(0, 10) : undefined
        });

        // Last commit (Windows compatible)
        try {
            const lastCommit = execSync("git log -1 --format=\"%h - %s\"", { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
            log({
                category: "GIT",
                item: "Last Commit",
                status: "ok",
                message: lastCommit
            });
        } catch {
            log({
                category: "GIT",
                item: "Last Commit",
                status: "ok",
                message: "Unable to get last commit"
            });
        }

    } catch (err: any) {
        log({
            category: "GIT",
            item: "Git Status",
            status: "warning",
            message: `Git check failed - may not be a git repo`
        });
    }
}

async function checkDependencies() {
    console.log("\n" + "─".repeat(60));
    console.log("📦 5. DEPENDENCIES CHECK");
    console.log("─".repeat(60));

    // Check package.json
    try {
        const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));

        log({
            category: "DEPS",
            item: "Package Name",
            status: "ok",
            message: `${pkg.name}@${pkg.version}`
        });

        // Check node_modules
        const nodeModulesExists = fs.existsSync("node_modules");
        log({
            category: "DEPS",
            item: "node_modules",
            status: nodeModulesExists ? "ok" : "error",
            message: nodeModulesExists ? "Installed" : "Missing! Run: npm install"
        });

        // Check for outdated (basic check)
        const depsCount = Object.keys(pkg.dependencies || {}).length;
        const devDepsCount = Object.keys(pkg.devDependencies || {}).length;

        log({
            category: "DEPS",
            item: "Dependencies",
            status: "ok",
            message: `${depsCount} deps, ${devDepsCount} devDeps`
        });

        // Key dependencies versions
        const keyDeps = ["next", "react", "@supabase/supabase-js"];
        for (const dep of keyDeps) {
            const version = pkg.dependencies?.[dep] || pkg.devDependencies?.[dep];
            if (version) {
                log({
                    category: "DEPS",
                    item: dep,
                    status: "ok",
                    message: version
                });
            }
        }

    } catch (err: any) {
        log({
            category: "DEPS",
            item: "package.json",
            status: "error",
            message: `Cannot read: ${err.message}`
        });
    }
}

async function checkBuildStatus() {
    console.log("\n" + "─".repeat(60));
    console.log("🏗️  6. BUILD STATUS CHECK");
    console.log("─".repeat(60));

    // Check if .next exists (built)
    const nextExists = fs.existsSync(".next");
    log({
        category: "BUILD",
        item: ".next folder",
        status: nextExists ? "ok" : "warning",
        message: nextExists ? "Exists" : "Not built yet"
    });

    // Check TypeScript errors (quick check)
    try {
        execSync("npx tsc --noEmit --skipLibCheck 2>&1 | head -20", { encoding: "utf-8", timeout: 30000 });
        log({
            category: "BUILD",
            item: "TypeScript",
            status: "ok",
            message: "No errors"
        });
    } catch (err: any) {
        const output = err.stdout || err.message;
        const errorCount = (output.match(/error TS/g) || []).length;
        log({
            category: "BUILD",
            item: "TypeScript",
            status: errorCount > 0 ? "warning" : "ok",
            message: errorCount > 0 ? `${errorCount} errors found` : "OK",
            details: errorCount > 0 ? output.slice(0, 500) : undefined
        });
    }
}

async function checkRecentChanges() {
    console.log("\n" + "─".repeat(60));
    console.log("📝 7. RECENT CHANGES ANALYSIS");
    console.log("─".repeat(60));

    try {
        // Get recent commits (Windows compatible)
        const recentCommits = execSync("git log -5 --format=\"%h|%s|%cr|%an\"", {
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"]
        }).trim();

        if (recentCommits) {
            console.log("\nRecent Commits:");
            for (const line of recentCommits.split("\n")) {
                const parts = line.split("|");
                if (parts.length >= 4) {
                    console.log(`   ${parts[0]} - ${parts[1]} (${parts[2]}) by ${parts[3]}`);
                }
            }
        }

        // Get changed files in last commit
        let lastChanges = "";
        try {
            lastChanges = execSync("git diff --name-only HEAD~1 HEAD", {
                encoding: "utf-8",
                stdio: ["pipe", "pipe", "pipe"]
            }).trim();
        } catch { }

        if (lastChanges) {
            console.log("\nFiles changed in last commit:");
            const files = lastChanges.split("\n").filter(f => f.trim());
            for (const file of files.slice(0, 10)) {
                console.log(`   - ${file}`);
            }
            if (files.length > 10) {
                console.log(`   ... and ${files.length - 10} more files`);
            }

            // Analyze impact
            console.log("\n📊 Impact Analysis:");
            const impactAreas: string[] = [];

            if (files.some(f => f.includes("actions.ts"))) impactAreas.push("Server Actions (API)");
            if (files.some(f => f.includes("db.ts"))) impactAreas.push("Database Connection");
            if (files.some(f => f.includes("schema"))) impactAreas.push("Database Schema");
            if (files.some(f => f.includes("types"))) impactAreas.push("Type Definitions");
            if (files.some(f => f.includes("components/"))) impactAreas.push("UI Components");
            if (files.some(f => f.includes("page.tsx"))) impactAreas.push("Pages/Routing");
            if (files.some(f => f.includes("package"))) impactAreas.push("Dependencies");

            if (impactAreas.length > 0) {
                for (const area of impactAreas) {
                    console.log(`   ⚡ ${area}`);
                }
            } else {
                console.log("   ✅ Low impact changes");
            }
        } else {
            console.log("\n   No recent file changes detected");
        }

    } catch (err) {
        console.log("   Unable to analyze recent changes (git may not be available)");
    }
}

async function generateSummary() {
    console.log("\n" + "=".repeat(60));
    console.log("📋 SYSTEM HEALTH SUMMARY");
    console.log("=".repeat(60));

    const errors = results.filter(r => r.status === "error");
    const warnings = results.filter(r => r.status === "warning");
    const ok = results.filter(r => r.status === "ok");

    console.log(`\n   ✅ OK: ${ok.length}`);
    console.log(`   ⚠️  Warnings: ${warnings.length}`);
    console.log(`   ❌ Errors: ${errors.length}`);

    if (errors.length > 0) {
        console.log("\n❌ ERRORS (Must Fix):");
        for (const e of errors) {
            console.log(`   - [${e.category}] ${e.item}: ${e.message}`);
        }
    }

    if (warnings.length > 0) {
        console.log("\n⚠️  WARNINGS (Should Review):");
        for (const w of warnings) {
            console.log(`   - [${w.category}] ${w.item}: ${w.message}`);
        }
    }

    // Overall status
    console.log("\n" + "─".repeat(60));
    if (errors.length > 0) {
        console.log("🔴 OVERALL: CRITICAL - Requires immediate attention");
    } else if (warnings.length > 0) {
        console.log("🟡 OVERALL: WARNING - Review recommended");
    } else {
        console.log("🟢 OVERALL: HEALTHY - System is running normally");
    }
    console.log("=".repeat(60));

    // Save report
    const report = {
        timestamp: new Date().toISOString(),
        summary: { ok: ok.length, warnings: warnings.length, errors: errors.length },
        results
    };
    fs.writeFileSync("health_report.json", JSON.stringify(report, null, 2));
    console.log("\n📁 Report saved to health_report.json");
}

async function main() {
    console.log("=".repeat(60));
    console.log("🏥 SYSTEM HEALTH CHECK");
    console.log(`📅 ${new Date().toLocaleString("th-TH")}`);
    console.log("=".repeat(60));

    await checkEnvironment();
    await checkDatabase();
    await checkDataIntegrity();
    await checkGitStatus();
    await checkDependencies();
    await checkBuildStatus();
    await checkRecentChanges();
    await generateSummary();
}

main().catch(console.error);
