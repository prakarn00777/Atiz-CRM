/**
 * Personal Assistant - ผู้ช่วยส่วนตัวสำหรับระบบ CRM
 *
 * ใช้งาน: npx tsx src/scripts/assistant.ts
 *
 * ต้องตั้งค่า ANTHROPIC_API_KEY ใน .env
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as readline from "readline";
import { execSync } from "child_process";

dotenv.config({ path: ".env" });

// ตรวจสอบ API Key
if (!process.env.ANTHROPIC_API_KEY) {
    console.log("❌ ไม่พบ ANTHROPIC_API_KEY ใน .env");
    console.log("   กรุณาเพิ่ม: ANTHROPIC_API_KEY=sk-ant-...");
    process.exit(1);
}

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Tools สำหรับ Assistant
const tools: Anthropic.Tool[] = [
    {
        name: "get_customers_count",
        description: "นับจำนวนลูกค้าทั้งหมด หรือตามสถานะ",
        input_schema: {
            type: "object" as const,
            properties: {
                status: {
                    type: "string",
                    description: "สถานะลูกค้า (optional): ใช้งาน, หยุดัใช้งาน, ทดลองใช้"
                }
            },
            required: []
        }
    },
    {
        name: "get_issues_summary",
        description: "สรุป issues/ปัญหาที่แจ้งเข้ามา",
        input_schema: {
            type: "object" as const,
            properties: {
                status: {
                    type: "string",
                    description: "สถานะ issue (optional): open, in_progress, resolved"
                }
            },
            required: []
        }
    },
    {
        name: "get_leads_summary",
        description: "สรุป leads ที่เข้ามา",
        input_schema: {
            type: "object" as const,
            properties: {
                status: {
                    type: "string",
                    description: "สถานะ lead (optional): new, contacted, qualified, proposal, won, lost"
                }
            },
            required: []
        }
    },
    {
        name: "search_customer",
        description: "ค้นหาลูกค้าจากชื่อหรือ subdomain",
        input_schema: {
            type: "object" as const,
            properties: {
                query: {
                    type: "string",
                    description: "คำค้นหา (ชื่อหรือ subdomain)"
                }
            },
            required: ["query"]
        }
    },
    {
        name: "run_health_check",
        description: "ตรวจสอบสุขภาพระบบ",
        input_schema: {
            type: "object" as const,
            properties: {},
            required: []
        }
    },
    {
        name: "get_recent_activities",
        description: "ดูกิจกรรมล่าสุดในระบบ",
        input_schema: {
            type: "object" as const,
            properties: {
                limit: {
                    type: "number",
                    description: "จำนวนรายการ (default: 10)"
                }
            },
            required: []
        }
    }
];

// Tool implementations
async function executeToolCall(name: string, input: Record<string, unknown>): Promise<string> {
    switch (name) {
        case "get_customers_count": {
            let query = supabase.from("customers").select("*", { count: "exact", head: true });
            if (input.status) {
                query = query.eq("usage_status", input.status);
            }
            const { count, error } = await query;
            if (error) return `Error: ${error.message}`;
            return `จำนวนลูกค้า${input.status ? ` (${input.status})` : ""}: ${count} ราย`;
        }

        case "get_issues_summary": {
            let query = supabase.from("issues").select("*");
            if (input.status) {
                query = query.eq("status", input.status);
            }
            const { data, error } = await query;
            if (error) return `Error: ${error.message}`;

            const byStatus: Record<string, number> = {};
            for (const issue of data || []) {
                const status = issue.status || "unknown";
                byStatus[status] = (byStatus[status] || 0) + 1;
            }

            let summary = `Issues ทั้งหมด: ${data?.length || 0} รายการ\n`;
            for (const [status, count] of Object.entries(byStatus)) {
                summary += `  - ${status}: ${count}\n`;
            }
            return summary;
        }

        case "get_leads_summary": {
            let query = supabase.from("leads").select("*");
            if (input.status) {
                query = query.eq("status", input.status);
            }
            const { data, error } = await query;
            if (error) return `Error: ${error.message}`;

            const byStatus: Record<string, number> = {};
            for (const lead of data || []) {
                const status = lead.status || "unknown";
                byStatus[status] = (byStatus[status] || 0) + 1;
            }

            let summary = `Leads ทั้งหมด: ${data?.length || 0} รายการ\n`;
            for (const [status, count] of Object.entries(byStatus)) {
                summary += `  - ${status}: ${count}\n`;
            }
            return summary;
        }

        case "search_customer": {
            const searchQuery = String(input.query).toLowerCase();
            const { data, error } = await supabase
                .from("customers")
                .select("id, name, subdomain, usage_status, phone")
                .or(`name.ilike.%${searchQuery}%,subdomain.ilike.%${searchQuery}%`)
                .limit(5);

            if (error) return `Error: ${error.message}`;
            if (!data || data.length === 0) return "ไม่พบลูกค้าที่ตรงกับคำค้นหา";

            let result = `พบ ${data.length} รายการ:\n`;
            for (const c of data) {
                result += `  - ID ${c.id}: ${c.name} (${c.subdomain || "ไม่มี subdomain"}) - ${c.usage_status || "N/A"}\n`;
            }
            return result;
        }

        case "run_health_check": {
            try {
                // Quick health check
                const checks: string[] = [];

                // DB connection
                const start = Date.now();
                const { error } = await supabase.from("customers").select("id").limit(1);
                const latency = Date.now() - start;
                checks.push(error ? `❌ Database: ${error.message}` : `✅ Database: OK (${latency}ms)`);

                // Record counts
                const tables = ["customers", "issues", "leads", "activities"];
                for (const table of tables) {
                    const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
                    checks.push(`📊 ${table}: ${count} records`);
                }

                return checks.join("\n");
            } catch (err: any) {
                return `Error running health check: ${err.message}`;
            }
        }

        case "get_recent_activities": {
            const limit = (input.limit as number) || 10;
            const { data, error } = await supabase
                .from("activities")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(limit);

            if (error) return `Error: ${error.message}`;
            if (!data || data.length === 0) return "ไม่มีกิจกรรมล่าสุด";

            let result = `กิจกรรมล่าสุด ${data.length} รายการ:\n`;
            for (const a of data) {
                const date = new Date(a.created_at).toLocaleDateString("th-TH");
                result += `  - ${date}: ${a.type} - ${a.description || "ไม่มีรายละเอียด"}\n`;
            }
            return result;
        }

        default:
            return `Unknown tool: ${name}`;
    }
}

// Chat with assistant
async function chat(userMessage: string, history: Anthropic.MessageParam[]): Promise<string> {
    history.push({ role: "user", content: userMessage });

    const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: `คุณคือผู้ช่วยส่วนตัวสำหรับระบบ CRM ชื่อ "Assistant"

หน้าที่:
- ช่วยตอบคำถามเกี่ยวกับข้อมูลในระบบ CRM
- ช่วยตรวจสอบสถานะระบบ
- ค้นหาข้อมูลลูกค้า, issues, leads
- สรุปรายงานต่างๆ

พูดภาษาไทย สุภาพ กระชับ ชัดเจน
ถ้าต้องการข้อมูลจากระบบ ให้ใช้ tools ที่มี`,
        tools,
        messages: history
    });

    // Handle tool calls
    if (response.stop_reason === "tool_use") {
        const toolResults: Anthropic.MessageParam[] = [];

        for (const block of response.content) {
            if (block.type === "tool_use") {
                console.log(`   🔧 กำลังใช้ ${block.name}...`);
                const result = await executeToolCall(block.name, block.input as Record<string, unknown>);
                toolResults.push({
                    role: "user",
                    content: [{
                        type: "tool_result",
                        tool_use_id: block.id,
                        content: result
                    }]
                });
            }
        }

        // Add assistant response with tool use
        history.push({ role: "assistant", content: response.content });

        // Add tool results and get final response
        for (const result of toolResults) {
            history.push(result);
        }

        const finalResponse = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            system: `คุณคือผู้ช่วยส่วนตัวสำหรับระบบ CRM พูดภาษาไทย สุภาพ กระชับ`,
            tools,
            messages: history
        });

        const textContent = finalResponse.content.find(b => b.type === "text");
        const reply = textContent && textContent.type === "text" ? textContent.text : "ไม่สามารถตอบได้";
        history.push({ role: "assistant", content: reply });
        return reply;
    }

    // Regular text response
    const textContent = response.content.find(b => b.type === "text");
    const reply = textContent && textContent.type === "text" ? textContent.text : "ไม่สามารถตอบได้";
    history.push({ role: "assistant", content: reply });
    return reply;
}

// Main
async function main() {
    console.log("═".repeat(50));
    console.log("🤖 Personal Assistant for CRM");
    console.log("═".repeat(50));
    console.log("พิมพ์คำถามหรือคำสั่ง พิมพ์ 'exit' เพื่อออก\n");
    console.log("ตัวอย่าง:");
    console.log("  - ลูกค้าทั้งหมดมีกี่ราย?");
    console.log("  - มี issue ค้างกี่เรื่อง?");
    console.log("  - ค้นหาลูกค้า ABC");
    console.log("  - ตรวจสอบระบบ");
    console.log("═".repeat(50) + "\n");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const history: Anthropic.MessageParam[] = [];

    const askQuestion = () => {
        rl.question("คุณ: ", async (input) => {
            const trimmed = input.trim();

            if (trimmed.toLowerCase() === "exit" || trimmed === "ออก") {
                console.log("\n👋 ลาก่อน!");
                rl.close();
                return;
            }

            if (!trimmed) {
                askQuestion();
                return;
            }

            try {
                const reply = await chat(trimmed, history);
                console.log(`\n🤖 Assistant: ${reply}\n`);
            } catch (err: any) {
                console.log(`\n❌ Error: ${err.message}\n`);
            }

            askQuestion();
        });
    };

    askQuestion();
}

main();
