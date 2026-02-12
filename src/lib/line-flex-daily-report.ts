// LINE Flex Message builder for Daily Report — Theme #7053E1

const BRAND = '#7053E1';
const BRAND_LIGHT = '#EDE9FB';
const TEXT_DARK = '#2D2D2D';
const TEXT_SUB = '#888888';

export interface TicketsData {
    total: number;
    resolved: number;
    inProgress: number;
    reported: number;
}

export interface RenewalData {
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

export interface FollowUpData {
    totalPending: number;
    byStaff: { name: string; count: number }[];
}

export interface DailyReportData {
    date: string;
    tickets: TicketsData;
    renewal: RenewalData | null;
    followUp: FollowUpData;
}

export function buildDailyReportFlex(data: DailyReportData): object {
    const body: object[] = [];

    // --- Tickets ---
    body.push(
        sectionTitle('🎫 Tickets'),
        row(`รวม ${data.tickets.total} เคส`, ''),
    );
    if (data.tickets.resolved > 0) body.push(row('แก้ไขแล้ว', `${data.tickets.resolved}`, '#27ae60'));
    if (data.tickets.inProgress > 0) body.push(row('กำลังดำเนินการ', `${data.tickets.inProgress}`, '#f39c12'));
    if (data.tickets.reported > 0) body.push(row('แจ้งเคสใหม่', `${data.tickets.reported}`, '#e74c3c'));

    body.push(sep());

    // --- Renewal ---
    if (data.renewal) {
        const r = data.renewal;
        body.push(
            sectionTitle(`🔄 Renewal ${r.monthLabel}`),
            {
                type: 'text', text: `${r.totalCount} ราย (${r.drEaseCount}/${r.easePosCount})`,
                size: 'xs', color: TEXT_SUB, margin: 'sm',
            },
            row(`✅ ต่อแล้ว ${r.renewed}`, `${r.renewedDrEase}/${r.renewedEasePos}`, '#27ae60'),
            row(`⏳ รอ ${r.pending}`, `${r.pendingDrEase}/${r.pendingEasePos}`, '#f39c12'),
            row(`❌ ไม่ต่อ ${r.notRenewed}`, `${r.notRenewedDrEase}/${r.notRenewedEasePos}`, '#e74c3c'),
        );
        body.push(sep());
    }

    // --- Follow-up ---
    body.push(
        sectionTitle('📞 Follow-up'),
        row(`ต้องติดตาม`, `${data.followUp.totalPending} ราย`, BRAND),
    );
    for (const s of data.followUp.byStaff) {
        body.push(row(s.name, `${s.count}`, s.count > 0 ? TEXT_DARK : '#cccccc'));
    }

    return {
        type: 'flex',
        altText: `📊 Daily Report ${data.date}`,
        contents: {
            type: 'bubble',
            size: 'kilo',
            header: {
                type: 'box',
                layout: 'horizontal',
                contents: [
                    { type: 'text', text: '📊 Daily Report', weight: 'bold', size: 'sm', color: '#ffffff', flex: 0 },
                    { type: 'text', text: data.date, size: 'xs', color: '#ffffffcc', align: 'end' },
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
            { type: 'text', text: value, size: 'xs', color: valueColor, align: 'end', weight: 'bold', flex: 1 },
        ],
        margin: 'xs',
    };
}

function sep(): object {
    return { type: 'separator', color: '#f0f0f0', margin: 'md' };
}
