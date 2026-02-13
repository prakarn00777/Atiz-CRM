// LINE Flex Message builder for Weekly Report — Theme #7053E1

const BRAND = '#7053E1';
const EASEPOS = '#F76D85';
const TEXT_DARK = '#2D2D2D';
const TEXT_SUB = '#888888';

export interface WeeklyTicketsData {
    total: number;
    resolved: number;
    inProgress: number;
    reported: number;
}

export interface WeeklyRenewalData {
    monthLabel: string;
    totalCount: number;
    drEaseCount: number;
    easePosCount: number;
    renewed: number;
    renewedDrEase: number;
    renewedEasePos: number;
    pending: number;
    pendingDrEase: number;
    pendingEasePos: number;
    notRenewed: number;
    notRenewedDrEase: number;
    notRenewedEasePos: number;
}

export interface WeeklyFollowUpData {
    totalThisWeek: number;
    byStaff: { name: string; count: number }[];
}

export interface WeeklyNewCustomersData {
    total: number;
    drEase: number;
    easePos: number;
}

export interface WeeklyNewSalesData {
    monthLabel: string;
    totalAmount: number;
    bySales: { name: string; amount: number }[];
}

export interface WeeklyRenewalsAmountData {
    monthLabel: string;
    renewedAmount: number;
    notRenewedAmount: number;
    pendingAmount: number;
}

export interface WeeklyReportData {
    weekRange: string; // e.g. "8–14 ก.พ. 69"
    tickets: WeeklyTicketsData;
    renewal: WeeklyRenewalData | null;
    newSales: WeeklyNewSalesData | null;
    renewalsAmount: WeeklyRenewalsAmountData | null;
    newCustomers: WeeklyNewCustomersData;
    followUp: WeeklyFollowUpData;
}

export function buildWeeklyReportFlex(data: WeeklyReportData): object {
    const body: object[] = [];

    // --- Tickets ---
    body.push(
        sectionTitle('🎫 Tickets สัปดาห์นี้'),
        row('รวม', `${data.tickets.total} เคส`, TEXT_DARK),
    );
    if (data.tickets.resolved > 0) body.push(row('แก้ไขแล้ว', `${data.tickets.resolved}`, '#27ae60'));
    if (data.tickets.inProgress > 0) body.push(row('กำลังดำเนินการ', `${data.tickets.inProgress}`, '#f39c12'));
    if (data.tickets.reported > 0) body.push(row('แจ้งเคสใหม่', `${data.tickets.reported}`, '#e74c3c'));

    body.push(sep());

    // --- Renewal ---
    if (data.renewal) {
        const r = data.renewal;
        body.push(
            sectionTitle('🔄 Renewal'),
            {
                type: 'box', layout: 'horizontal', margin: 'sm',
                contents: [
                    { type: 'text', text: 'รวม', size: 'xs', color: TEXT_SUB, flex: 3 },
                    { type: 'text', text: `${r.totalCount}`, size: 'xs', color: TEXT_DARK, weight: 'bold', flex: 0 },
                    { type: 'text', text: '(', size: 'xs', color: TEXT_SUB, flex: 0, margin: 'sm' },
                    { type: 'text', text: `${r.drEaseCount}`, size: 'xs', color: BRAND, weight: 'bold', flex: 0 },
                    { type: 'text', text: '/', size: 'xs', color: TEXT_SUB, flex: 0 },
                    { type: 'text', text: `${r.easePosCount}`, size: 'xs', color: EASEPOS, weight: 'bold', flex: 0 },
                    { type: 'text', text: ')', size: 'xs', color: TEXT_SUB, flex: 0 },
                ],
            },
            renewalRow('✅ ต่อแล้ว', r.renewed, r.renewedDrEase, r.renewedEasePos, '#27ae60'),
            renewalRow('⏳ รอ', r.pending, r.pendingDrEase, r.pendingEasePos, '#f39c12'),
            renewalRow('❌ ไม่ต่อ', r.notRenewed, r.notRenewedDrEase, r.notRenewedEasePos, '#e74c3c'),
        );
        body.push(sep());
    }

    // --- New Customers ---
    if (data.newCustomers.total > 0) {
        body.push(
            sectionTitle('🆕 ลูกค้าใหม่'),
            row('รวม', `${data.newCustomers.total} ราย`, TEXT_DARK),
        );
        if (data.newCustomers.drEase > 0) body.push(row('Dr.Ease', `${data.newCustomers.drEase}`, BRAND));
        if (data.newCustomers.easePos > 0) body.push(row('EasePos', `${data.newCustomers.easePos}`, EASEPOS));
        body.push(sep());
    }

    // --- Follow-up ---
    body.push(
        sectionTitle('📞 Follow-up สัปดาห์นี้'),
        row('รวม', `${data.followUp.totalThisWeek} ราย`, TEXT_DARK),
    );

    body.push(sep());

    // --- New Sales ---
    if (data.newSales) {
        body.push(
            sectionTitle(`💰 New Sales (${data.newSales.monthLabel})`),
            row('ยอดรวม', `${data.newSales.totalAmount.toLocaleString()} บาท`, TEXT_DARK),
        );
        body.push(sep());
    }

    // --- Renewals Amount ---
    if (data.renewalsAmount) {
        const ra = data.renewalsAmount;
        body.push(
            sectionTitle(`📄 Renewals (${ra.monthLabel})`),
            row('ต่อสัญญา', `${ra.renewedAmount.toLocaleString()} บาท`, TEXT_DARK),
        );
    }

    return {
        type: 'flex',
        altText: `📋 Weekly Report ${data.weekRange}`,
        contents: {
            type: 'bubble',
            size: 'kilo',
            header: {
                type: 'box',
                layout: 'horizontal',
                contents: [
                    { type: 'text', text: '📋 Weekly Report', weight: 'bold', size: 'sm', color: '#ffffff', flex: 0 },
                    { type: 'text', text: data.weekRange, size: 'xs', color: '#D4C8F5', align: 'end' },
                ],
                backgroundColor: BRAND,
                paddingAll: '14px',
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: body,
                paddingAll: '14px',
                spacing: 'xs',
            },
        },
    };
}

function sectionTitle(text: string): object {
    return {
        type: 'text',
        text,
        weight: 'bold',
        size: 'sm',
        color: BRAND,
        margin: 'sm',
    };
}

function row(label: string, value: string, valueColor = TEXT_DARK): object {
    if (!value) {
        return { type: 'text', text: label, size: 'xs', color: TEXT_SUB, margin: 'xs' };
    }
    return {
        type: 'box',
        layout: 'horizontal',
        contents: [
            { type: 'text', text: label, size: 'xs', color: TEXT_SUB, flex: 3 },
            { type: 'text', text: value, size: 'xs', color: valueColor, align: 'end', weight: 'bold', flex: 2 },
        ],
        margin: 'xs',
    };
}

function renewalRow(label: string, total: number, drEase: number, easePos: number, labelColor: string): object {
    return {
        type: 'box', layout: 'horizontal', margin: 'xs',
        contents: [
            { type: 'text', text: `${label} ${total}`, size: 'xs', color: labelColor, weight: 'bold', flex: 3 },
            { type: 'text', text: `${drEase}`, size: 'xs', color: BRAND, align: 'end', weight: 'bold', flex: 0 },
            { type: 'text', text: '/', size: 'xs', color: TEXT_SUB, align: 'center', flex: 0 },
            { type: 'text', text: `${easePos}`, size: 'xs', color: EASEPOS, weight: 'bold', flex: 0 },
        ],
    };
}

function sep(): object {
    return { type: 'separator', color: '#f0f0f0', margin: 'md' };
}

// Utility: get Saturday–Friday range for current week
export function getWeekRange(): { start: Date; end: Date; label: string } {
    const THAI_MONTHS = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 6=Sat

    // Find most recent Saturday (start of week)
    const diffToSat = day === 6 ? 0 : day + 1; // if Sat=0, Sun=2, Mon=3, ...
    const start = new Date(now);
    start.setDate(now.getDate() - diffToSat);
    start.setHours(0, 0, 0, 0);

    // Friday = start + 6 days
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const thaiYear = String(now.getFullYear() + 543).slice(-2);
    const startMonth = THAI_MONTHS[start.getMonth() + 1];
    const endMonth = THAI_MONTHS[end.getMonth() + 1];

    const label = startMonth === endMonth
        ? `${start.getDate()}–${end.getDate()} ${endMonth} ${thaiYear}`
        : `${start.getDate()} ${startMonth}–${end.getDate()} ${endMonth} ${thaiYear}`;

    return { start, end, label };
}
