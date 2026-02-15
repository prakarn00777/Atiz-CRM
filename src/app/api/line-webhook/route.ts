import { NextRequest, NextResponse } from 'next/server';
import { verifySignature, replyMessage } from '@/lib/line-client';
import { buildDailyReportFlex, DailyReportData, RenewalData } from '@/lib/line-flex-daily-report';
import { buildWeeklyReportFlex, WeeklyReportData, getWeekRange } from '@/lib/line-flex-weekly-report';
import { buildIssueDetailFlex, IssueDetailData } from '@/lib/line-flex-issue-detail';
import { buildOutreachReportFlex, OutreachReportData } from '@/lib/line-flex-outreach-report';
import { getRenewalRate, RenewalRateRow } from '@/lib/google-sheets-renewal-rate';
import { getNewSales } from '@/lib/google-sheets-sales';
import { getRenewals } from '@/lib/google-sheets-renewals';
import { getOutreach } from '@/lib/google-sheets-outreach';
import { getMasterDemos } from '@/lib/google-sheets-master';
import { getLeads } from '@/lib/google-sheets';
import { db } from '@/lib/db';

const CRM_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://atizcrm.vercel.app';

// Case lookup pattern: #C-0001, #c-0045 anywhere in message
const CASE_PATTERN = /#c-(\d+)/i;

// Trigger keywords (case-insensitive)
const DAILY_KEYWORDS = ['#dailyreport'];
const WEEKLY_KEYWORDS = ['#weeklyreport'];
const OUTREACH_KEYWORDS = ['#outreach'];

// Thai month names mapping (1-indexed)
const THAI_MONTHS = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

// GET — health check + debug preview
export async function GET(req: NextRequest) {
    const hasToken = !!process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const hasSecret = !!process.env.LINE_CHANNEL_SECRET;
    const debug = req.nextUrl.searchParams.get('debug');

    if (debug === 'flex') {
        // Return sample Flex JSON for testing in LINE Flex Simulator
        const [tickets, renewal, followUp] = await Promise.all([
            getTicketsData(),
            getRenewalData(),
            getFollowUpData(),
        ]);
        const now = new Date();
        const data: DailyReportData = {
            date: `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`,
            tickets, renewal, followUp,
        };
        const flex = buildDailyReportFlex(data);
        return NextResponse.json({ flex, data });
    }

    if (debug === 'weekly') {
        const { start, end, label } = getWeekRange();
        const [tickets, renewal, newSales, renewalsAmount, newCustomers, followUp] = await Promise.all([
            getWeeklyTicketsData(start, end),
            getRenewalData(),
            getWeeklyNewSalesData(),
            getWeeklyRenewalsAmountData(),
            getWeeklyNewCustomersData(start, end),
            getWeeklyFollowUpData(start, end),
        ]);
        const data: WeeklyReportData = { weekRange: label, tickets, renewal, newSales, renewalsAmount, newCustomers, followUp };
        const flex = buildWeeklyReportFlex(data);
        return NextResponse.json({ flex, data });
    }

    if (debug === 'outreach') {
        const data = await getOutreachReportData();
        const flex = buildOutreachReportFlex(data);
        return NextResponse.json({ flex, data });
    }

    return NextResponse.json({
        status: 'ok',
        line_configured: hasToken && hasSecret,
        env: { hasToken, hasSecret },
        triggers: [...DAILY_KEYWORDS, ...WEEKLY_KEYWORDS, ...OUTREACH_KEYWORDS],
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get('x-line-signature') || '';

        console.log('[LINE] Webhook received, body length:', body.length);

        // Verify webhook signature
        if (!verifySignature(body, signature)) {
            console.error('[LINE] Invalid signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const payload = JSON.parse(body);
        const events = payload.events || [];
        console.log('[LINE] Events count:', events.length);

        for (const event of events) {
            if (event.type !== 'message' || event.message?.type !== 'text') {
                console.log('[LINE] Skipped event type:', event.type, event.message?.type);
                continue;
            }

            const text = (event.message.text || '').trim().toLowerCase();
            console.log('[LINE] Message text:', text);

            // --- Check case lookup trigger (#c0001) ---
            const caseMatch = text.match(CASE_PATTERN);
            if (caseMatch) {
                const caseNum = parseInt(caseMatch[1], 10);
                const caseNumber = `C-${String(caseNum).padStart(4, '0')}`;
                console.log('[LINE] Case lookup:', caseNumber);

                const issueData = await getIssueByCase(caseNumber);
                if (issueData) {
                    const flexMessage = buildIssueDetailFlex(issueData);
                    await replyMessage(event.replyToken, [flexMessage]);
                    console.log('[LINE] Issue detail sent for', caseNumber);
                } else {
                    await replyMessage(event.replyToken, [{
                        type: 'text',
                        text: `ไม่พบเคส ${caseNumber}`,
                    }]);
                }
                continue;
            }

            // --- Check weekly report trigger ---
            if (WEEKLY_KEYWORDS.some(kw => text === kw)) {
                console.log('[LINE] Weekly report trigger matched!');
                const { start, end, label } = getWeekRange();
                const [wTickets, wRenewal, wNewSales, wRenewalsAmount, wNewCustomers, wFollowUp] = await Promise.all([
                    getWeeklyTicketsData(start, end),
                    getRenewalData(),
                    getWeeklyNewSalesData(),
                    getWeeklyRenewalsAmountData(),
                    getWeeklyNewCustomersData(start, end),
                    getWeeklyFollowUpData(start, end),
                ]);
                const weeklyData: WeeklyReportData = { weekRange: label, tickets: wTickets, renewal: wRenewal, newSales: wNewSales, renewalsAmount: wRenewalsAmount, newCustomers: wNewCustomers, followUp: wFollowUp };
                const weeklyFlex = buildWeeklyReportFlex(weeklyData);
                await replyMessage(event.replyToken, [weeklyFlex]);
                console.log('[LINE] Weekly report sent!');
                continue;
            }

            // --- Check outreach report trigger ---
            if (OUTREACH_KEYWORDS.some(kw => text === kw)) {
                console.log('[LINE] Outreach report trigger matched!');
                const outreachData = await getOutreachReportData();
                const outreachFlex = buildOutreachReportFlex(outreachData);
                await replyMessage(event.replyToken, [outreachFlex]);
                console.log('[LINE] Outreach report sent!');
                continue;
            }

            // --- Check daily report trigger ---
            if (!DAILY_KEYWORDS.some(kw => text === kw)) {
                continue;
            }

            console.log('[LINE] Daily report trigger matched!');

            // Gather all data in parallel
            const [tickets, renewal, followUp] = await Promise.all([
                getTicketsData(),
                getRenewalData(),
                getFollowUpData(),
            ]);

            const now = new Date();
            const reportData: DailyReportData = {
                date: `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`,
                tickets,
                renewal,
                followUp,
            };

            const flexMessage = buildDailyReportFlex(reportData);
            await replyMessage(event.replyToken, [flexMessage]);
            console.log('[LINE] Daily report sent!');
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[LINE] Webhook error:', error);
        return NextResponse.json({ success: true }); // Always return 200 to LINE
    }
}

// --- Data aggregation functions ---

async function getIssueByCase(caseNumber: string): Promise<IssueDetailData | null> {
    try {
        const { data, error } = await db
            .from('issues')
            .select('id, case_number, title, customer_id, branch_name, severity, status, assigned_to, created_at, customers(name, subdomain)')
            .eq('case_number', caseNumber)
            .single();

        if (error || !data) return null;

        const customer = data.customers as any;
        const createdDate = data.created_at
            ? new Date(data.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
            : undefined;

        return {
            caseNumber: data.case_number,
            title: data.title,
            customerName: customer?.name || 'ไม่ระบุ',
            branchName: data.branch_name || undefined,
            severity: data.severity,
            status: data.status,
            assignedTo: data.assigned_to || undefined,
            createdAt: createdDate,
            customerSubdomain: customer?.subdomain || undefined,
            crmBaseUrl: CRM_BASE_URL,
            issueId: data.id,
        };
    } catch (err) {
        console.error('[LINE] Error fetching issue:', err);
        return null;
    }
}

async function getTicketsData() {
    try {
        const { data, error } = await db
            .from('issues')
            .select('id, status');

        if (error) throw error;

        const issues = data || [];
        return {
            total: issues.length,
            resolved: issues.filter(i => i.status === 'เสร็จสิ้น').length,
            inProgress: issues.filter(i => i.status === 'กำลังดำเนินการ').length,
            reported: issues.filter(i => i.status === 'แจ้งเคส').length,
        };
    } catch (err) {
        console.error('[LINE] Error fetching tickets:', err);
        return { total: 0, resolved: 0, inProgress: 0, reported: 0 };
    }
}

async function getRenewalData(): Promise<RenewalData | null> {
    try {
        const rows = await getRenewalRate();
        if (!rows.length) return null;

        // Current Thai month + year
        const now = new Date();
        const thaiMonth = THAI_MONTHS[now.getMonth() + 1];
        const thaiYear = String(now.getFullYear() + 543);
        const thaiYearShort = thaiYear.slice(-2); // "69" from "2569"

        // Filter rows for current month
        const currentRows = rows.filter(r =>
            r.month === thaiMonth && r.year === thaiYear
        );

        if (!currentRows.length) {
            // Fallback: use the latest month in the data
            const latestYear = rows.reduce((max, r) => r.year > max ? r.year : max, '0');
            const latestRows = rows.filter(r => r.year === latestYear);
            const latestMonth = latestRows.reduce((max, r) => {
                const idx = THAI_MONTHS.indexOf(r.month);
                const maxIdx = THAI_MONTHS.indexOf(max);
                return idx > maxIdx ? r.month : max;
            }, latestRows[0]?.month || '');

            const fallbackRows = rows.filter(r => r.month === latestMonth && r.year === latestYear);
            if (!fallbackRows.length) return null;

            return buildRenewalFromRows(fallbackRows, `${latestMonth} ${latestYear.slice(-2)}`);
        }

        return buildRenewalFromRows(currentRows, `${thaiMonth} ${thaiYearShort}`);
    } catch (err) {
        console.error('[LINE] Error fetching renewal:', err);
        return null;
    }
}

function buildRenewalFromRows(rows: RenewalRateRow[], monthLabel: string): RenewalData {
    const drEase = rows.find(r => r.product === 'Dr.Ease');
    const easePos = rows.find(r => r.product === 'EasePos');

    const drEaseTotal = (drEase?.renewed || 0) + (drEase?.notRenewed || 0) + (drEase?.pending || 0);
    const easePosTotal = (easePos?.renewed || 0) + (easePos?.notRenewed || 0) + (easePos?.pending || 0);

    return {
        monthLabel,
        totalCount: drEaseTotal + easePosTotal,
        drEaseCount: drEaseTotal,
        easePosCount: easePosTotal,
        renewed: (drEase?.renewed || 0) + (easePos?.renewed || 0),
        renewedDrEase: drEase?.renewed || 0,
        renewedEasePos: easePos?.renewed || 0,
        pending: (drEase?.pending || 0) + (easePos?.pending || 0),
        pendingDrEase: drEase?.pending || 0,
        pendingEasePos: easePos?.pending || 0,
        notRenewed: (drEase?.notRenewed || 0) + (easePos?.notRenewed || 0),
        notRenewedDrEase: drEase?.notRenewed || 0,
        notRenewedEasePos: easePos?.notRenewed || 0,
    };
}

async function getFollowUpData() {
    try {
        const { data, error } = await db
            .from('follow_up_logs')
            .select('id, cs_owner, outcome')
            .or('outcome.eq.no_answer,outcome.eq.callback_later');

        if (error) throw error;

        const logs = data || [];

        // Group by cs_owner
        const staffMap: Record<string, number> = {};
        for (const log of logs) {
            const owner = String(log.cs_owner);
            staffMap[owner] = (staffMap[owner] || 0) + 1;
        }

        const byStaff = Object.entries(staffMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        return {
            totalPending: logs.length,
            byStaff,
        };
    } catch (err) {
        console.error('[LINE] Error fetching follow-up:', err);
        return { totalPending: 0, byStaff: [] };
    }
}

// --- Weekly data functions (Saturday–Friday range) ---

async function getWeeklyTicketsData(start: Date, end: Date) {
    try {
        const { data, error } = await db
            .from('issues')
            .select('id, status, created_at')
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString());

        if (error) throw error;

        const issues = data || [];
        return {
            total: issues.length,
            resolved: issues.filter(i => i.status === 'เสร็จสิ้น').length,
            inProgress: issues.filter(i => i.status === 'กำลังดำเนินการ').length,
            reported: issues.filter(i => i.status === 'แจ้งเคส').length,
        };
    } catch (err) {
        console.error('[LINE] Error fetching weekly tickets:', err);
        return { total: 0, resolved: 0, inProgress: 0, reported: 0 };
    }
}

async function getWeeklyNewCustomersData(start: Date, end: Date) {
    try {
        const { data, error } = await db
            .from('customers')
            .select('id, product_type, created_at')
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString());

        if (error) throw error;

        const customers = data || [];
        return {
            total: customers.length,
            drEase: customers.filter(c => c.product_type === 'Dr.Ease').length,
            easePos: customers.filter(c => c.product_type === 'EasePos').length,
        };
    } catch (err) {
        console.error('[LINE] Error fetching weekly new customers:', err);
        return { total: 0, drEase: 0, easePos: 0 };
    }
}

async function getWeeklyFollowUpData(start: Date, end: Date) {
    try {
        const { data, error } = await db
            .from('follow_up_logs')
            .select('id, cs_owner, outcome, created_at')
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString());

        if (error) throw error;

        const logs = data || [];

        const staffMap: Record<string, number> = {};
        for (const log of logs) {
            const owner = String(log.cs_owner);
            staffMap[owner] = (staffMap[owner] || 0) + 1;
        }

        const byStaff = Object.entries(staffMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        return {
            totalThisWeek: logs.length,
            byStaff,
        };
    } catch (err) {
        console.error('[LINE] Error fetching weekly follow-up:', err);
        return { totalThisWeek: 0, byStaff: [] };
    }
}

async function getWeeklyNewSalesData() {
    try {
        const rows = await getNewSales();
        if (!rows.length) return null;

        const now = new Date();
        const thaiMonth = THAI_MONTHS[now.getMonth() + 1];
        const thaiYear = String(now.getFullYear() + 543);

        let currentRows = rows.filter(r => r.month === thaiMonth && r.year === thaiYear);
        if (!currentRows.length) {
            // Fallback: latest month
            const latestYear = rows.reduce((max, r) => r.year > max ? r.year : max, '0');
            const latestRows = rows.filter(r => r.year === latestYear);
            const latestMonth = latestRows.reduce((max, r) => {
                const idx = THAI_MONTHS.indexOf(r.month);
                return idx > THAI_MONTHS.indexOf(max) ? r.month : max;
            }, latestRows[0]?.month || '');
            currentRows = rows.filter(r => r.month === latestMonth && r.year === latestYear);
            if (!currentRows.length) return null;
        }

        const label = `${currentRows[0].month} ${currentRows[0].year.slice(-2)}`;
        const totalAmount = currentRows.reduce((sum, r) => sum + r.amount, 0);

        // Group by salesName
        const salesMap: Record<string, number> = {};
        for (const r of currentRows) {
            if (!r.salesName) continue;
            salesMap[r.salesName] = (salesMap[r.salesName] || 0) + r.amount;
        }
        const bySales = Object.entries(salesMap)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount);

        return { monthLabel: label, totalAmount, bySales };
    } catch (err) {
        console.error('[LINE] Error fetching weekly new sales:', err);
        return null;
    }
}

async function getWeeklyRenewalsAmountData() {
    try {
        const rows = await getRenewals();
        if (!rows.length) return null;

        const now = new Date();
        const thaiMonth = THAI_MONTHS[now.getMonth() + 1];
        const thaiYear = String(now.getFullYear() + 543);

        let currentRows = rows.filter(r => r.month === thaiMonth && r.year === thaiYear);
        if (!currentRows.length) {
            // Fallback: latest month
            const latestYear = rows.reduce((max, r) => r.year > max ? r.year : max, '0');
            const latestRows = rows.filter(r => r.year === latestYear);
            const latestMonth = latestRows.reduce((max, r) => {
                const idx = THAI_MONTHS.indexOf(r.month);
                return idx > THAI_MONTHS.indexOf(max) ? r.month : max;
            }, latestRows[0]?.month || '');
            currentRows = rows.filter(r => r.month === latestMonth && r.year === latestYear);
            if (!currentRows.length) return null;
        }

        const label = `${currentRows[0].month} ${currentRows[0].year.slice(-2)}`;
        const renewedAmount = currentRows.reduce((sum, r) => sum + r.renewedAmount, 0);
        const notRenewedAmount = currentRows.reduce((sum, r) => sum + r.notRenewedAmount, 0);
        const pendingAmount = currentRows.reduce((sum, r) => sum + r.pendingAmount, 0);

        return { monthLabel: label, renewedAmount, notRenewedAmount, pendingAmount };
    } catch (err) {
        console.error('[LINE] Error fetching weekly renewals amount:', err);
        return null;
    }
}

// --- Outreach report data ---

const THAI_MONTH_FULL: Record<number, string> = {
    1: 'มกราคม', 2: 'กุมภาพันธ์', 3: 'มีนาคม', 4: 'เมษายน',
    5: 'พฤษภาคม', 6: 'มิถุนายน', 7: 'กรกฎาคม', 8: 'สิงหาคม',
    9: 'กันยายน', 10: 'ตุลาคม', 11: 'พฤศจิกายน', 12: 'ธันวาคม',
};

async function getOutreachReportData(): Promise<OutreachReportData> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-indexed
    const currentYear = now.getFullYear();
    const thaiYear = String(currentYear + 543);
    const monthName = THAI_MONTH_FULL[currentMonth];

    // Fetch all data in parallel
    const [outreachRows, demoRows, leadRows] = await Promise.all([
        getOutreach(),
        getMasterDemos().catch(() => []),
        getLeads().catch(() => []),
    ]);

    // Filter outreach for current month
    const monthOutreach = outreachRows.filter(r => r.month === monthName);

    // Build daily data
    const days = monthOutreach.map(r => {
        const parts = r.date.split('/');
        const day = parseInt(parts[0]) || 0;
        return {
            day,
            drContacted: r.contactedDr,
            drQualified: r.qualifiedDr,
            easeContacted: r.contactedEase,
            easeQualified: r.qualifiedEase,
        };
    }).sort((a, b) => a.day - b.day);

    // Summary
    const summary = {
        drContacted: days.reduce((s, d) => s + d.drContacted, 0),
        drQualified: days.reduce((s, d) => s + d.drQualified, 0),
        easeContacted: days.reduce((s, d) => s + d.easeContacted, 0),
        easeQualified: days.reduce((s, d) => s + d.easeQualified, 0),
    };

    // Demos for current month — only count completed demos
    const monthDemos = demoRows.filter(r => {
        if (!r.date) return false;
        const parts = r.date.split('/');
        if (parseInt(parts[1]) !== currentMonth || parseInt(parts[2]) !== currentYear) return false;
        const st = (r.demoStatus || '').toLowerCase();
        return st.includes('demo แล้ว') || st.includes('เสร็จ');
    });
    const demoMap: Record<string, number> = {};
    for (const d of monthDemos) {
        const name = d.salesName || '?';
        demoMap[name] = (demoMap[name] || 0) + 1;
    }
    const demos = Object.entries(demoMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    // Leads for current month
    const monthLeads = leadRows.filter(r => {
        if (!r.date) return false;
        const parts = r.date.split('/');
        return parseInt(parts[1]) === currentMonth && parseInt(parts[2]) === currentYear;
    });

    return {
        monthLabel: `${monthName} ${thaiYear}`,
        days,
        summary,
        demos,
        totalLeads: monthLeads.length,
    };
}
